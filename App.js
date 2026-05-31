/**
 * FYNX — App.js v5.1.0
 * Flujo: Init → Carousel(1x) → Auth → Setup(nuevo) → Dashboard
 * PATCH v5.1: Reescritura completa del ciclo de auth/persistencia.
 *   - Estado de carga explícito durante fetch de Firestore
 *   - Retry + fallback local si Firestore falla
 *   - Cierre de sesión selectivo (preserva lang, carousel)
 *   - Corrección de stale closure en handleAuth
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StatusBar, InteractionManager, AppState, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as LocalAuthentication from "expo-local-authentication";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FinanceProvider, useFinance } from "./src/context/FinanceContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { WelcomeCarousel } from "./src/screens/WelcomeCarousel";
import { SetupFormScreen } from "./src/screens/SetupFormScreen";
import { LegalScreen } from "./src/screens/LegalScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { DARK_THEME as TH } from "./src/constants/themes";
import { descargarDatos, escucharSesion, sincronizarDatos } from "./src/services/firebase";
import { loadApp, saveApp } from "./src/utils/security";
import { STORE_KEY } from "./src/constants";
import { useLanguage } from "./src/context/LanguageContext";
import { locales } from "./src/constants/locales";
import "./src/services/notifications";
import { UpdateChecker } from "./src/components/UpdateChecker";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Serializa el objeto de usuario de Firebase a un objeto plano seguro
// Esto evita un crash fatal al hacer JSON.stringify de referencias circulares
const serializeUser = (u) => {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email || "",
    name: u.displayName || u.name || u.email?.split("@")[0] || "Usuario",
    photoURL: u.photoURL || null,
  };
};

import { usePostHog } from 'posthog-react-native';
import { initRevenueCat, isUserPremium } from "./src/services/revenuecat";

const CAROUSEL_KEY = "@fynx_carousel_visto";
const SESSION_KEY = "@fynx_session";

// Keys que NO se borran al cerrar sesión
const KEYS_TO_PRESERVE = [CAROUSEL_KEY, "@fynx_lang"];

// Flag global para saber si AdMob está listo
import { setAdMobReady } from "./src/services/admob";

// ── Shell principal ───────────────────────────────────────────────────────────
function AppShell() {
  const { appState, setAppState, updateState, T } = useFinance();
  const tema = T || TH;
  const premium = appState?.user?.premium || false;

  const { lang } = useLanguage();
  const t_load = locales[lang]?.loading || { verificando: "Verificando...", cargando: "Cargando...", sesion: "Recuperando...", perfil: "Cargando..." };

  // fases: init | carousel | auth | loading | setup | app
  const [fase, setFase] = useState("init");
  const [usuario, setUsuario] = useState(null);
  const [loadMsg, setLoadMsg] = useState(t_load.verificando);
  const initialized = useRef(false);
  const authUnsub = useRef(null);

  // iOS AppState & Security
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(0);
  const [showBlur, setShowBlur] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const triggerBiometrics = async () => {
    setIsAuthenticating(true);
    setShowBlur(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Desbloquea Fynx Elite',
          fallbackLabel: 'Usar código',
          disableDeviceFallback: false,
          cancelLabel: 'Cancelar'
        });
        if (result.success) {
           setShowBlur(false);
        }
      } else {
         setShowBlur(false);
      }
    } catch(e) {
      setShowBlur(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Blur logic for App Switcher
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        setShowBlur(true);
      } else if (nextAppState === 'active') {
        if (!isAuthenticating) setShowBlur(false);
      }

      // Biometric logic
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        const timeAway = Date.now() - backgroundTimeRef.current;
        // Require auth if > 2 minutes (120000 ms) and it wasn't a fresh boot
        if (timeAway > 120000 && backgroundTimeRef.current !== 0) {
          triggerBiometrics();
        } else {
          if (!isAuthenticating) setShowBlur(false);
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (appStateRef.current === 'active') {
           backgroundTimeRef.current = Date.now();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isAuthenticating]);

  // ── Carga y fusión de datos del usuario ──────────────────────────────────
  // Intenta local primero, luego Firestore. Siempre resuelve (nunca lanza).
  const loadAndMergeUserData = useCallback(async (session) => {
    // 1. Caché local — lectura instantánea sin red
    const local = await loadApp();
    const localValido = local && (local.setupCompleted || local.onboarded) && local.user;

    // Si tenemos caché local válido, lo mostramos INMEDIATAMENTE.
    // Esto elimina el delay de 2-3 segundos de red al abrir la app.
    if (localValido) {
      if (session?.uid && local.user) local.user.uid = session.uid;
      setAppState(local);

      // Sincronización silenciosa en background sin bloquear la UI
      if (session?.uid) {
        InteractionManager.runAfterInteractions(async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
            const remoto = await Promise.race([descargarDatos(session.uid), timeoutPromise]);

            const hasData = remoto && (
              (remoto.expenses && remoto.expenses.length > 0) ||
              (remoto.income && remoto.income.length > 0) ||
              (remoto.budgets && Object.keys(remoto.budgets).length > 0) ||
              (remoto.user && remoto.user.currency)
            );
            const remotoValido = remoto && (remoto.setupCompleted || remoto.onboarded || hasData);

            // Si hay datos remotos válidos, actualizamos el estado silenciosamente
            if (remotoValido) {
              const merged = {
                ...remoto,
                onboarded: true,
                setupCompleted: true,
                user: {
                  ...(remoto.user || {}),
                  uid: session.uid,
                  email: session.email || remoto.user?.email,
                },
              };
              await saveApp(merged);
              setAppState(merged);
            }
          } catch (e) {
            console.log("[App] Background sync skipped/failed:", e.message);
          }
        });
      }
      return "app";
    }

    // 2. Si NO tenemos caché local, obligatoriamente bloqueamos para esperar a Firestore
    let remoto = null;
    if (session?.uid) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firestore timeout")), 8000)
        );
        remoto = await Promise.race([descargarDatos(session.uid), timeoutPromise]);
      } catch (e) {
        console.warn("[App] Firestore fetch failed:", e.message);
      }
    }

    const hasData = remoto && (
      (remoto.expenses && remoto.expenses.length > 0) ||
      (remoto.income && remoto.income.length > 0) ||
      (remoto.budgets && Object.keys(remoto.budgets).length > 0) ||
      (remoto.user && remoto.user.currency)
    );
    const remotoValido = remoto && (remoto.setupCompleted || remoto.onboarded || hasData);

    if (remotoValido) {
      const merged = {
        ...remoto,
        onboarded: true,
        setupCompleted: true,
        user: {
          ...(remoto.user || {}),
          uid: session?.uid || remoto.user?.uid,
          email: session?.email || remoto.user?.email,
        },
      };
      await saveApp(merged);
      setAppState(merged);
      setTimeout(() => {
        if (merged.user?.uid) sincronizarDatos(merged.user.uid, merged);
      }, 1500);
      return "app";
    }

    // 3. Sin datos en ningún lado → Setup obligatorio
    return "setup";
  }, [setAppState]);

  // ── Inicialización — una sola vez ────────────────────────────────────────
  useEffect(() => {
    if (initialized.current || appState === null) return;
    initialized.current = true;

    (async () => {
      try {
        // ── Leer storage primero (rápido, no bloquea UI) ──────────────────
        let [carouselVisto, sessionRaw, rawStore] = await Promise.all([
          AsyncStorage.getItem(CAROUSEL_KEY),
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(STORE_KEY)
        ]);

        // Auto-skip carousel for existing users updating to V5
        if (!carouselVisto && (sessionRaw || rawStore)) {
          await AsyncStorage.setItem(CAROUSEL_KEY, "1");
          carouselVisto = "1";
        }

        if (!carouselVisto) { setFase("carousel"); return; }

        if (sessionRaw) {
          try {
            const session = JSON.parse(sessionRaw);
            setUsuario(session);
            const destino = await loadAndMergeUserData(session);
            setFase(destino);
          } catch (e) {
            console.warn("[App] Session parse error:", e);
            setFase("auth");
          }
          return;
        }

        setFase("auth");
      } catch {
        setFase("auth");
      } finally {
        // ── AdMob + RevenueCat en background DESPUÉS de renderizar UI ────
        // InteractionManager garantiza que no bloquean el primer frame
        InteractionManager.runAfterInteractions(async () => {
          // App Tracking Transparency
          try {
            await requestTrackingPermissionsAsync();
          } catch(e) {}

          // AdMob
          try {
            const mobileAds = require("react-native-google-mobile-ads").default;
            mobileAds().initialize()
              .then(() => setAdMobReady(true))
              .catch(e => console.warn("AdMob init failed (non-fatal)", e));
          } catch (e) { console.warn("AdMob require failed", e); }

          // RevenueCat
          try {
            initRevenueCat().catch(e => console.warn("RevenueCat init failed", e));
          } catch (e) { }
        });
      }
    })();
  }, [appState, loadAndMergeUserData]);

  // ── Safety net Firebase ──────────────────────────────────────────────────
  useEffect(() => {
    authUnsub.current = escucharSesion(async (firebaseUser) => {
      // Caso 1: Cierre de sesión — siempre manda a auth
      if (!firebaseUser) {
        if (fase !== "auth" && fase !== "carousel" && fase !== "init") {
          console.log("[Auth] Usuario null detectado, redirigiendo a login.");
          setUsuario(null);
          setAppState({ onboarded: false });
          AsyncStorage.removeItem(SESSION_KEY).catch(() => { });
          setFase("auth");
        }
        return;
      }

      // Caso 2: Usuario logueado detectado — solo actuar si estamos en 'auth'
      // Si ya estamos en 'app' o 'setup', no interferir con el flujo actual
      if (fase === "auth" && !usuario) {
        console.log("[Auth] Usuario detectado, iniciando carga de datos...");
        const sUser = serializeUser(firebaseUser);
        setUsuario(sUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sUser));
        setLoadMsg(t_load.sesion);
        setFase("loading");
        const destino = await loadAndMergeUserData(firebaseUser);
        setFase(destino);
      }
    });

    return () => {
      if (authUnsub.current) authUnsub.current();
    };
  }, [fase, usuario, loadAndMergeUserData, t_load.sesion]);

  // ── Ocultar SplashScreen cuando la carga finalice ──────────────────────
  useEffect(() => {
    if (fase === "app" || fase === "setup" || fase === "auth" || fase === "carousel") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fase]);

  const posthog = usePostHog();

  useEffect(() => {
    if (fase === "app") {
      posthog?.capture('app_opened', { premium });

      InteractionManager.runAfterInteractions(() => {
        // Update Android widget on boot (protegido)
        try {
          const { updateFynxWidgetLocal } = require("./widget-task");
          Promise.resolve(updateFynxWidgetLocal()).catch(() => { });
        } catch (e) { }

        // Inicializar notificaciones de forma diferida (no bloqueante)
        setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            try {
              const notif = require("./src/services/notifications");
              notif.registerForPushNotificationsAsync().then(granted => {
                if (granted) notif.scheduleSmartNotifications(appState, {});
              });
            } catch (e) { console.warn("Notif init failed", e); }
          });
        }, 1000);
      });
    }
  }, [fase, premium, posthog]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCarouselDone = useCallback(async () => {
    await AsyncStorage.setItem(CAROUSEL_KEY, "1");
    setFase("auth");
  }, []);

  const handleAuth = useCallback(async (user) => {
    try {
      if (!user?.uid) throw new Error("User object inválido");

      const sUser = serializeUser(user);
      setUsuario(sUser);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sUser));

      setLoadMsg(t_load.perfil);
      setFase("loading");

      const destino = await loadAndMergeUserData(user);

      // Sync premium status from RevenueCat immediately after login
      try {
        const premiumStatus = await isUserPremium();
        if (premiumStatus) {
          updateState({ user: { ...sUser, premium: true } });
        }
      } catch (e) { }

      InteractionManager.runAfterInteractions(() => {
        setFase(destino);
      });
    } catch (e) {
      console.error("[App] Error en handleAuth:", e);
      InteractionManager.runAfterInteractions(() => {
        setFase("setup");
      });
    }
  }, [loadAndMergeUserData]);

  const handleSetupComplete = useCallback(async (userData) => {
    // Usar updateState para asegurar que se guarde en AsyncStorage inmediatamente
    updateState(userData);
    InteractionManager.runAfterInteractions(() => {
      setFase("app");
    });
  }, [updateState]);

  // ── Render por fase ──────────────────────────────────────────────────────

  if (appState === null || fase === "init") {
    return (
      <View style={{ flex: 1, backgroundColor: TH.bg, alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
        <Text style={{ fontSize: 34, color: TH.gold, fontWeight: "700", letterSpacing: -2 }}>FX</Text>
        <ActivityIndicator color={TH.gold} size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Pantalla de carga explícita — previene condiciones de carrera
  if (fase === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: TH.bg, alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
        <Text style={{ fontSize: 28, color: TH.gold, fontWeight: "700", letterSpacing: -1.5, marginBottom: 32 }}>Fynx</Text>
        <ActivityIndicator color={TH.gold} size="large" />
        <Text style={{ fontSize: 12, color: TH.t3, marginTop: 16, letterSpacing: 1 }}>{loadMsg}</Text>
      </View>
    );
  }

  if (fase === "carousel") return <WelcomeCarousel onDone={handleCarouselDone} />;

  if (fase === "auth") return <AuthScreen onAuth={handleAuth} />;

  if (fase === "setup") {
    return (
      <SetupFormScreen
        uid={usuario?.uid || "local"}
        email={usuario?.email || ""}
        onComplete={handleSetupComplete}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={tema.bg} />
      <View style={{ flex: 1 }}>
        {!appState?.onboarded
          ? <OnboardingScreen />
          : <AppNavigator />
        }
      </View>
      {/* Update checker — silencioso, aparece 3s después del arranque */}
      <UpdateChecker lang={lang} />
      
      {/* IOS: Blur Overlay for App Switcher & Auth */}
      {showBlur && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
           <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
      )}
    </View>
  );
}

// ── Providers ─────────────────────────────────────────────────────────────────
import { LanguageProvider } from "./src/context/LanguageContext";
import { AlertProvider } from "./src/context/AlertContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from 'posthog-react-native';
import { useFonts as useJetBrains, JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoadedJetBrains] = useJetBrains({ JetBrainsMono_400Regular, JetBrainsMono_700Bold });
  const [fontsLoadedInter] = useInter({ Inter_400Regular, Inter_500Medium, Inter_700Bold });

  if (!fontsLoadedJetBrains || !fontsLoadedInter) return null;

  return (
    <PostHogProvider apiKey="phc_D7wFX6gZqLxqZrJJeud2ffwswVdEnG5FsbxERqfXW6MM" options={{ host: "https://us.posthog.com" }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <FinanceProvider>
            <AlertProvider>
              <AppShell />
            </AlertProvider>
          </FinanceProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </PostHogProvider>
  );
}
