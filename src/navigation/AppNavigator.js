import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, AppState, Modal, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { ICON } from "../constants";
import { HomeScreen }       from "../screens/HomeScreen";
import { EstrategiaScreen } from "../screens/EstrategiaScreen";
import { ChatScreen }       from "../screens/ChatScreen";
import { PerfilScreen }     from "../screens/PerfilScreen";
import { SettingsScreen }   from "../screens/SettingsScreen";
import { AdminScreen }      from "../screens/AdminScreen";
import { FABModal }         from "../components/FABModal";
import { useFinance }       from "../context/FinanceContext";
import { autenticar } from "../services/biometrics";
import { useLanguage } from "../context/LanguageContext";
import { isAdMobReady } from "../../App";

// ── Interstitial Ad (lazy, protegido) ─────────────────────────────────────
let interstitialAd = null;
let interLoaded = false;

function loadInterstitial() {
  if (!isAdMobReady()) return; // No crear ads si AdMob no está listo
  if (interstitialAd) return;
  try {
    const { InterstitialAd, TestIds, AdEventType } = require("react-native-google-mobile-ads");
    const interAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : TestIds.INTERSTITIAL;
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
  } catch(e) {
    console.warn("[Fynx] InterstitialAd load error (non-fatal):", e);
  }
}

const { width } = Dimensions.get("window");
const TAB_WIDTH = (width - 58) / 4;

