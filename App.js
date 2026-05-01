/**
 * FYNX — App.js v5.0.2
 * Flujo: Init → Carousel(1x) → Auth → Setup(nuevo) → Dashboard
 * Sin animación de entrada. AdMob se inicializa antes de renderizar.
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FinanceProvider, useFinance } from "./src/context/FinanceContext";
import { AppNavigator }       from "./src/navigation/AppNavigator";
import { OnboardingScreen }   from "./src/screens/OnboardingScreen";
import { AuthScreen }         from "./src/screens/AuthScreen";
import { WelcomeCarousel }    from "./src/screens/WelcomeCarousel";
import { SetupFormScreen }    from "./src/screens/SetupFormScreen";
import { DARK_THEME as TH }   from "./src/constants/themes";
import { S }                  from "./src/constants/strings";
import { descargarDatos, escucharSesion } from "./src/services/firebase";
import { loadApp, saveApp }   from "./src/utils/security";
import { usePostHog } from 'posthog-react-native';

const CAROUSEL_KEY  = "@fynx_carousel_visto";
const SESSION_KEY   = "@fynx_session";

// Flag global para saber si AdMob está listo
let adMobReady = false;
export function isAdMobReady() { return adMobReady; }

// ── Shell principal ───────────────────────────────────────────────────────────
function AppShell() {
  const { appState, setAppState, T } = useFinance();
  const tema = T || TH;
  const premium = appState?.user?.premium || false;

  // fases: init | carousel | auth | setup | app
  const [fase,      setFase]      = useState("init");
  const [usuario,   setUsuario]   = useState(null); // { uid, email }
  const initialized = useRef(false);
  const authUnsub   = useRef(null);

  // Helper: verificar RevenueCat sin bloquear
  const syncPremium = useCallback(async (data) => {
    try {
      const rc = require("./src/services/revenuecat");
      await rc.rcInit();
      const isActive = await rc.rcCheckSubscription();
      if (isActive !== (data.user?.premium || false)) {
        const updated = { ...data, user: { ...data.user, premium: isActive } };
        setAppState(updated);
        return updated;
      }
    } catch(e) { /* RevenueCat no disponible — no fatal */ }
    setAppState(data);
    return data;
  }, []);

  // Helper: cargar datos del usuario (local → Firestore fallback)
  const loadUserData = useCallback(async (session) => {
    // Intentar caché local primero (más rápido, sin red)
    const parsed = await loadApp();
    if (parsed && parsed.setupCompleted) {
      await syncPremium(parsed);
      setFase("app");
      return;
    }

    // Local vacío o corrupto → intentar Firestore como respaldo
    if (session?.uid) {
      try {
        const remoto = await descargarDatos(session.uid);
        if (remoto && remoto.setupCompleted) {
          const merged = { ...remoto, onboarded: true, setupCompleted: true };
          await saveApp(merged); // Re-cachear localmente
          await syncPremium(merged);
          setFase("app");
          return;
        }
      } catch(e) {
        console.warn("[App] Firestore fallback failed:", e);
      }
    }

    // Ni local ni remoto tienen datos completos
    if (parsed) {
      setAppState(parsed);
      setFase("setup");
    } else {
      setFase("setup");
    }
  }, [syncPremium]);

  // Inicialización — una sola vez, sin bucles
  useEffect(() => {
    if (initialized.current || appState === null) return;
    initialized.current = true;
    
    (async () => {
      try {
        // Inicializar AdMob PRIMERO y esperar a que termine
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

        // Sesión guardada localmente — evita dependencia de red
        if (sessionRaw) {
          try {
            const session = JSON.parse(sessionRaw);
            setUsuario(session);
            await loadUserData(session);
          } catch(e) {
            console.warn("[App] Session parse error:", e);
            setFase("auth");
          }
          return;
        }

        // Sin sesión local → usar onAuthStateChanged como safety net
        // (Firebase persiste su token internamente en AsyncStorage)
        setFase("auth");
      } catch {
        setFase("auth");
      }
    })();
  }, [appState, loadUserData]);

  // Safety net: si Firebase tiene sesión pero AsyncStorage no, auto-recuperar
  useEffect(() => {
    authUnsub.current = escucharSesion(async (firebaseUser) => {
      if (!firebaseUser) return;
      // Solo actuar si estamos en pantalla de auth (sesión perdida localmente)
      if (fase === "auth" && !usuario) {
        console.log("[App] Firebase auto-recovery: session restored from token");
        setUsuario(firebaseUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(firebaseUser));
        await loadUserData(firebaseUser);
      }
    });
    return () => { if (authUnsub.current) authUnsub.current(); };
  }, [fase, usuario, loadUserData]);

  const posthog = usePostHog();

  // Analíticas y Notificaciones al entrar en app
  useEffect(() => {
    if (fase === "app") {
      posthog?.capture('app_opened', { premium });
      
      // Configurar notificaciones con retraso para suavizar la entrada
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCarouselDone = useCallback(async () => {
    await AsyncStorage.setItem(CAROUSEL_KEY, "1");
    setFase("auth");
  }, []);

  const handleAuth = useCallback(async (user) => {
    try {
      if (!user || !user.uid) {
        throw new Error("Usuario devuelto por Auth es nulo o inválido.");
      }
      setUsuario(user);
      // Guardar sesión local para próximo arranque sin red
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));

      // Verificar si setupCompleted en Firestore
      let remoto = null;
      try {
        remoto = await descargarDatos(user.uid);
      } catch(e) {
        console.warn("[App] Firestore download failed, going to setup:", e);
      }

      if (remoto?.setupCompleted) {
        // Usuario existente — cargar datos y a la app
        const merged = { ...remoto, onboarded: true, setupCompleted: true };
        await saveApp(merged);
        setAppState(merged);
        setFase("app");
      } else {
        // Usuario nuevo — ir a setup obligatorio
        setFase("setup");
      }
    } catch (e) {
      console.error("[App] Error en handleAuth:", e);
      setFase("setup"); // Fallback seguro
    }
  }, []);

  const handleSetupComplete = useCallback(async (userData) => {
    setAppState(userData);
    setFase("app");
  }, []);

  // ── Render por fase ──────────────────────────────────────────────────────

  // Pantalla de carga sin animación
  if (appState === null || fase === "init") {
    return (
      <View style={{ flex:1, backgroundColor:TH.bg, alignItems:"center", justifyContent:"center" }}>
        <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
        <Text style={{ fontSize:34, color:TH.gold, fontWeight:"700", letterSpacing:-2 }}>FX</Text>
        <Text style={{ fontSize:10, color:TH.t3, marginTop:12, letterSpacing:3 }}>CARGANDO</Text>
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={tema.bg}
      />
      <View style={{ flex:1 }}>
        {!appState?.onboarded
          ? <OnboardingScreen />
          : <AppNavigator />
        }
      </View>
    </View>
  );
}

import { LanguageProvider } from "./src/context/LanguageContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from 'posthog-react-native';

export default function App() {
  return (
    <PostHogProvider apiKey="phc_D7wFX6gZqLxqZrJJeud2ffwswVdEnG5FsbxERqfXW6MM" options={{ host: "https://us.posthog.com" }}>
      <SafeAreaProvider>
        <FinanceProvider>
          <LanguageProvider>
            <AppShell />
          </LanguageProvider>
        </FinanceProvider>
      </SafeAreaProvider>
    </PostHogProvider>
  );
}
