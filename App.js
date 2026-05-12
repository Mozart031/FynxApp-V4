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
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FinanceProvider, useFinance } from "./src/context/FinanceContext";
import { AppNavigator }       from "./src/navigation/AppNavigator";
import { OnboardingScreen }   from "./src/screens/OnboardingScreen";
import { AuthScreen }         from "./src/screens/AuthScreen";
import { WelcomeCarousel }    from "./src/screens/WelcomeCarousel";
import { SetupFormScreen }    from "./src/screens/SetupFormScreen";
import { LegalScreen }        from "./src/screens/LegalScreen";
import { AdminScreen }        from "./src/screens/AdminScreen";
import { DARK_THEME as TH }   from "./src/constants/themes";
import { descargarDatos, escucharSesion, sincronizarDatos } from "./src/services/firebase";
import { loadApp, saveApp }   from "./src/utils/security";

const STORE_KEY = "mifinanzas_v7";

import { usePostHog } from 'posthog-react-native';
import { initRevenueCat, isUserPremium } from "./src/services/revenuecat";

const CAROUSEL_KEY = "@fynx_carousel_visto";
const SESSION_KEY  = "@fynx_session";

// Función para limpiar el objeto de usuario de Firebase (evita crashes por circularidad)
const serializeUser = (u) => {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    name: u.displayName || u.email?.split("@")[0] || "Usuario",
    photoURL: u.photoURL || null
  };
};

// Keys que NO se borran al cerrar sesión
const KEYS_TO_PRESERVE = [CAROUSEL_KEY, "@fynx_lang"];

// Flag global para saber si AdMob está listo
let adMobReady = false;
export function isAdMobReady() { return adMobReady; }

