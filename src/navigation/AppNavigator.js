import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, AppState, Modal, Animated, Dimensions, Platform, InteractionManager } from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { ICON } from "../constants";
import { HomeScreen } from "../screens/HomeScreen";
import { EstrategiaScreen } from "../screens/EstrategiaScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SavingsScreen } from "../screens/SavingsScreen";
import { SharedTabPopup } from "../components/SharedTabPopup";
import { AdminScreen } from "../screens/AdminScreen";
import { FABModal } from "../components/FABModal";
import { useFinance } from "../context/FinanceContext";
import { autenticar } from "../services/biometrics";
import { useLanguage } from "../context/LanguageContext";
import { isAdMobReady } from "../services/admob";

// ── Interstitial Ad (lazy, protegido) ─────────────────────────────────────
let interstitialAd = null;
let interLoaded = false;
let lastInterstitialTime = 0;
const INTERSTITIAL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos entre anuncios

// Wrapper eliminado para evitar pérdida de calidad (anti-aliasing) en Android

function loadInterstitial() {
  if (!isAdMobReady()) return; // No crear ads si AdMob no está listo
  if (interstitialAd) return;
  try {
    const { InterstitialAd, TestIds, AdEventType } = require("react-native-google-mobile-ads");
    const interAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : "ca-app-pub-4592841309124858/3519535651";
    interstitialAd = InterstitialAd.createForAdRequest(interAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => { interLoaded = true; });
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interLoaded = false;
      interstitialAd = null;
      loadInterstitial();
    });
    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      interLoaded = false;
      interstitialAd = null;
      setTimeout(loadInterstitial, 15000);
    });
    interstitialAd.load();
  } catch (e) {
    console.warn("[Fynx] InterstitialAd load error (non-fatal):", e);
  }
}

// Muestra el interstitial respetando el cooldown de 30 min
function tryShowInterstitial(isPremium, probability = 0.40) {
  if (isPremium) return;
  if (!interLoaded) return;
  const now = Date.now();
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) return;
  if (Math.random() >= probability) return;
  try {
    interstitialAd.show();
    lastInterstitialTime = now;
  } catch (e) { }
}

const { width } = Dimensions.get("window");
const TAB_WIDTH = (width - 58) / 4;

