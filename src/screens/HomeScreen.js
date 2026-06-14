import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, StyleSheet, Easing } from "react-native";
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
import { TarsGuideModal } from "../components/TarsGuideModal";
import { TypewriterText } from "../components/TypewriterText";

const PulseIcon = ({ name, size, color, bg }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 32, height: 32, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "50" }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

export function HomeScreen({ openSettings, navigation, setTab, navToStrategy, onOpenReport }) {
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
  const [guideTopic, setGuideTopic] = useState(null);
  const [tarsExpanded, setTarsExpanded] = useState(false);
  const [showTarsMenu, setShowTarsMenu] = useState(false);
  const tarsMenuAnim = useRef(new Animated.Value(-180)).current;
  const tarsMenuFade = useRef(new Animated.Value(0)).current;

  const openTarsMenu = () => {
    setShowTarsMenu(true);
    Animated.parallel([
      Animated.spring(tarsMenuAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(tarsMenuFade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  const closeTarsMenu = () => {
    Animated.parallel([
      Animated.timing(tarsMenuAnim, { toValue: -180, duration: 200, useNativeDriver: true }),
      Animated.timing(tarsMenuFade, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setShowTarsMenu(false));
  };
  const [tarsMsg, setTarsMsg] = useState(null);
  const tarsMsgAnim = useRef(new Animated.Value(20)).current;
  const tarsMsgFade = useRef(new Animated.Value(0)).current;
  const tarsMsgTimer = useRef(null);

  const showTarsMessage = (msg) => {
    if (tarsMsgTimer.current) clearTimeout(tarsMsgTimer.current);
    setTarsMsg(msg);
    tarsMsgAnim.setValue(20);
    tarsMsgFade.setValue(0);
    Animated.parallel([
      Animated.spring(tarsMsgAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10 }),
      Animated.timing(tarsMsgFade, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    tarsMsgTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(tarsMsgAnim, { toValue: 20, duration: 300, useNativeDriver: true }),
        Animated.timing(tarsMsgFade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setTarsMsg(null));
    }, 3000);
  };

  const getReply = (key) => {
    const { sc = 0, savePct = 0, totalExp = 0, totalInc = 0 } = derived || {};
    const cur = user?.currency || "RD$";
    const diff = totalInc - totalExp;
    const topCat = Object.entries(
      expenses.reduce((a, e) => { a[e.cat] = (a[e.cat] || 0) + e.amount; return a; }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    if (key === "spending") {
      if (topCat) {
        const pct = totalExp > 0 ? Math.round((topCat[1] / totalExp) * 100) : 0;
        return lang === 'en'
          ? `${topCat[0]} is eating ${pct}% of your expenses this month — ${cur}${Math.round(topCat[1]).toLocaleString()}.`
          : `${topCat[0]} consume el ${pct}% de tu gasto este mes — ${cur}${Math.round(topCat[1]).toLocaleString()}.`;
      }
      return lang === 'en' ? "No expenses logged yet. Start tracking to see your patterns." : "Sin gastos registrados aún. Registra para ver tus patrones.";
    }

    if (key === "week") {
      const thisWeek = expenses.filter(e => {
        const d = new Date(e.date || e.createdAt);
        return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      });
      const weekTotal = thisWeek.reduce((a, e) => a + e.amount, 0);
      return lang === 'en'
        ? `This week: ${thisWeek.length} transactions, ${cur}${Math.round(weekTotal).toLocaleString()} spent. Streak: ${streak} days.`
        : `Esta semana: ${thisWeek.length} movimientos, ${cur}${Math.round(weekTotal).toLocaleString()} gastados. Racha: ${streak} días.`;
    }

    if (key === "debts") {
      const deudas = appState?.debts || [];
      if (deudas.length === 0) {
        return lang === 'en' ? "No debts recorded. Keep it that way — debt is expensive." : "Sin deudas registradas. Mantenlo así — las deudas son caras.";
      }
      const total = deudas.reduce((a, d) => a + (d.monto || d.amount || 0), 0);
      return lang === 'en'
        ? `You have ${deudas.length} active debt(s) totaling ${cur}${Math.round(total).toLocaleString()}. Prioritize the highest interest.`
        : `Tienes ${deudas.length} deuda(s) activa(s) por ${cur}${Math.round(total).toLocaleString()}. Prioriza la de mayor interés.`;
    }

    if (key === "save") {
      if (savePct >= 30) {
        return lang === 'en'
          ? `You're saving ${Math.round(savePct)}% of income. Excellent — sustain it.`
          : `Estás ahorrando el ${Math.round(savePct)}% de tus ingresos. Excelente — mantenlo.`;
      }
      if (diff <= 0) {
        return lang === 'en'
          ? `You're spending more than you earn. Cut ${cur}${Math.round(Math.abs(diff)).toLocaleString()} to break even first.`
          : `Gastas más de lo que ganas. Recorta ${cur}${Math.round(Math.abs(diff)).toLocaleString()} para empezar a equilibrar.`;
      }
      return lang === 'en'
        ? `You're saving ${Math.round(savePct)}% — target is ${user?.savingGoalPct || 20}%. Close the gap by ${cur}${Math.round((totalInc * ((user?.savingGoalPct || 20) / 100)) - (totalInc - totalExp)).toLocaleString()}.`
        : `Ahorras el ${Math.round(savePct)}% — meta: ${user?.savingGoalPct || 20}%. Te faltan ${cur}${Math.round((totalInc * ((user?.savingGoalPct || 20) / 100)) - (totalInc - totalExp)).toLocaleString()} para lograrlo.`;
    }

    return lang === 'en' ? "Data analyzed." : "Datos analizados.";
  };

  const handleTarsAction = (key) => {
    closeTarsMenu();
    setTimeout(() => showTarsMessage(getReply(key)), 220);
  };

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

  // Short one-liner for the floating TARS capsule
  const tarsCapsuleMsg = React.useMemo(() => {
    if (!derived) return lang === 'en' ? "Analyzing..." : "Analizando...";
    const { sc = 0, savePct = 0, totalExp = 0, totalInc = 0 } = derived;
    if (totalInc === 0) return lang === 'en' ? "Add income first" : "Agrega ingreso";
    if (sc >= 90) return lang === 'en' ? "Excellent control" : "Control excelente";
    if (sc >= 70) return lang === 'en' ? "Solid finances" : "Finanzas sólidas";
    if (sc >= 50) return lang === 'en' ? "Watch spending" : "Cuida el gasto";
    if (totalExp > totalInc) return lang === 'en' ? "⚠ Overspending" : "⚠ Gasto excedido";
    if (streak >= 7) return lang === 'en' ? `${streak}d streak 🔥` : `Racha: ${streak}d 🔥`;
    if (savePct < 10) return lang === 'en' ? "Save more" : "Ahorra más";
    return lang === 'en' ? "Ask me anything" : "Pregúntame algo";
  }, [derived, lang, streak]);

  return (
    <View style={{ flex: 1, backgroundColor: TH.bg }}>
      <HoloAchievement />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* HEADER FYNX ELITE (Fixed at top) */}
        <FadeIn delay={0}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
            <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="menu-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onOpenReport && onOpenReport()} activeOpacity={0.7} style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: TH.gold, letterSpacing: 2 }}>FYNX ELITE | DEEP SPACE</Text>
              <Text style={{ fontFamily: F.mono, fontSize: 7, color: TH.gold + "70", letterSpacing: 1, marginTop: 2 }}>{lang === 'en' ? 'TAP FOR MONTHLY REPORT' : 'VER REPORTE MENSUAL'}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity ref={tarsRef} onPress={() => setTab("chat")} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.mint + "60", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={ICON.ai} size={18} color={TH.mint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNotif(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TH.card2, borderWidth: 1, borderColor: TH.border2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                {hasAlert && (
                  <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: TH.rose }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIncognito(v => !v);
                posthog?.capture('Widget_Interaction', { type: 'incognito' });
              }} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: incognito ? TH.goldBg2 : TH.card2, borderWidth: 1, borderColor: incognito ? TH.gold + "50" : TH.border2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={incognito ? ICON.eyeOff : ICON.eye} size={18} color={incognito ? TH.gold : "#FFFFFF"} />
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
            <TouchableOpacity ref={scoreRef} collapsable={false} style={{ marginBottom: 20 }} activeOpacity={0.9} onPress={() => setGuideTopic("score")}>
              <FynxCoreWidget balance={balance} cur={cur} hidden={hidden} score={sc} derived={derived} esPremium={esPremium} onUpgrade={() => setShowPremium(true)} onPressChallenge={() => setTab("estrategia")} />
            </TouchableOpacity>
          </FadeIn>



          <CashFlowWidget hidden={incognito} slideDelay={120} onPressIncome={() => setShowIngresos(true)} onPressExpense={() => setShowHistorial(true)} />

          {tarsInsight && (
            <FadeIn delay={130}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => {
                if (!esPremium) setShowPremium(true);
                else setTarsExpanded(!tarsExpanded);
              }} style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: tarsExpanded ? TH.mint + "08" : TH.card2, borderRadius: 16, borderWidth: 1, borderColor: tarsExpanded ? TH.mint + "30" : TH.border2, padding: 12, overflow: "hidden" }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <PulseIcon name="hardware-chip-outline" size={18} color={TH.mint} bg={TH.mint + "15"} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontFamily: F.monoB, fontSize: 9, color: TH.mint, letterSpacing: 2, marginBottom: 4 }}>{t.widgets?.tarsInsight || "TARS INSIGHT"}</Text>
                      <Ionicons name={esPremium ? (tarsExpanded ? "chevron-up" : "chevron-down") : "lock-closed"} size={14} color={C.t3} />
                    </View>
                    <TypewriterText text={tarsInsight} style={{ fontFamily: F.sans, fontSize: 12, color: C.t2, lineHeight: 18 }} />
                  </View>
                </View>

                {tarsExpanded && esPremium && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: TH.mint + "20" }}>
                    <Text style={{ fontSize: 10, color: TH.mint + "80", marginBottom: 10, fontFamily: F.mono, letterSpacing: 1 }}>{lang === 'en' ? "QUICK ACTIONS" : "ACCIONES RÁPIDAS"}</Text>
                    <TouchableOpacity onPress={() => setTab("chat")} style={{ backgroundColor: TH.mint + "10", padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: TH.mint + "20" }}>
                      <Text style={{ fontSize: 13, color: TH.mint, fontWeight: "600" }}>{">"} {lang === 'en' ? "Analyze my current debts" : "Analizar deudas actuales"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTab("chat")} style={{ backgroundColor: TH.mint + "10", padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: TH.mint + "20" }}>
                      <Text style={{ fontSize: 13, color: TH.mint, fontWeight: "600" }}>{">"} {lang === 'en' ? "Where am I spending the most?" : "¿En qué categoría estoy gastando más?"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTab("chat")} style={{ backgroundColor: TH.mint + "10", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: TH.mint + "20" }}>
                      <Text style={{ fontSize: 13, color: TH.mint, fontWeight: "600" }}>{">"} {lang === 'en' ? "Weekly summary" : "Resumen semanal"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
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
                <TouchableOpacity onPress={() => setGuideTopic("cashflow")} activeOpacity={0.8}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontFamily: F.monoB, fontSize: 12, color: C.gold, letterSpacing: 2 }}>{t.widgets?.flujoCaja?.toUpperCase() || "CASH_FLOW"}</Text>
                    <View style={{ backgroundColor: C.rose, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900", fontFamily: F.monoB }}>{lang === 'en' ? "6_MONTHS" : "6_MESES"}</Text>
                    </View>
                    <Ionicons name="help-circle-outline" size={14} color={C.t3} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={{ fontFamily: F.sans, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{lang === 'en' ? "ELITE_TRENDS_AND_HISTORY" : "HISTORIAL_Y_TENDENCIAS_ELITE"}</Text>
                </TouchableOpacity>
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
      <TarsGuideModal 
        visible={!!guideTopic} 
        topic={guideTopic} 
        onClose={() => setGuideTopic(null)} 
        esPremium={esPremium} 
        appState={appState} 
        derived={derived} 
        onAction={(id) => {
          if (id === 'goto_estrategia') setTab("estrategia");
        }} 
      />
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

      {/* FLOATING SAVINGS BUTTON — RIGHT */}
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

      {/* FLOATING TARS CAPSULE — LEFT */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => showTarsMenu ? closeTarsMenu() : openTarsMenu()}
        style={{
          position: "absolute",
          left: 0,
          top: "35%",
          backgroundColor: showTarsMenu ? TH.mint + "28" : TH.mint + "18",
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          borderWidth: 1,
          borderColor: TH.mint + "50",
          borderLeftWidth: 0,
          paddingVertical: 14,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: TH.mint,
          shadowOffset: { width: 3, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          zIndex: 51,
          maxWidth: 90,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Ionicons name="hardware-chip" size={18} color={TH.mint} />
          <Text style={{ fontFamily: F.monoB, fontSize: 7, color: TH.mint, marginTop: 5, letterSpacing: 0.8, textAlign: "center" }}>
            TARS
          </Text>
          <Text numberOfLines={2} style={{ fontFamily: F.mono, fontSize: 7, color: TH.mint + "CC", marginTop: 4, textAlign: "center", lineHeight: 10 }}>
            {tarsCapsuleMsg}
          </Text>
        </View>
        <Ionicons name={showTarsMenu ? "chevron-back" : "chevron-forward"} size={12} color={TH.mint} style={{ opacity: 0.6, marginLeft: 2 }} />
      </TouchableOpacity>

      {/* TARS QUICK ACTIONS POPUP */}
      {showTarsMenu && (
        <>
          {/* Dismiss overlay */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeTarsMenu}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }}
          />
          <Animated.View
            style={{
              position: "absolute",
              left: 90,
              top: "33%",
              zIndex: 52,
              transform: [{ translateX: tarsMenuAnim }],
              opacity: tarsMenuFade,
            }}
          >
            <View style={{
              backgroundColor: "#0A0A0A",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: TH.mint + "40",
              padding: 12,
              width: 210,
              shadowColor: TH.mint,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }}>
              <Text style={{ fontFamily: F.monoB, fontSize: 8, color: TH.mint + "90", letterSpacing: 1.5, marginBottom: 10 }}>
                {lang === 'en' ? "QUICK ACTIONS" : "ACCIONES RÁPIDAS"}
              </Text>
              {[
                { icon: "stats-chart-outline", key: "spending", label: lang === 'en' ? "Where am I spending most?" : "¿En qué gasto más?" },
                { icon: "calendar-outline",    key: "week",     label: lang === 'en' ? "Weekly summary"            : "Resumen de la semana" },
                { icon: "card-outline",        key: "debts",    label: lang === 'en' ? "Analyze my debts"          : "Analizar mis deudas" },
                { icon: "bulb-outline",        key: "save",     label: lang === 'en' ? "How can I save more?"      : "¿Cómo ahorro más?" },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleTarsAction(item.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    backgroundColor: TH.mint + "08",
                    marginBottom: i < 3 ? 6 : 0,
                    borderWidth: 1,
                    borderColor: TH.mint + "15",
                  }}
                >
                  <Ionicons name={item.icon} size={15} color={TH.mint} />
                  <Text style={{ flex: 1, fontFamily: F.sans, fontSize: 12, color: TH.t1, lineHeight: 16 }}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color={TH.mint + "60"} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Arrow pointing left to capsule */}
            <View style={{
              position: "absolute",
              left: -7,
              top: "50%",
              marginTop: -7,
              width: 0, height: 0,
              borderTopWidth: 7, borderTopColor: "transparent",
              borderBottomWidth: 7, borderBottomColor: "transparent",
              borderRightWidth: 7, borderRightColor: TH.mint + "40",
            }} />
          </Animated.View>
        </>
      )}
      {/* TARS FLOATING MESSAGE TOAST */}
      {tarsMsg && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 110,
            zIndex: 99,
            opacity: tarsMsgFade,
            transform: [{ translateY: tarsMsgAnim }],
          }}
        >
          <View style={{
            backgroundColor: "#0C0C0C",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: TH.mint + "45",
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            shadowColor: TH.mint,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
          }}>
            <View style={{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: TH.mint + "18",
              borderWidth: 1, borderColor: TH.mint + "40",
              alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Ionicons name="hardware-chip" size={17} color={TH.mint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.monoB, fontSize: 8, color: TH.mint, letterSpacing: 1.5, marginBottom: 5 }}>
                TARS
              </Text>
              <Text style={{ fontFamily: F.sans, fontSize: 13, color: TH.t1, lineHeight: 19 }}>
                {tarsMsg}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
