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
import { usePostHog } from 'posthog-react-native';

const CAROUSEL_KEY = "@fynx_carousel_visto";
const SESSION_KEY  = "@fynx_session";

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
        },
      };
      await saveApp(merged);        // Actualizar caché local
      setAppState(merged);          // Hidratar estado React
      // Refrescar Firestore con uid correcto en background (no bloquear)
      setTimeout(() => {
        if (merged.user?.uid) sincronizarDatos(merged.user.uid, merged);
      }, 1500);
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

        const [carouselVisto, sessionRaw] = await Promise.all([
          AsyncStorage.getItem(CAROUSEL_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);

        if (!carouselVisto) { setFase("carousel"); return; }

        if (sessionRaw) {
          try {
            const session = JSON.parse(sessionRaw);
            setUsuario(session);
            setLoadMsg("Cargando tus datos...");
            setFase("loading");
            const destino = await loadAndMergeUserData(session);
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
      if (!firebaseUser) {
        if (fase === "app" || fase === "setup") {
          setUsuario(null);
          setAppState({ onboarded: false });
          await AsyncStorage.removeItem(SESSION_KEY);
          setFase("auth");
        }
        return;
      }
      if (fase === "auth" && !usuario) {
        setUsuario(firebaseUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(firebaseUser));
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

      setUsuario(user);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));

      setLoadMsg("Cargando tu perfil...");
      setFase("loading");

      const destino = await loadAndMergeUserData(user);
      setFase(destino);
    } catch (e) {
      console.error("[App] Error en handleAuth:", e);
      setFase("setup");
    }
  }, [loadAndMergeUserData]);

  const handleSetupComplete = useCallback(async (userData) => {
    setAppState(userData);
    setFase("app");
  }, [setAppState]);

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