function NavBar({ tab, setTab, onFAB, TH, user, setShowSharedPopup, showSharedPopup }) {
  const { t } = useLanguage();
  const isAdmin = user?.email === "ericksonp032102@gmail.com";

  const insets = { bottom: 16, top: 0 };
  const left = [
    { id: "home", icon: ICON.home, label: t?.dash?.titulo || "Inicio" },
    { id: "estrategia", icon: ICON.strategy, label: t?.drawer?.estrategia || "Estrategia" },
  ];
  const right = [
    { id: "chat", icon: ICON.ai, label: t?.chat || (t?.dash?.titulo === "Home" ? "AI" : "IA") },
    { id: "perfil", icon: ICON.profile, label: t?.perfil?.titulo || "Perfil" },
  ];

  if (isAdmin) {
    right.push({ id: "admin", icon: "terminal", label: "ROOT" });
  }

  const allTabs = isAdmin ? ["home", "estrategia", "chat", "perfil", "admin"] : ["home", "estrategia", "chat", "perfil"];
  const activeSlotId = (tab === "ahorros" || tab === "chat") ? "chat" : tab;
  const tabIndex = allTabs.indexOf(activeSlotId);
  const numTabs = allTabs.length;
  const tabWidth = (width - 58) / numTabs;

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let toValue = tabIndex * tabWidth;
    if (tabIndex >= 2) {
      toValue += 58; // Saltar el FAB central
    }

    Animated.spring(slideAnim, {
      toValue,
      damping: 20,
      stiffness: 200,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [tabIndex, slideAnim, tabWidth]);

  const Item = ({ item }) => {
    const isShared = item.id === "chat";
    const active = tab === item.id || (isShared && tab === "ahorros");
    const isRoot = item.id === "admin";

    if (isShared) {
      return (
        <React.Fragment>
          <TouchableOpacity
            onPress={() => setShowSharedPopup(true)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 5 }} activeOpacity={0.7}>
            <View style={{ marginTop: 6, width: 44, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
              <View style={{ position: "relative", width: 22, height: 22 }}>
                <Ionicons name={ICON.ai} size={16} color={active ? TH.gold : TH.t3} style={{ position: "absolute", top: 0, left: 0 }} />
                <View style={{ position: "absolute", bottom: -2, right: -4, backgroundColor: active ? TH.gold + "20" : TH.card, borderRadius: 4, padding: 1 }}>
                  <Ionicons name="wallet-outline" size={12} color={active ? TH.gold : TH.t3} />
                </View>
                {showSharedPopup && <View style={{ position: "absolute", top: -2, right: -6, width: 6, height: 6, borderRadius: 3, backgroundColor: TH.gold }} />}
              </View>
            </View>
            <Text style={{ fontSize: 7, fontWeight: "800", color: active ? TH.gold : TH.t3, marginTop: 3, letterSpacing: 1, fontFamily: F.mono }}>
              IA · AHORRO
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => setTab(item.id)}
        style={{ flex: 1, alignItems: "center", paddingVertical: 5 }} activeOpacity={0.7}>
        <View style={{ marginTop: 6, width: 44, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
          <Ionicons name={item.icon} size={20} color={active ? (isRoot ? "#00FF00" : TH.gold) : TH.t3} />
        </View>
        <Text style={{ fontSize: 8, fontWeight: "800", color: active ? (isRoot ? "#00FF00" : TH.gold) : TH.t3, marginTop: 3, letterSpacing: 0.5, fontFamily: isRoot ? F.mono : F.sans }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{
      flexDirection: "row", backgroundColor: TH.card,
      borderTopWidth: require('react-native').StyleSheet.hairlineWidth,
      borderTopColor: TH.gold,
      paddingTop: 4, paddingBottom: insets.bottom + 6, alignItems: "center"
    }}>

      {/* Background animado de icono */}
      <Animated.View style={{
        position: "absolute",
        top: 9,
        left: 0,
        width: tabWidth,
        alignItems: "center",
        transform: [{ translateX: slideAnim }]
      }}>
        <View style={{ width: 44, height: 32, backgroundColor: tab === "admin" ? "rgba(0,255,0,0.1)" : TH.goldBg2, borderRadius: 12 }} />
      </Animated.View>

      {/* Indicador animado top */}
      <Animated.View style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: tabWidth,
        alignItems: "center",
        transform: [{ translateX: slideAnim }]
      }}>
        <View style={{ width: 32, height: 3, backgroundColor: tab === "admin" ? "#00FF00" : TH.gold, borderRadius: 99, shadowColor: tab === "admin" ? "#00FF00" : TH.gold, shadowRadius: 6, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 2 } }} />
      </Animated.View>

      {left.map(item => <Item key={item.id} item={item} />)}

      {/* FAB central */}
      <View style={{ width: 58, alignItems: "center", paddingBottom: 4, zIndex: 10 }}>
        <TouchableOpacity onPress={onFAB} activeOpacity={0.85}
          style={{
            width: 50, height: 50, borderRadius: 16, backgroundColor: TH.card2,
            alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: TH.gold
          }}>
          <Ionicons name="add" size={28} color={TH.gold} />
        </TouchableOpacity>
      </View>

      {right.map(item => <Item key={item.id} item={item} />)}
    </View>
  );
}

export function AppNavigator() {
  const { appState, setAppState, addExpenseWithStreak, updateState, frenoState, T } = useFinance();
  const { t, lang } = useLanguage();
  const TH = T;
  const [tab, setTab] = useState("home");
  const [estrategiaTab, setEstrategiaTab] = useState("metas");
  const [showFAB, setShowFAB] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSharedPopup, setShowSharedPopup] = useState(false);
  const [isLocked, setIsLocked] = useState(!!appState?.user?.appLockEnabled);
  const appStateRef = useRef(AppState.currentState);
  // Sin animación de fade — causaba pestaneo al montar/desmontar pantallas

  // Cargar interstitial con delay para dar tiempo a AdMob
  useEffect(() => {
    const timer = setTimeout(loadInterstitial, 2000);
    const sub = AppState.addEventListener("change", nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active" && appState?.user?.appLockEnabled) {
        setIsLocked(true);
      }
      appStateRef.current = nextState;
    });
    return () => { clearTimeout(timer); sub.remove(); };
  }, [appState?.user?.appLockEnabled]);

  const [unlockAttempt, setUnlockAttempt] = useState(0);

  const unlock = React.useCallback(async () => {
    try {
      // En Expo Go (__DEV__) la biometría nativa no está disponible.
      // Desbloqueamos directo para no bloquear el flujo de desarrollo.
      if (__DEV__) {
        setIsLocked(false);
        return;
      }
      const bio = await require("../services/biometrics").verificarDisponibilidad();
      if (!bio.disponible) {
        setIsLocked(false);
        return;
      }
      const res = await autenticar(lang === 'en' ? "Unlock Fynx" : "Desbloquear Fynx");
      if (res.exito) setIsLocked(false);
    } catch (e) {
      setIsLocked(false);
    }
  }, [lang]);

  useEffect(() => {
    if (isLocked) unlock();
  }, [isLocked, unlockAttempt, unlock]);

  const openSettings = React.useCallback(() => {
    const isPremium = appState?.user?.premium || false;
    tryShowInterstitial(isPremium, 0.40);
    setShowSettings(true);
  }, [appState?.user?.premium]);

  // Trigger interstitial al cambiar de tab (con cooldown de 30 min)
  const handleTabChange = React.useCallback((newTab) => {
    if (newTab !== tab) {
      // Usar InteractionManager para que el hilo JS y la UI no se bloqueen
      // hasta que la animación de cambio de pestaña termine por completo.
      InteractionManager.runAfterInteractions(() => {
        const { haptic } = require("../components/base");
        haptic("light");
        const isPremium = appState?.user?.premium || false;
        tryShowInterstitial(isPremium, 0.40);
      });
    }
    setTab(newTab);
  }, [tab, appState?.user?.premium]);
  // Memoize screens to prevent re-rendering ALL screens on every tab switch
  // MUST be before any early returns (like if isLocked) to comply with Rules of Hooks
  const homeScreenMemo = React.useMemo(() => (
    <HomeScreen openSettings={openSettings} setTab={setTab} navToPagos={() => { setEstrategiaTab("pagos"); setTab("estrategia"); }} />
  ), [openSettings]);

  const estrategiaScreenMemo = React.useMemo(() => (
    <EstrategiaScreen initialSubTab={estrategiaTab} />
  ), [estrategiaTab]);

  const chatScreenMemo = React.useMemo(() => (
    <ChatScreen />
  ), []);

  const perfilScreenMemo = React.useMemo(() => (
    <PerfilScreen openSettings={openSettings} />
  ), [openSettings]);

  const savingsScreenMemo = React.useMemo(() => (
    <SavingsScreen navigation={{ goBack: () => setTab("home") }} onBack={() => setTab("home")} />
  ), []);

  const adminScreenMemo = React.useMemo(() => (
    <AdminScreen isActive={tab === "admin"} navigation={{ goBack: () => setTab("home") }} />
  ), [tab]);

  if (isLocked) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {/* Glow Background */}
        <View style={{ position: "absolute", top: -100, left: 0, right: 0, height: 350, opacity: 0.15, backgroundColor: TH?.gold || "#D4AF37", borderBottomLeftRadius: 200, borderBottomRightRadius: 200, transform: [{ scaleX: 1.5 }] }} />

        {/* Fingerprint / Lock Container */}
        <View style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: "rgba(212, 175, 55, 0.03)",
          borderWidth: 1, borderColor: "rgba(212, 175, 55, 0.2)",
          alignItems: "center", justifyContent: "center",
          marginBottom: 35,
          shadowColor: TH?.gold || "#D4AF37", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 25
        }}>
          <View style={{ width: 85, height: 85, borderRadius: 45, backgroundColor: "rgba(212, 175, 55, 0.1)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="finger-print-outline" size={40} color={TH?.gold || "#D4AF37"} />
          </View>
        </View>

        <Text style={{ color: "#FFF", fontSize: 26, fontWeight: "900", marginBottom: 12, letterSpacing: 1.5, fontFamily: F?.sansB }}>
          {lang === 'en' ? 'FYNX SECURE' : 'FYNX SEGURO'}
        </Text>
        <Text style={{ color: TH?.t3 || "#888", fontSize: 13, textAlign: "center", marginBottom: 45, paddingHorizontal: 20, lineHeight: 22, fontFamily: F?.sans }}>
          {lang === 'en'
            ? 'Your financial data is protected by biometric encryption. Verify your identity to gain access.'
            : 'Tus datos financieros están protegidos. Verifica tu identidad para acceder al sistema.'}
        </Text>

        <TouchableOpacity activeOpacity={0.8} onPress={() => setUnlockAttempt(n => n + 1)}
          style={{
            backgroundColor: TH?.gold || "#D4AF37",
            paddingHorizontal: 24, paddingVertical: 18,
            borderRadius: 16, marginBottom: 35, width: "90%",
            alignItems: "center",
            shadowColor: TH?.gold || "#D4AF37", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
          }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="lock-open-outline" size={20} color="#000" />
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 15, letterSpacing: 1, fontFamily: F?.sansB }}>
              {lang === 'en' ? 'UNLOCK NOW' : 'DESBLOQUEAR AHORA'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.6} onPress={async () => {
          const { cerrarSesion, sincronizarDatos } = require("../services/firebase");
          if (appState?.user?.uid) {
            await sincronizarDatos(appState.user.uid, appState);
          }
          await cerrarSesion();
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          const keys = await AsyncStorage.getAllKeys();
          const keysToRemove = keys.filter(k => k !== "@fynx_carousel_visto" && k !== "@fynx_lang");
          await AsyncStorage.multiRemove(keysToRemove);
          setAppState({ onboarded: false, setupCompleted: false });
          setIsLocked(false);
        }} style={{ padding: 10 }}>
          <Text style={{ color: TH?.t3 || "#888", fontSize: 11, fontWeight: "600", fontFamily: F?.mono, letterSpacing: 0.5, opacity: 0.6 }}>
            {lang === 'en' ? "[ LOG IN AS ANOTHER USER ]" : "[ INGRESAR CON OTRA CUENTA ]"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const screenStyle = (name) => ({ flex: 1, display: tab === name ? "flex" : "none" });

  return (
    <View style={{ flex: 1, backgroundColor: TH.bg }}>
      <View style={{ flex: 1 }}>
        <View style={screenStyle("home")}>
          {homeScreenMemo}
        </View>
        <View style={screenStyle("estrategia")}>
          {estrategiaScreenMemo}
        </View>
        <View style={screenStyle("chat")}>
          {chatScreenMemo}
        </View>
        <View style={screenStyle("perfil")}>
          {perfilScreenMemo}
        </View>
        <View style={screenStyle("ahorros")}>
          {savingsScreenMemo}
        </View>
        <View style={screenStyle("admin")}>
          {adminScreenMemo}
        </View>
      </View>

      <NavBar tab={tab} setTab={handleTabChange} onFAB={() => setShowFAB(true)} TH={TH} user={appState?.user} setShowSharedPopup={setShowSharedPopup} showSharedPopup={showSharedPopup} />

      <SharedTabPopup
        visible={showSharedPopup}
        onClose={() => setShowSharedPopup(false)}
        onSelectAI={() => { setShowSharedPopup(false); setTab("chat"); }}
        onSelectSavings={() => { setShowSharedPopup(false); setTab("ahorros"); }}
      />

      <FABModal
        visible={showFAB}
        onClose={() => setShowFAB(false)}
        onSaveExpense={addExpenseWithStreak}
        onSaveIncome={inc => updateState({ income: [...(appState?.income || []), inc] })}
        onSaveAbono={(targetId, amount, type) => {
          if (type === "deuda") {
            updateState({
              debts: (appState?.debts || []).map(d =>
                d.id === targetId ? { ...d, balance: Math.max(0, d.balance - amount) } : d
              )
            });
          } else {
            updateState({
              goals: (appState?.goals || []).map(g =>
                g.id === targetId ? { ...g, saved: g.saved + amount } : g
              )
            });
          }
        }}
        state={appState}
        frenoActive={frenoState.active}
        setTab={setTab}
        setEstrategiaTab={setEstrategiaTab}
      />

      <Modal visible={showSettings} animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          onOpenAdmin={() => {
            setShowSettings(false);
            setTab("admin");
          }}
        />
      </Modal>

      <GlobalNoticeHandler />
      <UpdateManager />

      {/* Banner publicitario inferior para usuarios Free (Trial no quita anuncios) */}
      {!appState?.user?.premium && (
        <View style={{ backgroundColor: TH.bg, paddingBottom: Platform.OS === 'ios' ? 20 : 0 }}>
          <BannerAdWrapper />
        </View>
      )}

    </View>
  );
}

// ── Receptor de Mensajes Globales (Admin -> Usuarios) ──────────────────────
function GlobalNoticeHandler() {
  const [notice, setNotice] = useState(null);
  const [visible, setVisible] = useState(false);
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;

  useEffect(() => {
    const { listenToBroadcast } = require("../services/firebase");
    const unsub = listenToBroadcast(async (data) => {
      if (data?.message && data?.timestamp) {
        const lastSeen = await AsyncStorage.getItem("@fynx_last_notice");
        if (!lastSeen || parseInt(lastSeen) < data.timestamp) {
          setNotice(data);
          setVisible(true);
        }
      }
    });
    return () => unsub && unsub();
  }, []);

  const close = async () => {
    if (notice?.timestamp) {
      await AsyncStorage.setItem("@fynx_last_notice", notice.timestamp.toString());
    }
    setVisible(false);
  };

  if (!notice) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <View style={{ width: "100%", backgroundColor: "#000", borderWidth: 2, borderColor: "#00FF00", padding: 24, borderRadius: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,255,0,0.3)", paddingBottom: 10 }}>
            <Ionicons name="radio-outline" size={20} color="#00FF00" />
            <Text style={{ fontFamily: F.monoB, color: "#00FF00", fontSize: 14 }}>SYSTEM_BROADCAST</Text>
          </View>
          <Text style={{ fontFamily: F.mono, color: "#00FF00", fontSize: 13, lineHeight: 20 }}>
            {notice.message}
          </Text>
          <TouchableOpacity
            onPress={close}
            style={{ marginTop: 24, borderWidth: 1, borderColor: "#00FF00", padding: 12, alignItems: "center" }}
          >
            <Text style={{ fontFamily: F.monoB, color: "#00FF00", fontSize: 12 }}>ACKNOWLEDGE_MESSAGE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Componente Wrapper para el Banner para no crashear si falla AdMob
function BannerAdWrapper() {
  const [ready, setReady] = useState(true);
  const [admobInitialized, setAdmobInitialized] = useState(isAdMobReady());

  useEffect(() => {
    if (!admobInitialized) {
      const interval = setInterval(() => {
        if (isAdMobReady()) {
          setAdmobInitialized(true);
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [admobInitialized]);

  let BannerAd, BannerAdSize, TestIds;
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch (e) {
    return null;
  }

  const adUnitId = __DEV__ ? TestIds.BANNER : "ca-app-pub-4592841309124858/8043121096";

  if (!admobInitialized || !ready) return null;

  return (
    <View style={{ width: "100%", alignItems: "center", justifyContent: "center", minHeight: 50, borderTopWidth: 0.5, borderTopColor: C.border }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setReady(false)}
      />
    </View>
  );
}

// ── Gestor de Actualizaciones y Notas de la Versión ────────────────────────
function UpdateManager() {
  const [updateInfo, setUpdateInfo] = useState(null); // { status: "available" | "whatsnew", version: "", features: [] }
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  const { lang } = useLanguage();

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { getAppConfig } = require("../services/firebase");
        const config = await getAppConfig();
        const currentVer = Constants.expoConfig?.version || "1.0.0";
        const lastVer = await AsyncStorage.getItem("@fynx_last_version");

        const cmpVer = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

        if (config?.latestVersion && cmpVer(config.latestVersion, currentVer) > 0) {
          // Update available!
          setUpdateInfo({ status: "available", version: config.latestVersion });
        } else if (lastVer && cmpVer(currentVer, lastVer) > 0) {
          // App was updated! Show what's new.
          setUpdateInfo({ status: "whatsnew", version: currentVer, features: config?.releaseNotes || [] });
          await AsyncStorage.setItem("@fynx_last_version", currentVer);
        } else if (!lastVer) {
          // First time opening app ever, save current version silently
          await AsyncStorage.setItem("@fynx_last_version", currentVer);
        }
      } catch (e) {
        console.log("Update check error", e);
      }
    };
    checkVersion();
  }, []);

  if (!updateInfo) return null;

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: "#111", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.gold + "50" }}>
          {updateInfo.status === "available" ? (
            <>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Ionicons name="cloud-download-outline" size={50} color={C.gold} />
                <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 10, textAlign: "center" }}>
                  {lang === 'en' ? "Update Available" : "Actualización Disponible"}
                </Text>
                <Text style={{ color: C.t3, fontSize: 14, textAlign: "center", marginTop: 8 }}>
                  {lang === 'en' 
                    ? `Version ${updateInfo.version} is now available with new features and optimizations.` 
                    : `La versión ${updateInfo.version} ya está disponible con nuevas funciones y optimizaciones.`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setUpdateInfo(null)} style={{ backgroundColor: C.gold, padding: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 16 }}>{lang === 'en' ? "I'll update later" : "Entendido"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Ionicons name="rocket-outline" size={50} color={C.mint} />
                <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 10, textAlign: "center" }}>
                  {lang === 'en' ? "What's New in Fynx" : "Lo Nuevo en Fynx"}
                </Text>
                <Text style={{ color: C.mint, fontSize: 14, fontWeight: "800", marginTop: 4 }}>v{updateInfo.version}</Text>
              </View>
              <View style={{ marginBottom: 24 }}>
                {(updateInfo.features?.length ? updateInfo.features : [
                  { en: "Massive performance optimization (60 FPS)", es: "Mejora extrema de rendimiento y fluidez (60 FPS)." },
                  { en: "New Strategy and fixed payments manager", es: "Nuevo gestor de estrategia y pagos fijos." },
                  { en: "Bug fixes and stability improvements", es: "Corrección de errores y mejoras de estabilidad." }
                ]).map((f, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 12, alignItems: "flex-start", gap: 10 }}>
                    <Ionicons name="checkmark-circle" size={18} color={C.mint} style={{ marginTop: 2 }} />
                    <Text style={{ color: C.t2, fontSize: 14, flex: 1, lineHeight: 20 }}>{lang === 'en' ? (f.en || f) : (f.es || f)}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => setUpdateInfo(null)} style={{ backgroundColor: C.mint, padding: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 16 }}>{lang === 'en' ? "Awesome!" : "¡Genial!"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