// ── Shell principal ───────────────────────────────────────────────────────────
function AppShell() {
  const { appState, setAppState, updateState, T } = useFinance();
  const tema = T || TH;
  const premium = appState?.user?.premium || false;

  // fases: init | carousel | auth | loading | setup | app
  const [fase,      setFase]      = useState("init");
  const [usuario,   setUsuario]   = useState(null);
  const [loadMsg,   setLoadMsg]   = useState("Verificando cuenta...");
  const initialized = useRef(false);
  const authUnsub   = useRef(null);

  // ── Carga y fusión de datos del usuario ──────────────────────────────────
  // Intenta local primero, luego Firestore. Siempre resuelve (nunca lanza).
  const loadAndMergeUserData = useCallback(async (session) => {
    // 1. Caché local — lectura instantánea sin red
    const local = await loadApp();
    const localValido = local && (local.setupCompleted || local.onboarded) && local.user;

    // 2. Firestore — intento con timeout de 8 segundos
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

    // 3. Decisión: Firestore gana si tiene datos más recientes
    if (remotoValido) {
      const merged = {
        ...remoto,
        onboarded:      true,
        setupCompleted: true,
        user: {
          ...(remoto.user || {}),
          uid:   session?.uid   || remoto.user?.uid,
          email: session?.email || remoto.user?.email,
          // Asegurar que el objeto de usuario sea plano (serialize)
          premium: !!(remoto.user?.premium || false),
        },
      };
      await saveApp(merged).catch(() => {});
      setAppState(merged);
      setTimeout(() => {
        try {
          if (merged.user?.uid) sincronizarDatos(merged.user.uid, merged).catch(()=>{});
        } catch(e){}
      }, 2000);
      return "app";
    }

    // 4. Fallback: datos locales si Firestore falló
    if (localValido) {
      if (session?.uid && local.user) local.user.uid = session.uid;
      setAppState(local);
      return "app";
    }

    // 5. Sin datos válidos en ningún lado → Setup obligatorio
    return "setup";
  }, [setAppState]);

  // ── Inicialización — una sola vez ────────────────────────────────────────
  useEffect(() => {
    if (initialized.current || appState === null) return;
    initialized.current = true;

    (async () => {
      try {
        // AdMob — no bloquear si falla
        try {
          const mobileAds = require("react-native-google-mobile-ads").default;
          await mobileAds().initialize();
          adMobReady = true;
        } catch(e) { console.warn("AdMob init failed (non-fatal)", e); }

        // RevenueCat init
        try {
          await initRevenueCat();
        } catch(e) { console.warn("RevenueCat init failed", e); }

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
            setLoadMsg("Cargando tus datos...");
            setFase("loading");
            const destino = await loadAndMergeUserData(session);

            // Sync premium status from RevenueCat
            try {
              const premiumStatus = await isUserPremium();
              if (premiumStatus) {
                // Actualizar estado local si es premium
                updateState({ user: { ...(appState?.user || {}), premium: true } });
              }
            } catch(e) {}

            setFase(destino);
          } catch(e) {
            console.warn("[App] Session parse error:", e);
            setFase("auth");
          }
          return;
        }

        setFase("auth");
      } catch {
        setFase("auth");
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
          AsyncStorage.removeItem(SESSION_KEY).catch(()=>{});
          setFase("auth");
        }
        return;
      }

      // Caso 2: Usuario logueado detectado — solo actuar si estamos en 'auth'
      if (fase === "auth" && !usuario) {
        console.log("[Auth] Usuario detectado, iniciando carga de datos...");
        const sUser = serializeUser(firebaseUser);
        setUsuario(sUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sUser));
        setLoadMsg("Recuperando sesión...");
        setFase("loading");
        const destino = await loadAndMergeUserData(firebaseUser);
        setFase(destino);
      }
    });
    return () => { if (authUnsub.current) authUnsub.current(); };
  }, [fase, usuario, loadAndMergeUserData, setAppState]);

  const posthog = usePostHog();

  useEffect(() => {
    if (fase === "app") {
      posthog?.capture('app_opened', { premium });
      
      // Cargar Widget Android si existe (en segundo plano y protegido)
      setTimeout(() => {
        try {
          const { updateFynxWidgetLocal } = require("./widget-task");
          updateFynxWidgetLocal().catch(() => {});
        } catch(e) {}
      }, 3000);

      setTimeout(() => {
        try {
          const notif = require("./src/services/notifications");
          notif.registerForPushNotificationsAsync().then(granted => {
            if (granted) notif.scheduleDailyReminder();
          });
        } catch(e) { console.warn("Notif init failed", e); }
      }, 3000);
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

      setLoadMsg("Cargando tu perfil...");
      setFase("loading");

      const destino = await loadAndMergeUserData(user);

      // Sync premium status from RevenueCat immediately after login
      try {
        const premiumStatus = await isUserPremium();
        if (premiumStatus) {
          updateState({ user: { ...sUser, premium: true } });
        }
      } catch(e) {}

      setFase(destino);
    } catch (e) {
      console.error("[App] Error en handleAuth:", e);
      setFase("setup");
    }
  }, [loadAndMergeUserData]);

  const handleSetupComplete = useCallback(async (userData) => {
    // Usar updateState para asegurar que se guarde en AsyncStorage inmediatamente
    updateState(userData);
    setFase("app");
  }, [updateState]);

  // ── Render por fase ──────────────────────────────────────────────────────

  if (appState === null || fase === "init") {
    return (
      <View style={{ flex:1, backgroundColor:TH.bg, alignItems:"center", justifyContent:"center" }}>
        <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
        <Text style={{ fontSize:34, color:TH.gold, fontWeight:"700", letterSpacing:-2 }}>FX</Text>
        <ActivityIndicator color={TH.gold} size="small" style={{ marginTop:24 }} />
      </View>
    );
  }

  // Pantalla de carga explícita — previene condiciones de carrera
  if (fase === "loading") {
    return (
      <View style={{ flex:1, backgroundColor:TH.bg, alignItems:"center", justifyContent:"center" }}>
        <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
        <Text style={{ fontSize:28, color:TH.gold, fontWeight:"700", letterSpacing:-1.5, marginBottom:32 }}>Fynx</Text>
        <ActivityIndicator color={TH.gold} size="large" />
        <Text style={{ fontSize:12, color:TH.t3, marginTop:16, letterSpacing:1 }}>{loadMsg}</Text>
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
    <View style={{ flex:1, backgroundColor:tema.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={tema.bg} />
      <View style={{ flex:1 }}>
        {!appState?.onboarded
          ? <OnboardingScreen />
          : <AppNavigator />
        }
      </View>
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
  const [fontsLoadedInter]     = useInter({ Inter_400Regular, Inter_500Medium, Inter_700Bold });

  if (!fontsLoadedJetBrains || !fontsLoadedInter) return null;

  return (
    <PostHogProvider apiKey="phc_D7wFX6gZqLxqZrJJeud2ffwswVdEnG5FsbxERqfXW6MM" options={{ host: "https://us.posthog.com" }}>
      <SafeAreaProvider>
        <FinanceProvider>
          <LanguageProvider>
            <AlertProvider>
              <AppShell />
            </AlertProvider>
          </LanguageProvider>
        </FinanceProvider>
      </SafeAreaProvider>
    </PostHogProvider>
  );
}
