import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { HomeScreen }       from "../screens/HomeScreen";
import { EstrategiaScreen } from "../screens/EstrategiaScreen";
import { ChatScreen }       from "../screens/ChatScreen";
import { PerfilScreen }     from "../screens/PerfilScreen";
import { SettingsModal }    from "../screens/SettingsModal";
import { FABModal }         from "../components/FABModal";
import { useFinance }       from "../context/FinanceContext";

function NavBar({ tab, setTab, onFAB, TH }) {
  const insets = { bottom: 16, top: 0 };
  const left   = [
    { id:"home",       icon:ICON.home,    label:"Inicio"    },
    { id:"estrategia", icon:ICON.strategy,label:"Estrategia"},
  ];
  const right  = [
    { id:"chat",   icon:ICON.ai,     label:"IA"    },
    { id:"perfil", icon:ICON.profile, label:"Perfil"},
  ];

  const Item = ({ item }) => {
    const active = tab === item.id;
    return (
      <TouchableOpacity onPress={() => setTab(item.id)}
        style={{ flex:1, alignItems:"center", paddingVertical:5 }} activeOpacity={0.7}>
        {active && (
          <View style={{ position:"absolute", top:0, width:28, height:2.5,
            backgroundColor:TH.mint, borderRadius:99 }} />
        )}
        <View style={{ marginTop:6, width:32, height:26, alignItems:"center", justifyContent:"center",
          backgroundColor:active?TH.mintBg2:"transparent", borderRadius:9 }}>
          <Text style={{ fontSize:17, color:active?TH.mint:TH.t3, fontWeight:"900" }}>{item.icon}</Text>
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
  const { appState, addExpenseWithStreak, updateState, frenoState, T } = useFinance();
  const TH = T;
  const [tab,          setTab]          = useState("home");
  const [showFAB,      setShowFAB]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = () => setShowSettings(true);

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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </View>
  );
}
