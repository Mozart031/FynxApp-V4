import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, AppState, Modal, Animated, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { ICON } from "../constants";
import { HomeScreen } from "../screens/HomeScreen";
import { EstrategiaScreen } from "../screens/EstrategiaScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
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

function NavBar({ tab, setTab, onFAB, TH, user }) {
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
  const tabIndex = allTabs.indexOf(tab);
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
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [tabIndex, slideAnim, tabWidth]);

  const Item = ({ item }) => {
    const active = tab === item.id;
    const isRoot = item.id === "admin";
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
      flexDirection: "row", backgroundColor: TH.card, borderTopWidth: 1, borderTopColor: "rgba(212, 175, 55, 0.15)",
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

  async function unlock() {
    try {
      const bio = await require("../services/biometrics").verificarDisponibilidad();
      if (!bio.disponible) {
        setIsLocked(false);
        return;
      }
      const res = await autenticar(lang === 'en' ? "Unlock Fynx" : "Desbloquear Fynx");
      if (res.exito) setIsLocked(false);
      // Si falla o cancela, mantenemos isLocked = true sin desloguear.
    } catch (e) {
      setIsLocked(false);
    }
  }

  useEffect(() => {
    if (isLocked) unlock();
  }, [isLocked]);

  const openSettings = () => {
    const isPremium = appState?.user?.premium || false;
    tryShowInterstitial(isPremium, 0.40);
    setShowSettings(true);
  };

  // Trigger interstitial al cambiar de tab (con cooldown de 30 min)
  const handleTabChange = (newTab) => {
    if (newTab !== tab) {
      const { haptic } = require("../components/base");
      haptic("light");
      const isPremium = appState?.user?.premium || false;
      tryShowInterstitial(isPremium, 0.40);
    }
    setTab(newTab);
  };

  if (isLocked) {
    return (
      <View style={{ flex: 1, backgroundColor: TH?.bg || "#000", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={ICON.lock} size={64} color={TH?.gold || "#D4AF37"} style={{ marginBottom: 20 }} />
        <Text style={{ color: TH?.t1 || "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 30 }}>
          {lang === 'en' ? 'App Locked' : 'Aplicación Bloqueada'}
        </Text>
        <TouchableOpacity onPress={unlock} style={{ backgroundColor: TH?.gold || "#D4AF37", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginBottom: 24 }}>
          <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16 }}>
            {lang === 'en' ? 'Unlock' : 'Desbloquear'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => {
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
        }}>
          <Text style={{ color: TH?.t3 || "#888", fontSize: 14, textDecorationLine: "underline" }}>{lang === 'en' ? "Log in with another account" : "Entrar con otra cuenta"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Función helper: pantallas siempre montadas, ocultas con display:'none'
  // Evita el pestaneo que causaba desmontar/remontar con && en cada cambio de tab
  const screenStyle = (name) => ({ flex: 1, display: tab === name ? "flex" : "none" });

  return (
    <View style={{ flex: 1, backgroundColor: TH.bg }}>
      <View style={{ flex: 1 }}>
        <View style={screenStyle("home")}>
          <HomeScreen openSettings={openSettings} setTab={setTab} navToPagos={() => { setEstrategiaTab("pagos"); setTab("estrategia"); }} />
        </View>
        <View style={screenStyle("estrategia")}>
          <EstrategiaScreen initialSubTab={estrategiaTab} />
        </View>
        <View style={screenStyle("chat")}>
          <ChatScreen />
        </View>
        <View style={screenStyle("perfil")}>
          <PerfilScreen openSettings={openSettings} />
        </View>
        <View style={screenStyle("admin")}>
          <AdminScreen navigation={{ goBack: () => setTab("home") }} />
        </View>
      </View>

      <NavBar tab={tab} setTab={handleTabChange} onFAB={() => setShowFAB(true)} TH={TH} user={appState?.user} />

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

      {/* Banner publicitario inferior para usuarios Free */}
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
