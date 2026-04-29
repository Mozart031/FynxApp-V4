import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated, AppState, Modal, LayoutAnimation } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { HomeScreen }       from "../screens/HomeScreen";
import { EstrategiaScreen } from "../screens/EstrategiaScreen";
import { ChatScreen }       from "../screens/ChatScreen";
import { PerfilScreen }     from "../screens/PerfilScreen";
import { SettingsScreen }   from "../screens/SettingsScreen";
import { FABModal }         from "../components/FABModal";
import { useFinance }       from "../context/FinanceContext";
import { AuthScreen }       from "../screens/AuthScreen";
import { SetupFormScreen }  from "../screens/SetupFormScreen";
import { escucharSesion, descargarDatos } from "../services/firebase";
import { autenticar } from "../services/biometrics";
import { useLanguage } from "../context/LanguageContext";

function NavBar({ tab, setTab, onFAB, TH }) {
  const { t } = useLanguage();
  const insets = { bottom: 16, top: 0 };
  const left   = [
    { id:"home",       icon:ICON.home,    label: t?.inicio || "Inicio"    },
    { id:"estrategia", icon:ICON.strategy,label: t?.estrategia || "Estrategia"},
  ];
  const right  = [
    { id:"chat",   icon:ICON.ai,     label: t?.chat || "IA"    },
    { id:"perfil", icon:ICON.profile, label: t?.perfil || "Perfil"},
  ];

  const Item = ({ item }) => {
    const active = tab === item.id;
    return (
      <TouchableOpacity 
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTab(item.id);
        }}
        style={{ flex:1, alignItems:"center", paddingVertical:5 }} activeOpacity={0.7}>
        {active && (
          <View style={{ position:"absolute", top:0, width:28, height:2.5,
            backgroundColor:TH.mint, borderRadius:99 }} />
        )}
        <View style={{ marginTop:6, width:32, height:26, alignItems:"center", justifyContent:"center",
          backgroundColor:active?TH.mintBg2:"transparent", borderRadius:9 }}>
          <Ionicons name={item.icon} size={20} color={active?TH.mint:TH.t3} />
        </View>
        <Text style={{ fontSize:9, fontWeight:"700", color:active?TH.mint:TH.t3, marginTop:2, letterSpacing:0.3 }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flexDirection:"row", backgroundColor:TH.card, borderTopWidth:1, borderTopColor:TH.border2,
      paddingTop:4, paddingBottom:insets.bottom+6, alignItems:"center" }}>
      {left.map(item  => <Item key={item.id} item={item} />)}

      {/* FAB central */}
      <View style={{ width:66, alignItems:"center", paddingBottom:4 }}>
        <TouchableOpacity onPress={onFAB} activeOpacity={0.85}
          style={{ width:52, height:52, borderRadius:16, backgroundColor:TH.mint,
            alignItems:"center", justifyContent:"center",
            shadowColor:TH.mint, shadowOffset:{width:0,height:4}, shadowOpacity:0.5, shadowRadius:12,
            elevation:10, borderWidth:2, borderColor:TH.mintDim }}>
          <Text style={{ fontSize:28, color:"#000", fontWeight:"900", lineHeight:32 }}>+</Text>
        </TouchableOpacity>
        <Text style={{ fontSize:8, color:TH.t3, letterSpacing:0.3, fontWeight:"600", marginTop:2 }}>REGISTRAR</Text>
      </View>

      {right.map(item => <Item key={item.id} item={item} />)}
    </View>
  );
}

export function AppNavigator() {
  const { appState, setAppState, addExpenseWithStreak, updateState, frenoState, T } = useFinance();
  const TH = T;
  const [tab,          setTab]          = useState("home");
  const [showFAB,      setShowFAB]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [isLocked,     setIsLocked]     = useState(false); // Desactivado por defecto para evitar crashes
  const appStateRef = React.useRef(AppState.currentState);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", nextState => {
      // Opcional: Solo bloquear si el usuario tiene biometría activada en su configuración
      if (appStateRef.current.match(/inactive|background/) && nextState === "active" && appState?.user?.biometricEnabled) {
        setIsLocked(true);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [appState?.user?.biometricEnabled]);

  async function unlock() {
    try {
      const res = await autenticar("Desbloquea Fynx (o usa tu PIN)");
      if (res.exito) setIsLocked(false);
      else setIsLocked(false); // Fallback: si falla o cancela, dejamos pasar para no bloquear la app
    } catch (e) {
      setIsLocked(false); // Si crashea, no bloqueamos
    }
  }

  React.useEffect(() => {
    if (isLocked) unlock();
  }, [isLocked]);

  React.useEffect(() => {
    const unsub = escucharSesion(async (u) => {
      setFirebaseUser(u);
      if (u && appState && !appState.onboarded) {
        const datos = await descargarDatos(u.uid);
        if (datos && datos.onboarded) {
          setAppState(datos);
        }
      }
    });
    return () => unsub();
  }, [appState?.onboarded]);

  const openSettings = () => setShowSettings(true);

  if (firebaseUser === undefined || appState === null) {
    return <View style={{ flex:1, backgroundColor:TH?.bg || "#000" }} />;
  }

  if (isLocked) {
    return (
      <View style={{ flex:1, backgroundColor:TH?.bg || "#000", alignItems:"center", justifyContent:"center" }}>
         <Ionicons name={ICON.lock} size={64} color={TH?.mint || "#00FF9D"} style={{ marginBottom:20 }} />
         <Text style={{ color:TH?.t1 || "#FFF", fontSize:18, fontWeight:"700", marginBottom:30 }}>Aplicación Bloqueada</Text>
         <TouchableOpacity onPress={unlock} style={{ backgroundColor:TH?.mint || "#00FF9D", paddingHorizontal:24, paddingVertical:14, borderRadius:12 }}>
            <Text style={{ color:"#000", fontWeight:"bold", fontSize:16 }}>Desbloquear</Text>
         </TouchableOpacity>
      </View>
    );
  }

  if (firebaseUser === null) {
    return <AuthScreen onAuth={(u) => setFirebaseUser(u)} />;
  }

  if (!appState.setupCompleted) {
    return <SetupFormScreen uid={firebaseUser.uid} email={firebaseUser.email} onComplete={setAppState} />;
  }

  return (
    <View style={{ flex:1, backgroundColor:TH.bg }}>
      {tab === "home"       && <HomeScreen       openSettings={openSettings} />}
      {tab === "estrategia" && <EstrategiaScreen />}
      {tab === "chat"       && <ChatScreen />}
      {tab === "perfil"     && <PerfilScreen openSettings={openSettings} />}

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
