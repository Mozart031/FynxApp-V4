/**
 * FYNX — App.js v4.1
 * PRD: Filtro de usuario, caché local, sin bucle de re-renders
 * Flujo: Splash → Carousel(1x) → Auth → Setup(nuevo) → Dashboard
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, StatusBar, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FinanceProvider, useFinance } from "./src/context/FinanceContext";
import { AppNavigator }       from "./src/navigation/AppNavigator";
import { OnboardingScreen }   from "./src/screens/OnboardingScreen";
import { AuthScreen }         from "./src/screens/AuthScreen";
import { WelcomeCarousel }    from "./src/screens/WelcomeCarousel";
import { SetupFormScreen }    from "./src/screens/SetupFormScreen";
import { DARK_THEME as TH }   from "./src/constants/themes";
import { S }                  from "./src/constants/strings";
import { FadeIn }             from "./src/components/base";
import { descargarDatos }     from "./src/services/firebase";
import { loadApp, saveApp }   from "./src/utils/security";
import mobileAds, { AppOpenAd, TestIds, AdEventType } from "react-native-google-mobile-ads";
import { usePostHog } from 'posthog-react-native';

const CAROUSEL_KEY  = "@fynx_carousel_visto";
const SESSION_KEY   = "@fynx_session";

const openAdUnitId = __DEV__ ? TestIds.APP_OPEN : TestIds.APP_OPEN;

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue:1,   duration:900, useNativeDriver:true }),
        Animated.timing(pulse, { toValue:0.3, duration:900, useNativeDriver:true }),
      ])),
      Animated.spring(scale, { toValue:1, tension:70, friction:8, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <View style={{ flex:1, backgroundColor:TH.bg, alignItems:"center", justifyContent:"center" }}>
      <StatusBar barStyle="light-content" backgroundColor={TH.bg} />
      <Animated.View style={{ opacity:pulse, transform:[{scale}], alignItems:"center" }}>
        <View style={{ width:84, height:84, borderRadius:24, backgroundColor:TH.card2,
          borderWidth:1.5, borderColor:TH.border, alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <Text style={{ fontSize:34, color:TH.gold, fontWeight:"700", letterSpacing:-2 }}>FX</Text>
        </View>
        <Text style={{ fontSize:28, fontWeight:"700", color:TH.t1, letterSpacing:1.5 }}>
          {S.appNombre}
        </Text>
        <Text style={{ fontSize:10, color:TH.t3, marginTop:8, letterSpacing:3 }}>CARGANDO</Text>
      </Animated.View>
    </View>
  );
}

// ── Shell principal ───────────────────────────────────────────────────────────
function AppShell() {
  const { appState, setAppState, T } = useFinance();
  const tema = T || TH;
  const premium = appState?.user?.premium || false;

  // fases: splash | carousel | auth | setup | app
  const [fase,      setFase]      = useState("splash");
  const [usuario,   setUsuario]   = useState(null); // { uid, email }
  const initialized = useRef(false);

  // Inicialización — una sola vez, sin bucles
  useEffect(() => {
    if (initialized.current || appState === null) return;
    initialized.current = true;
    
    (async () => {
      try {
        // Inicializar AdMob PRIMERO para evitar crashes nativos al renderizar Banners o Intersticiales
        try {
          await mobileAds().initialize();
        } catch(e) { console.warn("AdMob init failed", e); }

        const [carouselVisto, sessionRaw] = await Promise.all([
          AsyncStorage.getItem(CAROUSEL_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);

        if (!carouselVisto) { setFase("carousel"); return; }

        // Sesión guardada localmente — evita dependencia de red
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          setUsuario(session);

          // Cargar appState desde caché local unificado
          const parsed = await loadApp();
          if (parsed) {
            
            // Verificar suscripción activa en RevenueCat silenciosamente
            import("./src/services/revenuecat").then(rc => {
              rc.rcInit();
              rc.rcCheckSubscription().then(isActive => {
                if (isActive && !parsed.user?.premium) {
                   setAppState({ ...parsed, user: { ...parsed.user, premium: true } });
                } else if (!isActive && parsed.user?.premium) {
                   setAppState({ ...parsed, user: { ...parsed.user, premium: false } });
                } else {
                   setAppState(parsed);
                }
              });
            });

            setFase(parsed.setupCompleted ? "app" : "setup");
          } else {
            setFase("setup");
          }
          return;
        }

        setFase("auth");
      } catch {
        setFase("auth");
      }
    })();
  }, [appState]);

  const posthog = usePostHog();

  // Analíticas y Notificaciones al entrar en app
  useEffect(() => {
    if (fase === "app") {
      posthog?.capture('app_opened', { premium });
      
      // Configurar notificaciones con retraso para suavizar la entrada
      setTimeout(() => {
        import("./src/services/notifications").then(notif => {
          notif.registerForPushNotificationsAsync().then(granted => {
            if (granted) notif.scheduleDailyReminder();
          });
        });
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
      const remoto = await descargarDatos(user.uid);

      if (remoto?.setupCompleted) {
        // Usuario existente — cargar datos y a la app
        const merged = { ...remoto, onboarded: true, setupCompleted: true };
        await saveApp(merged);
        setAppState(merged);
        // Pequeño delay para que el estado esté listo antes de renderizar
        setTimeout(() => setFase("app"), 120);
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
    setTimeout(() => setFase("app"), 120);
  }, []);

  // ── Render por fase ──────────────────────────────────────────────────────

  if (appState === null || fase === "splash") return <SplashScreen />;

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
      <View style={{ flex:1, paddingTop:40 }}>
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
