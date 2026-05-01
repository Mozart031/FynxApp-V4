import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { C, F } from "../constants/themes";
import { ICON, CATS, BLOCKED_CATS } from "../constants";
import { money, DAY } from "../utils/formatters";
import { Card, Btn, Bar, Tag, CatIcon, FadeIn } from "../components/base";
import { ScoreCircle } from "../components/ScoreCircle";
import { HeroBalance } from "../components/HeroBalance";
import { RunwayAlert } from "../components/RunwayCard";
import { StreakBanner } from "../components/StreakBanner";
import { HistorialModal } from "../components/HistorialModal";
import { IngresosModal } from "../components/IngresosModal";
import { AdBanner }     from "../components/AdBanner";
import { PremiumModal } from "../components/PremiumModal";
import { TrendChart }   from "../components/TrendChart";
import { FynxCoreWidget } from "../components/widgets/FynxCoreWidget";
import { CashFlowWidget } from "../components/widgets/CashFlowWidget";
import { BudgetWidget } from "../components/widgets/BudgetWidget";
import { GoalWidget } from "../components/widgets/GoalWidget";
import { PremiumWidget } from "../components/widgets/PremiumWidget";
import { MenuDrawer } from "../components/MenuDrawer";
import { BlurView }     from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { NotificationsModal } from "../components/NotificationsModal";

