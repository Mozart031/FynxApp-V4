import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, StyleSheet } from "react-native";
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
import { AdBanner } from "../components/AdBanner";
import { PremiumModal } from "../components/PremiumModal";
import { TrendChart } from "../components/TrendChart";
import { FynxCoreWidget } from "../components/widgets/FynxCoreWidget";
import { CashFlowWidget } from "../components/widgets/CashFlowWidget";
import { BudgetWidget } from "../components/widgets/BudgetWidget";
import { GoalWidget } from "../components/widgets/GoalWidget";
import { PremiumWidget } from "../components/widgets/PremiumWidget";
import { PredictorWidget } from "../components/widgets/PredictorWidget";
import { SavingsCard } from "../components/SavingsCard";
import { useSavings } from "../hooks/useSavings";

const { width } = Dimensions.get("window");
import { MenuDrawer } from "../components/MenuDrawer";
import { HoloAchievement } from "../components/HoloAchievement";
import { BlurView } from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { NotificationsModal } from "../components/NotificationsModal";
import { generateTarsInsight } from "../utils/nudges";
import { TourOnboarding } from "../components/TourOnboarding";

export function HomeScreen({ openSettings, navigation, setTab, navToStrategy }) {
  const { appState, derived, deleteExpense, updateIncome, frenoState, isSurvival, T, updateState } = useFinance();
  const [activeSlide, setActiveSlide] = useState(0);
  const { totalSaved } = useSavings(appState?.user?.uid);
  const { t, lang } = useLanguage();
  const posthog = usePostHog();
  const { expenses = [], income = [], budgets = {}, user = {}, streakDays = [], goals = [], reminders = [] } = appState || {};
  const { balance = 0, totalInc = 0, totalExp = 0, savePct = 0, sc = 0, grade = {}, runway, sem = {} } = derived;
  const cur = user.currency || "RD$";
  const TH = T || C;
  const esPremium = user?.premium || false;
  const isFullyUnlocked = esPremium || (user?.tempUnlock && Date.now() < user.tempUnlock);
  const [showPremium, setShowPremium] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTour, setShowTour] = useState(!user?.tourCompleted);
  const [tourTargets, setTourTargets] = useState({});
  const tarsRef = useRef(null);
  const scoreRef = useRef(null);

  useEffect(() => {
    if (showTour) {
      setTimeout(() => {
        tarsRef.current?.measureInWindow((x, y, width, height) => {
          setTourTargets(prev => ({ ...prev, tars: { x, y, w: width, h: height } }));
        });
        scoreRef.current?.measureInWindow((x, y, width, height) => {
          setTourTargets(prev => ({ ...prev, score: { x, y, w: width, h: height } }));
        });
      }, 600);
    }
  }, [showTour]);

  const [incognito, setIncognito] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showIngresos, setShowIngresos] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const upcomingReminders = reminders.filter(r => r.active && r.paidMonth !== currentMonth && (r.day - today2 <= 5));
  const hasAlert = upcomingReminders.length > 0;

  // Función incógnito — cubre todos los montos
  const hidden = (val) => incognito ? "••••••" : val;

  // Pulso para alerta roja
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (sem.level === "red") {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }).start();
    }
  }, [sem.level]);

  const ct = {};
  expenses.forEach(e => { ct[e.cat] = (ct[e.cat] || 0) + e.amount; });
  
  const { calcStreak } = require("../utils/finance");
  const streak = calcStreak(streakDays);
  const level = Math.max(1, Math.floor(streak / 7) + 1);

  const tarsInsight = React.useMemo(() => generateTarsInsight(appState, derived, lang), [appState, derived, lang]);

  return (
    <View style={{ flex: 1, backgroundColor: TH.bg }}>
      <HoloAchievement />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* HEADER FYNX ELITE (Fixed at top) */}
        <FadeIn delay={0}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
            <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="menu-outline" size={20} color={TH.t3} />
            </TouchableOpacity>

            <Text style={{ fontFamily: F.mono, fontSize: 10, color: TH.gold, letterSpacing: 2 }}>FYNX ELITE | DEEP SPACE</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity ref={tarsRef} onPress={() => setTab("chat")} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.mint + "60", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={ICON.ai} size={18} color={TH.mint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNotif(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="notifications-outline" size={18} color={TH.t3} />
                {hasAlert && (
                  <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: TH.rose }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIncognito(v => !v);
                posthog?.capture('Widget_Interaction', { type: 'incognito' });
              }} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: incognito ? TH.goldBg2 : TH.card2, borderWidth: 1, borderColor: incognito ? TH.gold + "50" : TH.border2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={incognito ? ICON.eyeOff : ICON.eye} size={18} color={incognito ? TH.gold : TH.t3} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

          {/* MODO SUPERVIVENCIA ALERT */}
          {isSurvival && (
            <FadeIn delay={40}>
              <Animated.View style={{
                transform: [{ scale: pulseAnim }], marginHorizontal: 16, marginBottom: 10,
                borderRadius: 14, backgroundColor: "#8A8A8A18", borderWidth: 1.5, borderColor: "#8A8A8A60",
                padding: 12, flexDirection: "row", gap: 10, alignItems: "center"
              }}>
                <Ionicons name={ICON.alert} size={24} color="#8A8A8A" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "900", color: "#8A8A8A" }}>{lang === 'en' ? "SURVIVAL MODE ACTIVE" : "MODO SUPERVIVENCIA ACTIVO"}</Text>
                  <Text style={{ fontSize: 11, color: TH.t2, marginTop: 2 }}>{lang === 'en' ? "Score below 40 pts. Check your finances." : "Score bajo de 40 pts. Revisa tus finanzas."}</Text>
                </View>
              </Animated.View>
            </FadeIn>
          )}

          {/* FRENO 48H ALERT */}
          {frenoState?.active && (
            <FadeIn delay={50}>
              <View style={{
                marginHorizontal: 16, marginBottom: 10,
                borderRadius: 14, backgroundColor: TH.roseBg2 || "rgba(239,68,68,0.1)", borderWidth: 1.5, borderColor: TH.rose + "50",
                padding: 12, flexDirection: "row", gap: 10, alignItems: "center"
              }}>
                <Ionicons name={ICON.lock} size={24} color={TH.rose} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "900", color: TH.rose }}>{lang === 'en' ? "48-HOUR LOCK ACTIVE" : "BLOQUEO 48 HORAS ACTIVO"}</Text>
                  <Text style={{ fontSize: 11, color: TH.t2, marginTop: 2 }}>{lang === 'en' ? "You cannot spend on:" : "No puedes gastar en:"} {BLOCKED_CATS.join(", ")}</Text>
                </View>
              </View>
            </FadeIn>
          )}

          {/* FYNX ELITE WIDGET */}
          <FadeIn delay={70}>
            <View ref={scoreRef} collapsable={false} style={{ marginBottom: 20 }}>
              <FynxCoreWidget balance={balance} cur={cur} hidden={hidden} score={sc} derived={derived} esPremium={esPremium} onUpgrade={() => setShowPremium(true)} onPressChallenge={() => setTab("estrategia")} />
            </View>
          </FadeIn>



          <CashFlowWidget hidden={incognito} slideDelay={120} onPressIncome={() => setShowIngresos(true)} onPressExpense={() => setShowHistorial(true)} />

          {tarsInsight && (
            <FadeIn delay={130}>
              <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: TH.card2, borderRadius: 16, borderWidth: 1, borderColor: TH.border2, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.gold + "20", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.gold + "50" }}>
                  <Ionicons name="hardware-chip-outline" size={18} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.monoB, fontSize: 9, color: C.gold, letterSpacing: 2, marginBottom: 4 }}>{t.widgets?.tarsInsight || "INSIGHT DE TARS"}</Text>
                  <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t2, lineHeight: 18 }}>{tarsInsight}</Text>
                </View>
              </View>
            </FadeIn>
          )}

          <FadeIn delay={140}>
            <View style={{ 
              marginHorizontal: 16, 
              marginBottom: 14, 
              backgroundColor: "rgba(255,255,255,0.02)", 
              borderRadius: 24, 
              borderWidth: 1, 
              borderColor: "rgba(255,255,255,0.05)", 
              padding: 20,
              overflow: "hidden"
            }}>
              <BlurView intensity={5} tint="light" style={StyleSheet.absoluteFill} />
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontFamily: F.monoB, fontSize: 12, color: C.gold, letterSpacing: 2 }}>{t.widgets?.flujoCaja?.toUpperCase() || "CASH_FLOW"}</Text>
                    <View style={{ backgroundColor: C.rose, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900", fontFamily: F.monoB }}>{lang === 'en' ? "6_MONTHS" : "6_MESES"}</Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: F.sans, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{lang === 'en' ? "ELITE_TRENDS_AND_HISTORY" : "HISTORIAL_Y_TENDENCIAS_ELITE"}</Text>
                </View>
                <TouchableOpacity onPress={() => setTab("estrategia")} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
                  <Ionicons name="stats-chart" size={18} color={C.gold} />
                </TouchableOpacity>
              </View>

              <TrendChart expenses={expenses} income={income} cur={cur} lang={lang} />
              
              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 16 }} />
              
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: F.monoB }}>MAX_IN</Text>
                  <Text style={{ fontSize: 12, color: C.mint, fontFamily: F.monoB, marginTop: 4 }}>{hidden(money(Math.max(...income.map(i => i.amount), 0), cur))}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: F.monoB }}>MAX_OUT</Text>
                  <Text style={{ fontSize: 12, color: C.rose, fontFamily: F.monoB, marginTop: 4 }}>{hidden(money(Math.max(...expenses.map(e => e.amount), 0), cur))}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: F.monoB }}>AVG_MONTH</Text>
                  <Text style={{ fontSize: 12, color: "#FFF", fontFamily: F.monoB, marginTop: 4 }}>{hidden(money((totalInc - totalExp) / 2, cur))}</Text>
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={160}>
            <PredictorWidget balance={balance} cur={cur} hidden={incognito} slideDelay={160} esPremium={isFullyUnlocked} onUpgrade={() => setShowPremium(true)} />
          </FadeIn>

          <BudgetWidget hidden={incognito} slideDelay={200} />

          <GoalWidget hidden={incognito} slideDelay={280} />

          {!esPremium && (
            <FadeIn delay={150}>
              <PremiumWidget onPress={() => setShowPremium(true)} isTrialActive={isFullyUnlocked && !esPremium} />
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
        onNavigate={() => navToStrategy && navToStrategy("pagos")}
      />
      <TourOnboarding
        visible={showTour}
        targets={tourTargets}
        onComplete={() => {
          setShowTour(false);
          updateState({ user: { ...user, tourCompleted: true } });
        }}
      />

      {/* FLOATING SAVINGS BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navToStrategy && navToStrategy("ahorros")}
        style={{
          position: "absolute",
          right: 0,
          top: "35%",
          backgroundColor: "rgba(212, 175, 55, 0.15)",
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(212, 175, 55, 0.4)",
          borderRightWidth: 0,
          paddingVertical: 18,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: C.gold,
          shadowOffset: { width: -3, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          zIndex: 50
        }}
      >
        <Ionicons name="chevron-back" size={14} color={C.gold} style={{ opacity: 0.7 }} />
        <View style={{ marginLeft: 4, alignItems: "center" }}>
          <Ionicons name="wallet" size={20} color={C.gold} />
          <Text style={{ fontFamily: F.monoB, fontSize: 8, color: C.gold, marginTop: 6, letterSpacing: 1 }}>
            {lang === 'en' ? "SAVINGS" : "AHORROS"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