function NavBar({ tab, setTab, onFAB, TH }) {
  const { t } = useLanguage();
  const insets = { bottom: 16, top: 0 };
  const left   = [
    { id:"home",       icon:ICON.home,    label: t?.dash?.titulo || "Inicio"    },
    { id:"estrategia", icon:ICON.strategy,label: t?.estrategia || "Estrategia"},
  ];
  const right  = [
    { id:"chat",   icon:ICON.ai,     label: t?.chat || "IA"    },
    { id:"perfil", icon:ICON.profile, label: t?.perfil?.titulo || "Perfil"},
  ];

  const allTabs = ["home", "estrategia", "chat", "perfil"];
  const tabIndex = allTabs.indexOf(tab);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let toValue = tabIndex * TAB_WIDTH;
    if (tabIndex >= 2) {
      toValue += 58; // Saltar el ancho del botón central FAB
    }
    
    Animated.spring(slideAnim, {
      toValue,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [tabIndex, slideAnim]);

  const Item = ({ item }) => {
    const active = tab === item.id;
    return (
      <TouchableOpacity 
        onPress={() => setTab(item.id)}
        style={{ flex:1, alignItems:"center", paddingVertical:5 }} activeOpacity={0.7}>
        <View style={{ marginTop:6, width:44, height:32, alignItems:"center", justifyContent:"center", borderRadius:12 }}>
          <Ionicons name={item.icon} size={22} color={active?TH.gold:TH.t3} />
        </View>
        <Text style={{ fontSize:9, fontWeight:"700", color:active?TH.gold:TH.t3, marginTop:3, letterSpacing:0.5, fontFamily: F?.sans || "System" }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flexDirection:"row", backgroundColor:TH.card, borderTopWidth:0.5, borderTopColor:TH.border,
      paddingTop:4, paddingBottom:insets.bottom+6, alignItems:"center" }}>
      
      {/* Background animado de icono */}
      <Animated.View style={{ 
        position: "absolute", 
        top: 9, 
        left: 0,
        width: TAB_WIDTH,
        alignItems: "center",
        transform: [{ translateX: slideAnim }]
      }}>
        <View style={{ width: 44, height: 32, backgroundColor: TH.goldBg2, borderRadius: 12 }} />
      </Animated.View>

      {/* Indicador animado top */}
      <Animated.View style={{ 
        position: "absolute", 
        top: 0, 
        left: 0,
        width: TAB_WIDTH,
        alignItems: "center",
        transform: [{ translateX: slideAnim }]
      }}>
        <View style={{ width: 32, height: 3, backgroundColor: TH.gold, borderRadius: 99, shadowColor:TH.gold, shadowRadius:6, shadowOpacity:0.8, shadowOffset:{width:0,height:2} }} />
      </Animated.View>

      {left.map(item  => <Item key={item.id} item={item} />)}

      {/* FAB central */}
      <View style={{ width:58, alignItems:"center", paddingBottom:4, zIndex:10 }}>
        <TouchableOpacity onPress={onFAB} activeOpacity={0.85}
          style={{ width:50, height:50, borderRadius:16, backgroundColor:TH.card2,
            alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:TH.gold }}>
          <Ionicons name="add" size={28} color={TH.gold} />
        </TouchableOpacity>
      </View>

      {right.map(item => <Item key={item.id} item={item} />)}
    </View>
  );
}

export function AppNavigator() {
  const { appState, setAppState, addExpenseWithStreak, updateState, frenoState, T } = useFinance();
  const TH = T;
  const [tab,          setTab]          = useState("home");
  const [estrategiaTab, setEstrategiaTab] = useState("metas");
  const [showFAB,      setShowFAB]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLocked,     setIsLocked]     = useState(!!appState?.user?.appLockEnabled);
  const appStateRef = useRef(AppState.currentState);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Manejar transición de pantallas rápida y sutil
  useEffect(() => {
    fadeAnim.setValue(0.3); // No empezar en 0 absoluto para evitar salto oscuro
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [tab, fadeAnim]);

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
      const res = await autenticar("Desbloquea Fynx (o usa tu PIN)");
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
    if (!isPremium && interLoaded && Math.random() < 0.35) {
      try { interstitialAd.show(); } catch (e) {}
    }
    setShowSettings(true);
  };

  if (isLocked) {
    return (
      <View style={{ flex:1, backgroundColor:TH?.bg || "#000", alignItems:"center", justifyContent:"center" }}>
         <Ionicons name={ICON.lock} size={64} color={TH?.gold || "#D4AF37"} style={{ marginBottom:20 }} />
         <Text style={{ color:TH?.t1 || "#FFF", fontSize:18, fontWeight:"700", marginBottom:30 }}>Aplicación Bloqueada</Text>
         <TouchableOpacity onPress={unlock} style={{ backgroundColor:TH?.gold || "#D4AF37", paddingHorizontal:24, paddingVertical:14, borderRadius:12, marginBottom: 24 }}>
            <Text style={{ color:"#000", fontWeight:"bold", fontSize:16 }}>Desbloquear</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={async () => {
             const { cerrarSesion, sincronizarDatos } = require("../services/firebase");
             if (appState?.user?.uid) {
                 await sincronizarDatos(appState.user.uid, appState);
             }
             await cerrarSesion();
             const AsyncStorage = require("@react-native-async-storage/async-storage").default;
             const keys = await AsyncStorage.getAllKeys();
             await AsyncStorage.multiRemove(keys);
             setAppState({ onboarded: false, setupCompleted: false });
             setIsLocked(false);
         }}>
            <Text style={{ color: TH?.t3 || "#888", fontSize: 14, textDecorationLine: "underline" }}>Entrar con otra cuenta</Text>
         </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:TH.bg }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {tab === "home"       && <HomeScreen       openSettings={openSettings} setTab={setTab} navToPagos={() => { setEstrategiaTab("pagos"); setTab("estrategia"); }} />}
        {tab === "estrategia" && <EstrategiaScreen initialSubTab={estrategiaTab} />}
        {tab === "chat"       && <ChatScreen />}
        {tab === "perfil"     && <PerfilScreen openSettings={openSettings} />}
        {tab === "admin"      && <AdminScreen navigation={{ goBack: () => setTab("home") }} />}
      </Animated.View>

      <NavBar tab={tab} setTab={setTab} onFAB={() => setShowFAB(true)} TH={TH} />

      <FABModal
        visible={showFAB}
        onClose={() => setShowFAB(false)}
        onSaveExpense={addExpenseWithStreak}
        onSaveIncome={inc => updateState({ income:[...(appState?.income||[]), inc] })}
        onSaveAbono={(targetId, amount, type) => {
          if (type === "deuda") {
            updateState({ debts:(appState?.debts||[]).map(d =>
              d.id === targetId ? { ...d, balance:Math.max(0, d.balance - amount) } : d
            )});
          } else {
            updateState({ goals:(appState?.goals||[]).map(g =>
              g.id === targetId ? { ...g, saved:g.saved + amount } : g
            )});
          }
        }}
        state={appState}
        frenoActive={frenoState.active}
      />

      <Modal visible={showSettings} animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>
    </View>
  );
}