export function HomeScreen({ openSettings, navigation, setTab, navToPagos }) {
  const { appState, derived, deleteExpense, updateIncome, frenoState, isSurvival, T, updateState } = useFinance();
  const { t, lang } = useLanguage();
  const posthog = usePostHog();
  const { expenses=[], income=[], budgets={}, user={}, streakDays=[], goals=[], reminders=[] } = appState || {};
  const { balance=0, totalInc=0, totalExp=0, savePct=0, sc=0, grade={}, runway, sem={} } = derived;
  const cur = user.currency || "RD$";
  const TH = T || C;
  const esPremium = user?.premium || false;
  const [showPremium, setShowPremium] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const [incognito,    setIncognito]    = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showIngresos,  setShowIngresos]  = useState(false);
  const [showNotif,     setShowNotif]     = useState(false);

  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0,7);
  const upcomingReminders = reminders.filter(r => r.active && r.paidMonth !== currentMonth && (r.day - today2 <= 5));
  const hasAlert = upcomingReminders.length > 0;

  // Función incógnito — cubre todos los montos
  const hidden = (val) => incognito ? "••••••" : val;

  // Pulso para alerta roja
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (sem.level === "red") {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.06, duration:700, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1,    duration:700, useNativeDriver:true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue:1, duration:0, useNativeDriver:true }).start();
    }
  }, [sem.level]);

  const ct = {};
  expenses.forEach(e => { ct[e.cat] = (ct[e.cat] || 0) + e.amount; });
  const level = Math.floor(sc / 20) + 1;

  return (
    <View style={{ flex:1, backgroundColor: TH.bg }}>
      <SafeAreaView style={{ flex:1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:130 }}>

          {/* HEADER FYNX ELITE */}
          <FadeIn delay={0}>
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingTop:12, paddingBottom:10 }}>
              <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="menu-outline" size={20} color={TH.t3} />
              </TouchableOpacity>
              
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: TH.gold, letterSpacing: 2 }}>FYNX ELITE | DEEP SPACE</Text>
              
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={() => setTab("chat")} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.mint+"60", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={ICON.ai} size={18} color={TH.mint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowNotif(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="notifications-outline" size={18} color={TH.t3} />
                  {hasAlert && (
                    <View style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:4, backgroundColor:TH.rose }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setIncognito(v => !v);
                  posthog?.capture('Widget_Interaction', { type: 'incognito' });
                }} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: incognito ? TH.goldBg2 : TH.card2, borderWidth: 1, borderColor: incognito ? TH.gold+"50" : TH.border2, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={incognito ? ICON.eyeOff : ICON.eye} size={18} color={incognito ? TH.gold : TH.t3} />
                </TouchableOpacity>
              </View>
            </View>
          </FadeIn>

          {/* MODO SUPERVIVENCIA ALERT */}
          {isSurvival && (
            <FadeIn delay={40}>
              <Animated.View style={{ transform:[{ scale:pulseAnim }], marginHorizontal:16, marginBottom:10,
                borderRadius:14, backgroundColor:"#F4433618", borderWidth:1.5, borderColor:"#F4433660",
                padding:12, flexDirection:"row", gap:10, alignItems:"center" }}>
                <Ionicons name={ICON.alert} size={24} color="#F44336" />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, fontWeight:"900", color:"#F44336" }}>{lang === 'en' ? "SURVIVAL MODE ACTIVE" : "MODO SUPERVIVENCIA ACTIVO"}</Text>
                  <Text style={{ fontSize:11, color:TH.t2, marginTop:2 }}>{lang === 'en' ? "Score below 40 pts. Check your finances." : "Score bajo de 40 pts. Revisa tus finanzas."}</Text>
                </View>
              </Animated.View>
            </FadeIn>
          )}

          {/* FRENO 48H ALERT */}
          {frenoState?.active && (
            <FadeIn delay={50}>
              <View style={{ marginHorizontal:16, marginBottom:10,
                borderRadius:14, backgroundColor:TH.roseBg2 || "rgba(239,68,68,0.1)", borderWidth:1.5, borderColor:TH.rose+"50",
                padding:12, flexDirection:"row", gap:10, alignItems:"center" }}>
                <Ionicons name={ICON.lock} size={24} color={TH.rose} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, fontWeight:"900", color:TH.rose }}>{lang === 'en' ? "48-HOUR LOCK ACTIVE" : "BLOQUEO 48 HORAS ACTIVO"}</Text>
                  <Text style={{ fontSize:11, color:TH.t2, marginTop:2 }}>{lang === 'en' ? "You cannot spend on:" : "No puedes gastar en:"} {BLOCKED_CATS.join(", ")}</Text>
                </View>
              </View>
            </FadeIn>
          )}

          {/* FYNX ELITE WIDGETS (Holographic Vertical Layout) */}
          <FadeIn delay={70}>
            <FynxCoreWidget balance={balance} cur={cur} hidden={hidden} score={sc} />
          </FadeIn>

          <CashFlowWidget hidden={incognito} slideDelay={120} />

          <BudgetWidget hidden={incognito} slideDelay={200} />

          <GoalWidget hidden={incognito} slideDelay={280} />

          {!esPremium && (
            <FadeIn delay={150}>
              <PremiumWidget onPress={() => setShowPremium(true)} />
            </FadeIn>
          )}

          {/* Banner publicitario — solo usuarios gratuitos */}
          <AdBanner esPremium={esPremium} onUpgrade={() => setShowPremium(true)} />

        </ScrollView>
      </SafeAreaView>

      <HistorialModal visible={showHistorial} onClose={() => setShowHistorial(false)}
        expenses={expenses} onDelete={deleteExpense} cur={cur} />
      <IngresosModal visible={showIngresos} onClose={() => setShowIngresos(false)}
        income={income} onSave={updateIncome} cur={cur} />
      <MenuDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} navigation={navigation} openSettings={openSettings} setTab={setTab} />
      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          if (success) {
            posthog?.capture('Suscripcion_Exitosa', { plan });
            updateState({ user: { ...user, premium: true } });
            setShowPremium(false);
          } else {
            posthog?.capture('Suscripcion_Fallida', { plan });
          }
        }}
      />
      <NotificationsModal
        visible={showNotif}
        onClose={() => setShowNotif(false)}
        reminders={reminders}
        cur={cur}
        onNavigate={() => navToPagos && navToPagos()}
      />
    </View>
  );
}
