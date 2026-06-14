/**
 * TARS — Onboarding v2
 * - Efecto typewriter en cada paso (25 ms/carácter, botón Omitir)
 * - Transiciones Slide + Fade entre pasos
 * - Textos auditados según RAE (sin errores de ortografía)
 * - Sin emojis en texto de UI
 */
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, KeyboardAvoidingView, Platform, Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }          from "@expo/vector-icons";
import { useFinance }        from "../context/FinanceContext";
import { DARK_THEME as TH }  from "../constants/themes";
import { ICON, DEF_BUDGETS } from "../constants";
import { useLanguage }       from "../context/LanguageContext";
import { Btn, Input, CatIcon, styles } from "../components/base";
import { TypewriterText }    from "../components/TypewriterText";
import { saveApp }           from "../utils/security";
import { BlurView }          from "expo-blur";

const GlassCard = ({ children, style, padding = 16, borderColor }) => {
  return (
    <View style={[{ borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: borderColor || (TH.gold + "30") }, style]}>
      <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10, 10, 10, 0.4)" }}>
        <View style={{ padding }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const STEPS = ["bienvenida", "perfil", "ingresos", "presupuesto", "metas", "fin"];

export function OnboardingScreen() {
  const { onboardingDone } = useFinance();
  const { t } = useLanguage();
  const [step,     setStep]     = useState(0);
  const [userData, setUserData] = useState({ name: "", currency: "RD$", savingGoalPct: 20, darkMode: true });
  const [income,   setIncome]   = useState([]);
  const [budgets,  setBudgets]  = useState({ ...DEF_BUDGETS });
  const [goals,    setGoals]    = useState([]);
  const [gSource,  setGSource]  = useState("");
  const [gAmount,  setGAmount]  = useState("");
  const [gType,    setGType]    = useState("fijo");
  const [gName,    setGName]    = useState("");
  const [gTarget,  setGTarget]  = useState("");
  const [gWeeks,   setGWeeks]   = useState("12");
  const [gEmoji,   setGEmoji]   = useState(ICON.target);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  function transicionar(nextStep) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }).start(() => {
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
      });
    });
  }

  const goNext = () => transicionar(Math.min(step + 1, STEPS.length - 1));
  const goBack = () => transicionar(Math.max(step - 1, 0));

  const submit = () => {
    const next = {
      onboarded: true,
      user: { ...userData, darkMode: true },
      expenses: [], goals, debts: [], income, reminders: [], budgets, streakDays: [],
    };
    saveApp(next).then(() => onboardingDone(next)).catch(() => onboardingDone(next));
  };

  const dots = STEPS.map((_, i) => (
    <View key={i} style={{
      width: i === step ? 20 : 6, height: 6, borderRadius: 3, marginHorizontal: 3,
      backgroundColor: i === step ? TH.gold : i < step ? TH.gold + "55" : "rgba(255,255,255,0.1)",
    }} />
  ));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TH.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", paddingTop: 20, paddingBottom: 28 }}>
          {dots}
        </View>

        <Animated.View style={{ flex: 1, paddingHorizontal: 24, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>

          {step === 0 && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <View style={{ width: 90, height: 90, borderRadius: 28, backgroundColor: "rgba(201,168,76,0.08)", borderWidth: 1.5, borderColor: TH.gold + "50", alignItems: "center", justifyContent: "center", marginBottom: 32, shadowColor: TH.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 24 }}>
                <Text style={{ fontSize: 38, color: TH.gold, fontWeight: "900", letterSpacing: -2 }}>FX</Text>
              </View>
              <Text style={{ fontSize: 44, fontWeight: "900", color: TH.t1, textAlign: "center", marginBottom: 16, letterSpacing: 1 }}>
                Fyn<Text style={{ color: TH.gold }}>x</Text>
              </Text>
              <TypewriterText text={"Bienvenido al ecosistema Fynx.\nTu sistema de supervivencia financiera con IA."} style={{ textAlign: "center", fontSize: 16, lineHeight: 26, color: TH.t2 }} />
              <Btn label={"INICIAR SISTEMA"} onPress={goNext} style={{ marginTop: 50, width: "80%" }} />
            </View>
          )}

          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.obH, { color: TH.t1 }]}>{t.ob?.perfil?.titulo}</Text>
              <TypewriterText text={"Identifícate. Necesito tu nombre y moneda base para calibrar los cálculos. La meta de ahorro dicta qué tan agresivo será el sistema."} style={{ marginBottom: 20 }} />
              <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.perfil?.lblNombre}</Text>
              <Input value={userData.name} onChange={v => setUserData({ ...userData, name: v })} placeholder={t.ob?.perfil?.phNombre} />
              <Text style={[styles.lbl, { color: TH.t3, marginTop: 12 }]}>{t.ob?.perfil?.lblMoneda}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[["RD$", "Peso DO"], ["$", "USD / Peso"], ["€", "EUR"], ["S/", "Sol PEN"], ["R$", "Real BRL"], ["£", "Libra GBP"]].map(([c, l]) => (
                  <Pressable android_ripple={null} key={c} onPress={() => setUserData({ ...userData, currency: c })}
                    style={{ width: "31%", padding: 10, borderRadius: 13, borderWidth: 1.5, alignItems: "center", borderColor: userData.currency === c ? TH.gold : "rgba(255,255,255,0.05)", backgroundColor: userData.currency === c ? TH.gold+"20" : "rgba(20,20,20,0.5)" }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: userData.currency === c ? TH.gold : TH.t2 }}>{c}</Text>
                    <Text style={{ fontSize: 9, color: TH.t3, marginTop: 2, textAlign: "center" }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.perfil?.lblMeta}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {["10", "20", "30", "40", "50"].map(p => (
                  <Pressable android_ripple={null} key={p} onPress={() => setUserData({ ...userData, savingGoalPct: +p })}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 11, borderWidth: 1.5, alignItems: "center", borderColor: userData.savingGoalPct === +p ? TH.gold : "rgba(255,255,255,0.05)", backgroundColor: userData.savingGoalPct === +p ? TH.gold+"20" : "rgba(20,20,20,0.5)" }}>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: userData.savingGoalPct === +p ? TH.gold : TH.t3 }}>{p}%</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.obH, { color: TH.t1 }]}>{t.ob?.ingresos?.titulo}</Text>
              <TypewriterText text={"Los ingresos son el oxígeno de tu economía. Registra tus fuentes. Si es un salario o algo seguro, ponlo Fijo. Si varía cada mes, ponlo Variable."} style={{ marginBottom: 20 }} />
              {income.map((inc, i) => (
                <GlassCard key={inc.id} padding={12} borderColor="rgba(255,255,255,0.1)">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name={ICON.income} size={22} color={TH.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: TH.t1 }}>{inc.source}</Text>
                      <Text style={{ fontSize: 11, color: TH.gold }}>{userData.currency}{inc.amount.toLocaleString()}</Text>
                    </View>
                    <Pressable android_ripple={null} onPress={() => setIncome(income.filter((_, j) => j !== i))}>
                      <Ionicons name={ICON.close} size={24} color={TH.t4} />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
              <Input value={gSource} onChange={setGSource} placeholder={t.ob?.ingresos?.phFuente} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 2 }}><Input value={gAmount} onChange={setGAmount} placeholder={t.ob?.ingresos?.phMonto} numeric /></View>
                {t.ob?.ingresos && [["fijo", t.ob.ingresos.fijo], ["variable", t.ob.ingresos.variable]].map(([tKey, l]) => (
                  <Pressable android_ripple={null} key={tKey} onPress={() => setGType(tKey)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 13, borderWidth: 1.5, borderColor: gType === tKey ? TH.gold : "rgba(255,255,255,0.05)", backgroundColor: gType === tKey ? TH.gold+"20" : "rgba(20,20,20,0.5)" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: gType === tKey ? TH.gold : TH.t3 }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <Btn label={t.ob?.ingresos?.btnAgregar || "Add"} ghost onPress={() => {
                if (!gSource || !gAmount) return;
                setIncome([...income, { id: Date.now(), source: gSource, amount: +gAmount, type: gType, date: new Date().toISOString().split("T")[0] }]);
                setGSource(""); setGAmount("");
              }} style={{ marginTop: 4 }} />
            </ScrollView>
          )}

          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.obH, { color: TH.t1 }]}>{t.ob?.presupuesto?.titulo}</Text>
              <TypewriterText text={"Establecer límites no es restricción, es disciplina táctica. Define cuánto gastarás como máximo al mes en cada categoría. Yo me encargaré de avisarte si te acercas al peligro."} style={{ marginBottom: 20 }} />
              {Object.entries(budgets).map(([cat, val]) => (
                <GlassCard key={cat} padding={10} borderColor="rgba(255,255,255,0.05)">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <CatIcon cat={cat} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: TH.t2, marginBottom: 4 }}>{t.cats?.[cat] || cat}</Text>
                      <Input value={String(val)} onChange={v => setBudgets({ ...budgets, [cat]: +v || 0 })} placeholder={t.ob?.presupuesto?.phLimite} numeric style={{ marginBottom: 0 }} />
                    </View>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          )}

          {step === 4 && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.obH, { color: TH.t1 }]}>{t.ob?.metas?.titulo}</Text>
              <TypewriterText text={"¿Por qué luchamos? Establece un objetivo. Un viaje, un auto, un fondo de emergencia... Esto transformará el aburrido acto de ahorrar en pura motivación táctica."} style={{ marginBottom: 20 }} />
              <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.metas?.lblQue}</Text>
              <Input value={gName} onChange={setGName} placeholder={t.ob?.metas?.phMeta} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.metas?.lblSimbolo}</Text>
                  <Input value={gEmoji} onChange={setGEmoji} style={{ textAlign: "center", fontSize: 18 }} />
                </View>
                <View style={{ flex: 2.5 }}>
                  <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.metas?.lblCosto} ({userData.currency})</Text>
                  <Input value={gTarget} onChange={setGTarget} placeholder={t.ob?.metas?.phMonto} numeric />
                </View>
              </View>
              <Text style={[styles.lbl, { color: TH.t3 }]}>{t.ob?.metas?.lblPlazo}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {(t.ob?.metas?.plazos || []).map(([w, l]) => (
                  <Pressable android_ripple={null} key={w} onPress={() => setGWeeks(w)}
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, alignItems: "center", borderColor: gWeeks === w ? TH.gold : "rgba(255,255,255,0.05)", backgroundColor: gWeeks === w ? TH.gold+"20" : "rgba(20,20,20,0.5)" }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: gWeeks === w ? TH.gold : TH.t3 }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              {gName && gTarget && (
                <Btn label={t.ob?.metas?.btnAgregar || "Add"} ghost onPress={() => {
                  setGoals([...goals, { id: Date.now(), name: gName, emoji: gEmoji, target: +gTarget, saved: 0, weeks: +gWeeks }]);
                  setGName(""); setGTarget("");
                }} style={{ marginTop: 12 }} />
              )}
              {goals.map(g => (
                <GlassCard key={g.id} padding={12} style={{ marginTop:8 }} borderColor="rgba(255,255,255,0.1)">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name={g.emoji || "flag-outline"} size={22} color={TH.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: TH.t1 }}>{g.name}</Text>
                      <Text style={{ fontSize: 11, color: TH.t3 }}>{userData.currency}{g.target.toLocaleString()}</Text>
                    </View>
                    <Pressable android_ripple={null} onPress={() => setGoals(goals.filter(x => x.id !== g.id))}>
                      <Ionicons name={ICON.close} size={24} color={TH.t4} />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          )}

          {step === 5 && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)", borderWidth: 1.5, borderColor: TH.gold + "50", alignItems: "center", justifyContent: "center", marginBottom: 24, shadowColor: TH.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
                <Ionicons name={ICON.check} size={42} color={TH.gold} />
              </View>
              <Text style={{ fontSize: 26, fontWeight: "900", color: TH.t1, textAlign: "center", marginBottom: 14 }}>
                {t.ob?.fin?.titulo ? t.ob.fin.titulo(userData.name) : `Ready`}
              </Text>
              <TypewriterText text={"Sistema calibrado.\n\nLa supervivencia financiera no es magia, es disciplina matemática. A partir de hoy, yo cuidaré tu espalda."} style={{ textAlign: "center", marginTop: 8 }} />
              <Btn label={t.ob?.fin?.cta || "Finish"} onPress={submit} style={{ marginTop: 32, width: "80%" }} />
            </View>
          )}

        </Animated.View>

        {step > 0 && step < STEPS.length - 1 && (
          <View style={{ flexDirection: "row", gap: 12, padding: 20 }}>
            <Btn label={t.ob?.nav?.atras || "Back"} onPress={goBack} ghost style={{ flex: 1 }} />
            <Btn label={step === STEPS.length - 2 ? (t.ob?.nav?.finalizar || "Finish") : (t.ob?.nav?.siguiente || "Next")} onPress={step === STEPS.length - 2 ? submit : goNext} style={{ flex: 2 }} />
          </View>
        )}
        {step === 0 && <View style={{ height: 20 }} />}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
