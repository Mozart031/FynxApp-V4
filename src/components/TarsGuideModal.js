import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F } from '../constants/themes';
import { useLanguage } from '../context/LanguageContext';
import { queryGemini } from '../services/gemini';
import { money } from '../utils/formatters';

const { width, height } = Dimensions.get("window");

export function TarsGuideModal({ visible, topic, onClose, esPremium, appState, derived, onAction, onAskTars }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [actionBtn, setActionBtn] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 280, useNativeDriver: true }),
      ]).start();
    }
    prevVisibleRef.current = visible;
  }, [visible, fadeAnim, slideAnim]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [loading, scanAnim]);

  useEffect(() => {
    if (!visible) {
      setInsight(null);
      setActionBtn(null);
      return;
    }

    let staticTitle = lang === 'en' ? "GUIDE" : "GUÍA";
    let staticText = lang === 'en' ? "How can I help you understand this?" : "¿Cómo puedo ayudarte a entender esto?";
    let icon = "information-circle-outline";

    if (topic === "score") {
      staticTitle = lang === 'en' ? "FINANCIAL SCORE" : "SCORE FINANCIERO";
      staticText = lang === 'en' 
        ? "This is your core metric. It evaluates your spending habits, savings rate, and financial consistency. Keep it in the 'GOLD' zone by saving more than you spend."
        : "Esta es tu métrica central. Evalúa tus hábitos de gasto, capacidad de ahorro y consistencia. Mantenlo en la zona 'DORADA' gastando menos de lo que ganas.";
      icon = "speedometer-outline";
    } else if (topic === "cashflow") {
      staticTitle = lang === 'en' ? "CASH FLOW" : "FLUJO DE CAJA";
      staticText = lang === 'en'
        ? "This compares your income against your expenses over the last 6 months. A healthy cash flow means the green bar is always higher than the red."
        : "Compara tus ingresos frente a tus gastos en los últimos 6 meses. Un flujo de caja saludable significa que la barra verde siempre es más alta que la roja.";
      icon = "stats-chart-outline";
    } else if (topic === "insight") {
      staticTitle = lang === 'en' ? "TARS INSIGHT" : "ANÁLISIS DE TARS";
      icon = "hardware-chip-outline";
    } else if (topic === "metas") {
      staticTitle = lang === 'en' ? "GOALS STRATEGY" : "ESTRATEGIA DE METAS";
      icon = "flag-outline";
    } else if (topic === "deudas") {
      staticTitle = lang === 'en' ? "DEBT STRATEGY" : "ESTRATEGIA DE DEUDAS";
      icon = "flame-outline";
    } else if (topic === "pagos") {
      staticTitle = lang === 'en' ? "FIXED PAYMENTS" : "PAGOS FIJOS";
      icon = "calendar-outline";
    }

    if (esPremium && (topic === "insight" || topic === "metas" || topic === "deudas" || topic === "pagos")) {
      setLoading(true);
      
      const cur = appState?.user?.currency || "RD$";
      const promptData = {
        score: derived?.sc,
        balance: money(derived?.balance || 0, cur),
        monthlyIncome: money(derived?.totalInc || 0, cur),
        monthlyExpense: money(derived?.totalExp || 0, cur),
        debts: appState?.debts?.map(d => ({ name: d.name, balance: d.balance, rate: d.rate })) || [],
        goals: appState?.goals?.map(g => ({ name: g.name, target: g.target, saved: g.saved })) || [],
        reminders: appState?.reminders?.length || 0,
      };

      const systemInstruction = `You are TARS, an elite AI financial advisor. Speak in ${lang === 'en' ? 'English' : 'Spanish'}. Your tone is analytical, direct, and actionable. Provide exactly one JSON object with NO markdown block or extra text. Format: {"title":"...", "text":"...", "buttonLabel":"...", "actionId":"..."}`;
      
      let prompt = `Based on this data: ${JSON.stringify(promptData)}\n`;
      if (topic === "insight") {
        prompt += `Give a brief analysis of the user's current month cashflow and score. If they are doing bad, suggest an action. Action IDs: "goto_estrategia", "add_budget", "close".`;
      } else if (topic === "metas") {
        prompt += `Analyze their savings goals. Congratulate progress or warn if they don't have any. Action IDs: "close".`;
      } else if (topic === "deudas") {
        prompt += `Analyze their debts. Suggest which one to pay first based on interest rate. Action IDs: "close".`;
      } else if (topic === "pagos") {
        prompt += `Analyze their fixed payments. Mention if they are keeping track well. Action IDs: "close".`;
      }

      queryGemini(prompt, null, systemInstruction)
        .then(res => {
          try {
            const match = res.match(/\{[\s\S]*\}/);
            if (match) {
              const data = JSON.parse(match[0]);
              setInsight({ title: data.title || staticTitle, text: data.text, icon });
              if (data.buttonLabel && data.actionId && data.actionId !== "close") {
                setActionBtn({ label: data.buttonLabel, id: data.actionId });
              }
            } else {
              throw new Error("Invalid format");
            }
          } catch (e) {
            setInsight({ title: staticTitle, text: lang === 'en' ? "Everything looks good from here. Keep executing your plan." : "Todo se ve bien desde aquí. Sigue ejecutando tu plan.", icon });
          }
          setLoading(false);
        })
        .catch(() => {
          setInsight({ title: staticTitle, text: lang === 'en' ? "Everything looks good from here. Keep executing your plan." : "Todo se ve bien desde aquí. Sigue ejecutando tu plan.", icon });
          setLoading(false);
        });

    } else {
      setInsight({ title: staticTitle, text: staticText, icon });
    }
  }, [visible, topic, esPremium, lang, appState, derived]);

  const translateYScan = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15]
  });

  return (
    <Animated.View pointerEvents={visible ? "auto" : "none"} style={[styles.masterContainer, { opacity: fadeAnim }]}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'android' ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.3)" }]} />
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      
      <SafeAreaView style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.tarsPrefix}>TARS {'>'} {lang === 'en' ? "SYSTEM_LINK" : "ENLACE_SISTEMA"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, width: '100%' }}>
              <View style={[styles.iconContainer, { borderColor: C.mint + "40", overflow: 'hidden' }]}>
                <Ionicons name="hardware-chip-outline" size={28} color={C.mint} />
                <Animated.View style={{ position: 'absolute', width: '100%', height: 2, backgroundColor: C.mint, transform: [{ translateY: translateYScan }], shadowColor: C.mint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5 }} />
              </View>
              <Text style={[styles.tarsPrefix, { color: C.mint, marginTop: 16 }]}>{lang === 'en' ? "ANALYZING FINANCIAL STATE..." : "ANALIZANDO ESTADO FINANCIERO..."}</Text>
            </View>
          ) : (
            <View>
              <View style={[styles.iconContainer, { borderColor: insight?.icon === 'sparkles' ? C.mint + "40" : C.gold + "40" }]}>
                <Ionicons name={insight?.icon} size={28} color={insight?.icon === 'sparkles' ? C.mint : C.gold} />
              </View>
              
              <Text style={styles.title}>{insight?.title}</Text>
              <Text style={styles.text}>{insight?.text}</Text>
              
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => {
                  onClose();
                  // If static guide (not premium AI insight), offer to open TARS chat
                  if (!esPremium && onAskTars) {
                    setTimeout(() => onAskTars(), 300);
                  }
                }}>
                  <Text style={styles.btnText}>{esPremium ? (lang === 'en' ? "UNDERSTOOD" : "ENTENDIDO") : (lang === 'en' ? "ASK TARS" : "PREGUNTAR A TARS")}</Text>
                </TouchableOpacity>

                {actionBtn && (
                  <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: C.mint + "20", borderColor: C.mint }]} onPress={() => {
                    onAction && onAction(actionBtn.id);
                    onClose();
                  }}>
                    <Text style={[styles.btnText, { color: C.mint }]}>{actionBtn.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    position: "absolute", top: 0, left: 0,
    width, height, zIndex: 9999, elevation: 99,
  },
  card: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 110 : 96,
    width: '100%',
    borderWidth: 1,
    borderColor: C.border2,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeBtn: { 
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", 
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" 
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.gold + "15",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gold + "40",
  },
  tarsPrefix: {
    fontFamily: F.monoB,
    fontSize: 10,
    color: C.gold,
    letterSpacing: 2,
  },
  title: {
    fontFamily: F.monoB,
    fontSize: 18,
    color: C.t1,
    marginBottom: 12,
    letterSpacing: 1,
  },
  text: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.t2,
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: C.gold + "15",
    borderWidth: 1,
    borderColor: C.gold + "50",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: F.monoB,
    fontSize: 12,
    color: C.gold,
    letterSpacing: 1.5,
  }
});
