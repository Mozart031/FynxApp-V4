import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { ICON, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { payoffMonths } from "../utils/finance";
import { Btn, Bar, Tag, Input, styles } from "../components/base";
import { BlurView } from "expo-blur";
import { PremiumModal } from "../components/PremiumModal";

const GlassCard = ({ children, style, padding = 16, borderColor }) => {
  return (
    <View style={[{ borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: borderColor || (C.gold + "30") }, style]}>
      <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10, 10, 10, 0.4)" }}>
        <View style={{ padding }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const GOAL_ICONS = [
  "flag-outline",
  "car-outline",
  "airplane-outline",
  "laptop-outline",
  "home-outline",
  "diamond-outline"
];

// ── Metas ──────────────────────────────────────────────────────────────────
function MetasTab({ state, setGoals, onPremium, t, lang, showAlert }) {
  const { user, goals=[], income=[] } = state;
  const cur      = user.currency;
  const [adding,   setAdding]   = useState(false);
  const [selected, setSelected] = useState(0);
  const [form,     setForm]     = useState({ name:"", emoji:"flag-outline", target:"", weeks:"12", freq:"semanal" });
  const FREQ = [
    { id:"diario",    label:"Diario",    divisor: w => w * 7,             suffix:"/día" },
    { id:"semanal",   label:"Semanal",   divisor: w => w,                 suffix:"/semana" },
    { id:"quincenal", label:"Quincenal", divisor: w => Math.ceil(w / 2),  suffix:"/quincena" },
    { id:"mensual",   label:"Mensual",   divisor: w => Math.ceil(w / 4.33), suffix:"/mes" },
  ];
  const goalColors = [C.sky, C.mint, C.violet, C.gold, C.orange, C.pink];
  const active     = goals.length > 0 ? goals[Math.min(selected, goals.length-1)] : null;
  const activePct  = active ? Math.min((active.saved / active.target)*100, 100) : 0;
  const activeColor = goalColors[selected % goalColors.length];

  const staggerAnims = useRef(goals.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const anims = goals.map((_, i) =>
      Animated.timing(staggerAnims[i] || new Animated.Value(0), {
        toValue:1, duration:300, delay: i * 80, useNativeDriver:true,
      })
    );
    Animated.stagger(80, anims).start();
  }, [goals.length]);

  function CircleProgress({ pct, size, color, children }) {
    const deg = Math.round((pct / 100) * 360);
    return (
      <View style={{ width:size, height:size, alignItems:"center", justifyContent:"center" }}>
        <View style={{ position:"absolute", width:size, height:size, borderRadius:size/2, borderWidth:10, borderColor:"rgba(255,255,255,0.05)" }} />
        {deg > 0 && <View style={{ position:"absolute", width:size, height:size, borderRadius:size/2, borderWidth:10,
          borderColor:"transparent", borderTopColor:color,
          borderRightColor: deg>=90 ? color : "transparent",
          borderBottomColor: deg>=180 ? color : "transparent",
          borderLeftColor: deg>=270 ? color : "transparent",
          transform:[{ rotate:"-90deg" }] }} />}
        <View style={{ alignItems:"center", justifyContent:"center" }}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:130 }}>
      {/* ── EMPTY STATE ── */}
      {goals.length === 0 && !adding && (
        <View style={{ alignItems:"center", paddingHorizontal:32, paddingTop:36, paddingBottom:24 }}>
          {/* Icon */}
          <View style={{ width:100, height:100, borderRadius:50, backgroundColor:"rgba(0,229,176,0.08)", borderWidth:1.5, borderColor:C.mint+"40", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <Ionicons name="flag-outline" size={44} color={C.mint} />
          </View>
          {/* Title */}
          <Text style={{ fontSize:18, fontWeight:"900", color:C.t1, textAlign:"center", marginBottom:8 }}>
            {lang === 'en' ? "Set your financial targets" : "Define hacia dónde va tu dinero"}
          </Text>
          {/* Description */}
          <Text style={{ fontSize:13, color:C.t3, textAlign:"center", lineHeight:20, marginBottom:24 }}>
            {lang === 'en' 
              ? "Create savings goals and TARS will tell you how to reach them."
              : "Crea metas de ahorro y TARS te dirá cómo alcanzarlas."}
          </Text>
          {/* CTA */}
          <TouchableOpacity onPress={() => setAdding(true)}
            style={{ backgroundColor:C.mint, paddingHorizontal:32, paddingVertical:14, borderRadius:20, marginTop:10, shadowColor:C.mint, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 }}>
            <Text style={{ fontSize:14, fontWeight:"900", color:"#000", letterSpacing:0.5 }}>{lang === 'en' ? "Create my first goal" : "Crear mi primera meta"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {goals.length > 0 && !adding && (
        <>
          <View style={{ alignItems:"center", paddingVertical:24 }}>
            <CircleProgress pct={activePct} size={200} color={activeColor}>
              <Ionicons name={active.emoji || "flag-outline"} size={28} color={activeColor} style={{ marginBottom:3 }} />
              <Text style={{ fontSize:38, fontWeight:"900", color:activeColor, letterSpacing:-2 }}>{Math.round(activePct)}%</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>{lang === 'en' ? "Progress" : "Progreso"}</Text>
              <Text style={{ fontSize:13, fontWeight:"700", color:C.t2, marginTop:3 }} numberOfLines={1}>{active.name}</Text>
            </CircleProgress>
            <View style={{ marginTop:14, alignItems:"center" }}>
              <Text style={{ fontSize:20, fontWeight:"900", color:C.t1 }}>{money(active.saved, cur)}</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>{lang === 'en' ? "of" : "de"} {money(active.target, cur)}</Text>
            </View>
          </View>

          {goals.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal:16, marginBottom:14 }}>
              <View style={{ flexDirection:"row", gap:8 }}>
                {goals.map((g, i) => {
                  const col = goalColors[i % goalColors.length];
                  return (
                    <TouchableOpacity key={g.id} onPress={() => setSelected(i)}
                      style={{ paddingHorizontal:14, paddingVertical:10, borderRadius:13, borderWidth:1.5,
                        borderColor: selected===i ? col : "rgba(255,255,255,0.05)",
                        backgroundColor: selected===i ? col+"20" : "rgba(20,20,20,0.5)", alignItems:"center", minWidth:86 }}>
                      <Ionicons name={g.emoji || "flag-outline"} size={16} color={col} style={{ marginBottom:2 }} />
                      <Text style={{ fontSize:10, fontWeight:"700", color: selected===i ? col : C.t3 }} numberOfLines={1}>{g.name}</Text>
                      <Text style={{ fontSize:9, color:C.t3, marginTop:1 }}>{Math.round(Math.min((g.saved/g.target)*100,100))}%</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {goals.map((g, i) => {
            const pct    = Math.min((g.saved / g.target)*100, 100);
            const col    = goalColors[i % goalColors.length];
            const freqInfo = FREQ.find(f => f.id === (g.freq || "semanal")) || FREQ[1];
            const periods  = freqInfo.divisor(Math.max(g.weeks, 1));
            const perPeriod = ((g.target - g.saved) / Math.max(periods, 1)).toFixed(0);
            const anim   = staggerAnims[i];
            const translateY = anim ? anim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) : 0;
            return (
              <Animated.View key={g.id} style={{ opacity:anim || 1, transform:[{ translateY }] }}>
                <GlassCard style={{ marginHorizontal:16 }} borderColor={selected===i ? col+"50" : "rgba(255,255,255,0.1)"}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 }}>
                    <View style={{ width:44, height:44, borderRadius:13, backgroundColor:col+"20",
                      borderWidth:1.5, borderColor:col+"40", alignItems:"center", justifyContent:"center" }}>
                      <Ionicons name={g.emoji || "flag-outline"} size={20} color={col} />
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:14, fontWeight:"800", color:C.t1 }}>{g.name}</Text>
                      <Text style={{ fontSize:11, color:C.t3, marginTop:1 }}>{money(g.saved,cur)} {lang === 'en' ? "of" : "de"} {money(g.target,cur)}</Text>
                    </View>
                    <View style={{ alignItems:"flex-end", gap:4 }}>
                      <Tag label={Math.round(pct)+"%"} color={col} />
                      <TouchableOpacity onPress={() => setGoals(goals.filter(x => x.id !== g.id))}>
                        <Text style={{ fontSize:10, color:C.t4 }}>{lang === 'en' ? "delete" : "eliminar"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Bar pct={pct} color={col} h={6} />
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:8 }}>
                    <Text style={{ fontSize:10, color:C.t3 }}>{lang === 'en' ? "Save" : "Aparta"} {money(+perPeriod,cur)}{freqInfo.suffix}</Text>
                    <Text style={{ fontSize:10, color:col, fontWeight:"700" }}>{lang === 'en' ? "Left:" : "Faltan"} {money(g.target-g.saved,cur)}</Text>
                  </View>
                </GlassCard>
              </Animated.View>
            );
          })}
        </>
      )}

      {adding && (
        <GlassCard style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:15, fontWeight:"800", color:C.t1, marginBottom:14 }}>{lang === 'en' ? "New Goal" : "Nueva meta"}</Text>
          <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "WHAT DO YOU WANT TO ACHIEVE" : "QUÉ QUIERES LOGRAR"}</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder={lang === 'en' ? "e.g.: Laptop, Trip, Fund..." : "ej: Laptop, Viaje, Fondo..."} />
          <View style={{ flexDirection:"row", gap:10, marginBottom:10 }}>
            <View style={{ flex:2.5 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "TARGET" : "COSTO"} ({cur})</Text>
              <Input value={form.target} onChange={v => setForm({ ...form, target:v })} placeholder="ej: 50000" numeric />
            </View>
          </View>
          <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "SYMBOL" : "SÍMBOLO"}</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {GOAL_ICONS.map(ic => (
              <TouchableOpacity key={ic} onPress={() => setForm({ ...form, emoji:ic })}
                style={{ width:42, height:42, borderRadius:10, borderWidth:1.5,
                  borderColor: form.emoji===ic ? C.mint : "rgba(255,255,255,0.05)", backgroundColor: form.emoji===ic ? C.mint+"22" : "rgba(20,20,20,0.5)", alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={ic} size={18} color={form.emoji===ic ? C.mint : C.t3} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "TIMEFRAME" : "PLAZO"}</Text>
          <View style={{ flexDirection:"row", gap:8, marginTop:8, marginBottom:14 }}>
            {[["4","1 mes"],["12","3 meses"],["24","6 meses"],["52","1 año"]].map(([w,l]) => (
              <TouchableOpacity key={w} onPress={() => setForm({ ...form, weeks:w })}
                style={{ flex:1, paddingVertical:10, borderRadius:11, borderWidth:1.5, alignItems:"center",
                  borderColor: form.weeks===w ? C.mint : "rgba(255,255,255,0.1)", backgroundColor: form.weeks===w ? C.mint+"20" : "rgba(20,20,20,0.5)" }}>
                <Text style={{ fontSize:10, fontWeight:"700", color: form.weeks===w ? C.mint : C.t3 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.lbl, { color:C.t3, marginTop:4 }]}>{lang === 'en' ? "SAVING FREQUENCY" : "FRECUENCIA DE AHORRO"}</Text>
          <View style={{ flexDirection:"row", gap:8, marginTop:8, marginBottom:14 }}>
            {FREQ.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setForm({ ...form, freq:f.id })}
                style={{ flex:1, paddingVertical:10, borderRadius:11, borderWidth:1.5, alignItems:"center",
                  borderColor: form.freq===f.id ? C.sky : "rgba(255,255,255,0.1)", backgroundColor: form.freq===f.id ? C.sky+"20" : "rgba(20,20,20,0.5)" }}>
                <Text style={{ fontSize:9, fontWeight:"700", color: form.freq===f.id ? C.sky : C.t3 }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.name && form.target && (() => {
            const fi = FREQ.find(f => f.id === form.freq) || FREQ[1];
            const periods = fi.divisor(Math.max(+form.weeks, 1));
            const amount = Math.ceil(+form.target / Math.max(periods, 1));
            return (
              <View style={{ backgroundColor:C.mint+"15", borderRadius:11, borderWidth:1, borderColor:C.mint+"40", padding:11, marginBottom:12 }}>
                <Text style={{ fontSize:12, color:C.t2 }}>
                  {lang === 'en' ? "Save" : "Aparta"} <Text style={{ color:C.mint, fontWeight:"700" }}>{cur}{amount.toLocaleString()}{fi?.suffix || ''}</Text>
                </Text>
              </View>
            );
          })()}
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label={lang === 'en' ? "Back" : "Atrás"} onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label={lang === 'en' ? "Save Goal" : "Guardar meta"} onPress={() => {
              const targetNum = Number(form.target);
              if (!form.name || !form.target) return;
              if (isNaN(targetNum) || targetNum <= 0) {
                showAlert(lang === 'en' ? "Invalid Amount" : "Monto Inválido", lang === 'en' ? "The goal amount must be greater than 0." : "El monto de la meta debe ser mayor a 0.", [], "error");
                return;
              }
              setGoals([...goals, { id:Date.now(), ...form, target:targetNum, saved:0, weeks:+form.weeks, freq:form.freq }]);
              setAdding(false); setForm({ name:"", emoji:"flag-outline", target:"", weeks:"12", freq:"semanal" });
            }} style={{ flex:2 }} />
          </View>
        </GlassCard>
      )}

      {!adding && goals.length > 0 && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && goals.length >= 1) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.mint,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>{lang === 'en' ? "Add Goal" : "Añadir meta"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Deudas ──────────────────────────────────────────────────────────────────
function DeudasTab({ state, setDebts, onPremium, t, lang, showAlert }) {
  const { user, debts=[] } = state;
  const cur = user.currency;
  const [adding, setAdding] = useState(false);
  const [extra,  setExtra]  = useState("");
  const [form,   setForm]   = useState({ name:"", type:"tarjeta", balance:"", rate:"", minPay:"", limit:"", color:C.rose });

  const totalDebt = debts.reduce((a,d) => a+d.balance, 0);
  const totalInt  = debts.reduce((a,d) => a+(d.balance*d.rate/100/12), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
      {/* ── EMPTY STATE ── */}
      {debts.length === 0 && !adding && (
        <View style={{ alignItems:"center", paddingHorizontal:32, paddingTop:36, paddingBottom:24 }}>
          <View style={{ width:100, height:100, borderRadius:50, backgroundColor:"rgba(239,68,68,0.08)", borderWidth:1.5, borderColor:C.rose+"40", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <Ionicons name="flame-outline" size={44} color={C.rose} />
          </View>
          <Text style={{ fontSize:18, fontWeight:"900", color:C.t1, textAlign:"center", marginBottom:8 }}>
            {lang === 'en' ? "Destroy your debts" : "Destruye tus deudas"}
          </Text>
          <Text style={{ fontSize:13, color:C.t3, textAlign:"center", lineHeight:20, marginBottom:24 }}>
            {lang === 'en' 
              ? "Record your debts and crush them strategically. TARS calculates the smartest path."
              : "Registra tus deudas y destruyelas con estrategia. TARS calcula el camino más inteligente."}
          </Text>
          <TouchableOpacity onPress={() => setAdding(true)}
            style={{ backgroundColor:C.rose, paddingHorizontal:32, paddingVertical:14, borderRadius:20, marginTop:10, shadowColor:C.rose, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 }}>
            <Text style={{ fontSize:14, fontWeight:"900", color:"#000", letterSpacing:0.5 }}>{lang === 'en' ? "Add debt" : "Agregar deuda"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {debts.length > 0 && !adding && (
        <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:C.rose+"45" }}>
          <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10,10,10,0.4)" }}>
            <View style={{ padding:16 }}>
              <Text style={{ fontSize:9, color:C.rose, letterSpacing:2.5, fontWeight:"700", marginBottom:8 }}>{lang === 'en' ? "SUMMARY" : "RESUMEN"}</Text>
              <Text style={{ fontSize:34, fontWeight:"900", color:C.rose, letterSpacing:-1 }}>{money(totalDebt, cur)}</Text>
            </View>
            <View style={{ flexDirection:"row", backgroundColor:C.rose+"10", borderTopWidth:1, borderTopColor:C.rose+"22" }}>
              {[[money(Math.round(totalInt),cur),lang === 'en' ? "Interest/mo" : "Intereses/mes"],[debts.length+(lang === 'en' ? " debts" : " deudas"),lang === 'en' ? "Active" : "Activas"],[money(debts.reduce((a,d)=>a+d.minPay,0),cur),lang === 'en' ? "Min. Pay" : "Pago mín."]].map(([v,l],i) => (
                <View key={l} style={{ flex:1, paddingVertical:12, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:C.rose+"18" }}>
                  <Text style={{ fontSize:12, fontWeight:"800", color:i===0?C.rose:C.t1 }}>{v}</Text>
                  <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </View>
      )}

      {debts.length > 0 && !adding && (
        <GlassCard style={{ marginHorizontal:16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 6 }}>
            <Ionicons name={ICON.save} size={16} color={C.t1} />
            <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>{lang === 'en' ? "Extra Payment" : "Pago Extra"}</Text>
          </View>
          <Input value={extra} onChange={setExtra} placeholder={lang === 'en' ? `Extra monthly payment (${cur})` : `Abono adicional mensual (${cur})`} numeric style={{ marginBottom:0 }} />
        </GlassCard>
      )}

      {debts.length > 0 && !adding && debts.map(d => {
        const t       = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
        const dc      = d.color || t.color;
        const pctPaid = d.limit > 0 ? Math.round(((d.limit-d.balance)/d.limit)*100) : 0;
        const mo      = payoffMonths(d.balance, d.rate, d.minPay + Number(extra||0));
        const tl      = mo === Infinity ? (lang === 'en' ? "Interest only" : "Solo intereses") : mo > 24 ? (mo/12).toFixed(1)+(lang === 'en' ? " yrs" : " años") : mo+(lang === 'en' ? " months" : " meses");
        return (
          <GlassCard key={d.id} style={{ marginHorizontal:16 }} borderColor={dc+"45"} padding={0}>
            <View style={{ padding:16 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                  <View style={{ width:44, height:44, borderRadius:13, backgroundColor:dc+"22", borderWidth:1.5, borderColor:dc+"40", alignItems:"center", justifyContent:"center" }}>
                    <Ionicons name={t.icon} size={20} color={dc} />
                  </View>
                  <View>
                    <Text style={{ fontSize:14, fontWeight:"800", color:C.t1 }}>{d.name}</Text>
                    <Tag label={t.label} color={dc} size="sm" />
                  </View>
                </View>
                <TouchableOpacity onPress={() => setDebts(debts.filter(x => x.id !== d.id))}
                  style={{ padding:6, borderRadius:9, backgroundColor:"rgba(255,255,255,0.05)" }}>
                  <Ionicons name={ICON.close} size={18} color={C.t3} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection:"row", backgroundColor:"rgba(0,0,0,0.5)", borderRadius:12, overflow:"hidden", marginBottom:12, borderWidth:1, borderColor:"rgba(255,255,255,0.05)" }}>
                {[[lang === 'en' ? "Bal" : "Saldo",money(d.balance,cur),C.rose],[lang === 'en' ? "Rate" : "Tasa",d.rate+(lang === 'en' ? "%/yr" : "% anual"),C.gold],[lang === 'en' ? "Min/mo" : "Mín/mes",money(d.minPay,cur),C.t1]].map(([l,v,c],i) => (
                  <View key={l} style={{ flex:1, paddingVertical:10, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:"rgba(255,255,255,0.05)" }}>
                    <Text style={{ fontSize:12, fontWeight:"800", color:c }}>{v}</Text>
                    <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
                  </View>
                ))}
              </View>
              {d.limit > 0 && (
                <View style={{ marginBottom:10 }}>
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:5 }}>
                    <Text style={{ fontSize:11, color:C.t3 }}>{lang === 'en' ? "Payment Progress" : "Progreso de pago"}</Text>
                    <Text style={{ fontSize:11, color:dc, fontWeight:"700" }}>{pctPaid}% {lang === 'en' ? "paid" : "pagado"}</Text>
                  </View>
                  <Bar pct={pctPaid} color={dc} h={6} />
                </View>
              )}
              <View style={{ backgroundColor:dc+"14", borderRadius:11, padding:10, borderWidth:1, borderColor:dc+"25",
                flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ fontSize:12, color:C.t2 }}>{lang === 'en' ? "Free in: " : "Libre en: "}<Text style={{ color:dc, fontWeight:"700" }}>{tl}</Text></Text>
                {d.rate > 0 && <Text style={{ fontSize:11, color:C.rose, fontWeight:"700" }}>{money(Math.round(d.balance*d.rate/100),cur)}/{lang === 'en' ? "yr" : "año"}</Text>}
              </View>
            </View>
          </GlassCard>
        );
      })}

      {adding ? (
        <GlassCard style={{ marginHorizontal:16, borderWidth: 1, borderColor: C.gold+"50" }}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 16 }}>
            <Text style={{ fontSize:16, fontWeight:"900", color:C.gold, letterSpacing: 0.5 }}>{lang === 'en' ? "ADD NEW DEBT" : "AGREGAR NUEVA DEUDA"}</Text>
            <Text style={{ fontSize:11, color:C.t3, marginTop: 4 }}>{lang === 'en' ? "Fill in the details for TARS to calculate your strategy." : "Completa los datos para que TARS calcule tu estrategia de pago."}</Text>
          </View>

          <Text style={[styles.lbl, { color:C.t2 }]}>{lang === 'en' ? "WHAT IS THE NAME OF THIS DEBT?" : "¿CÓMO SE LLAMA ESTA DEUDA?"}</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder={lang === 'en' ? "E.g: Visa Credit Card" : "Ej: Tarjeta BHD Visa"} style={{ marginBottom: 16 }} />
          
          <Text style={[styles.lbl, { color:C.t2, marginBottom: 8 }]}>{lang === 'en' ? "SELECT THE TYPE" : "SELECCIONA EL TIPO"}</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {DEBT_TYPES.map(t => (
              <TouchableOpacity key={t.id} onPress={() => setForm({ ...form, type:t.id, color:t.color })}
                style={{ paddingHorizontal:14, paddingVertical:10, borderRadius:12, borderWidth:1.5, flexDirection: "row", alignItems: "center", gap: 6,
                  borderColor: form.type===t.id ? t.color : "rgba(255,255,255,0.05)", backgroundColor: form.type===t.id ? t.color+"22" : "rgba(20,20,20,0.5)" }}>
                <Ionicons name={t.icon} size={16} color={form.type===t.id ? t.color : C.t3} />
                <Text style={{ fontSize:13, fontWeight:"800", color: form.type===t.id ? t.color : C.t3 }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, marginBottom: 16 }}>
            <Text style={[styles.lbl, { color:C.t2 }]}>{lang === 'en' ? "CURRENT BALANCE" : "SALDO ACTUAL"} ({cur})</Text>
            <Text style={{ fontSize:10, color:C.t4, marginBottom: 6 }}>{lang === 'en' ? "How much do you owe exactly today?" : "¿Cuánto debes exactamente al día de hoy?"}</Text>
            <Input value={form.balance} onChange={v => setForm({ ...form, balance:v })} placeholder={lang === 'en' ? "E.g: 15000" : "Ej: 15000"} numeric style={{ marginBottom: 16 }} />

            <Text style={[styles.lbl, { color:C.t2 }]}>{lang === 'en' ? "ANNUAL INTEREST RATE (%)" : "TASA DE INTERÉS ANUAL (%)"}</Text>
            <Text style={{ fontSize:10, color:C.t4, marginBottom: 6 }}>{lang === 'en' ? "What percentage of interest are you charged per year?" : "¿Qué porcentaje de interés te cobran al año?"}</Text>
            <Input value={form.rate} onChange={v => setForm({ ...form, rate:v })} placeholder={lang === 'en' ? "E.g: 60" : "Ej: 60"} numeric style={{ marginBottom: 16 }} />

            <Text style={[styles.lbl, { color:C.t2 }]}>{lang === 'en' ? "MINIMUM MONTHLY PAYMENT" : "PAGO MÍNIMO MENSUAL"} ({cur})</Text>
            <Text style={{ fontSize:10, color:C.t4, marginBottom: 6 }}>{lang === 'en' ? "The minimum the bank requires you to pay each month." : "Lo menos que te exige el banco pagar cada mes."}</Text>
            <Input value={form.minPay} onChange={v => setForm({ ...form, minPay:v })} placeholder={lang === 'en' ? "E.g: 500" : "Ej: 500"} numeric style={{ marginBottom: 16 }} />

            {form.type === "tarjeta" && (
              <>
                <Text style={[styles.lbl, { color:C.t2 }]}>{lang === 'en' ? "CARD LIMIT" : "LÍMITE DE LA TARJETA"} ({cur})</Text>
                <Text style={{ fontSize:10, color:C.t4, marginBottom: 6 }}>{lang === 'en' ? "The maximum approved limit (helps see your progress)." : "El límite máximo aprobado (ayuda a ver tu progreso)."}</Text>
                <Input value={form.limit} onChange={v => setForm({ ...form, limit:v })} placeholder={lang === 'en' ? "E.g: 50000" : "Ej: 50000"} numeric style={{ marginBottom: 0 }} />
              </>
            )}
          </View>

          <View style={{ flexDirection:"column", gap:10, marginTop: 4 }}>
            <Btn label={lang === 'en' ? "Save Debt in Strategy" : "Guardar Deuda en Estrategia"} onPress={() => {
              if (!form.name || !form.balance) {
                showAlert(lang === 'en' ? "Missing Information" : "Faltan Datos", lang === 'en' ? "Please provide a name and current balance." : "Por favor ingresa al menos el nombre y el saldo actual de la deuda.", [], "error");
                return;
              }
              setDebts([...debts, { id:Date.now(), ...form, balance:+form.balance, rate:+form.rate, minPay:+form.minPay, limit:+form.limit }]);
              setAdding(false);
              setForm({ name:"", type:"tarjeta", balance:"", rate:"", minPay:"", limit:"", color:C.rose });
            }} style={{ height: 50 }} />
            <Btn label={lang === 'en' ? "Cancel" : "Cancelar"} onPress={() => {
              setAdding(false);
              setForm({ name:"", type:"tarjeta", balance:"", rate:"", minPay:"", limit:"", color:C.rose });
            }} ghost />
          </View>
        </GlassCard>
      ) : null}

      {!adding && debts.length > 0 && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.gold, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && debts.length >= 1) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.gold,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>{lang === 'en' ? "Add debt" : "Añadir deuda"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Pagos Fijos ─────────────────────────────────────────────────────────────
function PagosFijosTab({ state, setReminders, onPremium, t, lang, showAlert }) {
  const { user, reminders=[] } = state;
  const cur = user.currency || "RD$";
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", day:"" });

  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0,7);

  // Sorting: unpaid first (sorted by day), then paid
  const sorted = [...reminders].sort((a,b) => {
    const aPaid = a.paidMonth === currentMonth;
    const bPaid = b.paidMonth === currentMonth;
    if (aPaid && !bPaid) return 1;
    if (!aPaid && bPaid) return -1;
    return a.day - b.day;
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
      {/* ── EMPTY STATE ── */}
      {reminders.length === 0 && !adding && (
        <View style={{ alignItems:"center", paddingHorizontal:32, paddingTop:36, paddingBottom:24 }}>
          <View style={{ width:100, height:100, borderRadius:50, backgroundColor:"rgba(139,92,246,0.08)", borderWidth:1.5, borderColor:C.violet+"40", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <Ionicons name="calendar-outline" size={44} color={C.violet} />
          </View>
          <Text style={{ fontSize:18, fontWeight:"900", color:C.t1, textAlign:"center", marginBottom:8 }}>
            {lang === 'en' ? "Never miss a payment" : "Que nunca te agarren fuera de base"}
          </Text>
          <Text style={{ fontSize:13, color:C.t3, textAlign:"center", lineHeight:20, marginBottom:24 }}>
            {lang === 'en' 
              ? "Schedule your fixed payments like light, internet or card bills, and keep everything under control."
              : "Agenda tus pagos fijos y nunca más te agarren fuera de base. Luz, internet, tarjeta — todo bajo control."}
          </Text>
          <TouchableOpacity onPress={() => setAdding(true)}
            style={{ backgroundColor:C.violet, paddingHorizontal:32, paddingVertical:14, borderRadius:20, marginTop:10, shadowColor:C.violet, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8 }}>
            <Text style={{ fontSize:14, fontWeight:"900", color:"#FFF", letterSpacing:0.5 }}>{lang === 'en' ? "Add fixed payment" : "Agregar pago fijo"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {reminders.length > 0 && !adding && sorted.map(r => {
        const isPaid = r.paidMonth === currentMonth;
        const color = isPaid ? C.mint : (r.day < today2 ? C.rose : C.gold);
        return (
          <GlassCard key={r.id} style={{ marginHorizontal:16 }} borderColor={isPaid ? C.mint+"40" : "rgba(255,255,255,0.1)"}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <TouchableOpacity onPress={() => {
                const updated = reminders.map(x => x.id === r.id ? { ...x, paidMonth: isPaid ? null : currentMonth } : x);
                setReminders(updated);
              }} style={{ width:36, height:36, borderRadius:12, backgroundColor:isPaid ? C.mint+"20" : "rgba(255,255,255,0.05)", borderWidth:1, borderColor:isPaid ? C.mint : "rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center" }}>
                {isPaid && <Ionicons name="checkmark" size={20} color={C.mint} />}
              </TouchableOpacity>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:"800", color: isPaid ? C.t3 : C.t1, textDecorationLine: isPaid ? "line-through" : "none" }}>{r.name}</Text>
                <Text style={{ fontSize:11, color:C.t3 }}>{isPaid ? (lang === 'en' ? "Paid this month" : "Pagado este mes") : (r.day >= today2 ? (lang === 'en' ? `Due in ${r.day - today2} days` : `Vence en ${r.day - today2} días`) : (lang === 'en' ? `Overdue since day ${r.day}` : `Venció el día ${r.day}`))}</Text>
              </View>
              <Text style={{ fontSize:15, fontWeight:"800", color:color }}>{money(r.amount,cur)}</Text>
              <TouchableOpacity onPress={() => setReminders(reminders.filter(x=>x.id!==r.id))}>
                <Ionicons name="trash-outline" size={18} color={C.t4} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        );
      })}

      {adding ? (
        <GlassCard style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:14, fontWeight:"700", color:C.t1, marginBottom:14 }}>{lang === 'en' ? "New Fixed Payment" : "Nuevo Pago Fijo"}</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder={lang === 'en' ? "Service (e.g., Light, Internet)" : "Servicio (ej: Luz, Internet)"} />
          <View style={{ flexDirection:"row", gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "AMOUNT" : "MONTO"} ({cur})</Text>
              <Input value={form.amount} onChange={v => setForm({ ...form, amount:v })} placeholder="0" numeric />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>{lang === 'en' ? "DAY OF THE MONTH" : "DÍA DEL MES"}</Text>
              <Input value={form.day} onChange={v => setForm({ ...form, day:v })} placeholder="1-31" numeric />
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label={lang === 'en' ? "Cancel" : "Cancelar"} onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label={lang === 'en' ? "Save" : "Guardar"} onPress={() => {
              if (!form.name || !form.amount || !form.day) return;
              setReminders([...reminders, { id:Date.now(), name:form.name, amount:+form.amount, day:+form.day, active:true }]);
              setAdding(false); setForm({ name:"", amount:"", day:"" });
            }} style={{ flex:2 }} />
          </View>
        </GlassCard>
      ) : null}

      {!adding && reminders.length > 0 && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && reminders.length >= 3) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.mint,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>{lang === 'en' ? "Add payment" : "Añadir pago"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Compartidas ─────────────────────────────────────────────────────────────
function CompartidasTab({ state, updateState, onPremium, t, lang, showAlert, addExpense }) {
  const { user, shared=[] } = state;
  const cur = user.currency || "RD$";
  const [addingPerson, setAddingPerson] = useState(false);
  const [personForm, setPersonForm] = useState({ name: "" });
  
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [actionType, setActionType] = useState(null); // 'split' | 'pay'
  const [actionForm, setActionForm] = useState({ amount: "", desc: lang === 'en' ? "Shared Expense" : "Gasto Compartido" });

  const totalOwed = shared.reduce((a,p) => a + p.balance, 0);

  const handleAddPerson = () => {
    if (!personForm.name) return;
    if (!user?.premium && shared.length >= 3) {
      onPremium();
      return;
    }
    updateState({ shared: [...shared, { id: Date.now(), name: personForm.name, balance: 0 }] });
    setAddingPerson(false);
    setPersonForm({ name: "" });
  };

  const handleAction = () => {
    const amt = Number(actionForm.amount);
    if (!amt || amt <= 0) return;
    
    if (actionType === 'split') {
      const half = amt / 2;
      // Registrar mi mitad como gasto
      addExpense({ id: Date.now(), desc: actionForm.desc + ` (Mitad con ${selectedPerson.name})`, amount: half, cat: "Otros", date: new Date().toISOString() });
      // Sumar deuda a la persona
      const newShared = shared.map(p => p.id === selectedPerson.id ? { ...p, balance: p.balance + half } : p);
      updateState({ shared: newShared });
      showAlert(lang === 'en' ? "Split Registered" : "Split Registrado", lang === 'en' ? `You paid ${money(half, cur)} and ${selectedPerson.name} owes you ${money(half, cur)}.` : `Pagaste ${money(half, cur)} y ${selectedPerson.name} te debe ${money(half, cur)}.`, [], "success");
    } else if (actionType === 'pay') {
      // Saldar deuda parcial o total
      const paid = Math.min(amt, selectedPerson.balance);
      // Registrar ingreso extra
      updateState({ income: [...(state.income||[]), { id: Date.now(), source: `Abono de ${selectedPerson.name}`, amount: paid, type: "variable", date: new Date().toISOString() }] });
      const newShared = shared.map(p => p.id === selectedPerson.id ? { ...p, balance: p.balance - paid } : p);
      updateState({ shared: newShared });
      showAlert(lang === 'en' ? "Payment Received" : "Pago Recibido", lang === 'en' ? `${selectedPerson.name} paid ${money(paid, cur)}.` : `${selectedPerson.name} te pagó ${money(paid, cur)}.`, [], "success");
    }
    setActionType(null);
    setActionForm({ amount: "", desc: lang === 'en' ? "Shared Expense" : "Gasto Compartido" });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>

      {/* ── EMPTY STATE ── */}
      {shared.length === 0 && !addingPerson && (
        <View style={{ alignItems:"center", paddingHorizontal:32, paddingTop:36, paddingBottom:24 }}>
          {/* Icon */}
          <View style={{ width:100, height:100, borderRadius:50, backgroundColor:"rgba(0,229,176,0.08)", borderWidth:1.5, borderColor:C.mint+"40", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <Ionicons name="people-outline" size={44} color={C.mint} />
          </View>
          {/* Title */}
          <Text style={{ fontSize:18, fontWeight:"900", color:C.t1, textAlign:"center", marginBottom:8 }}>
            {lang === 'en' ? "Split expenses with anyone" : "Divide gastos con quien quieras"}
          </Text>
          {/* Description */}
          <Text style={{ fontSize:13, color:C.t3, textAlign:"center", lineHeight:20, marginBottom:24 }}>
            {lang === 'en'
              ? "Track shared expenses with friends, roommates or your partner. Fynx calculates who owes what automatically."
              : "Lleva el control de gastos compartidos con amigos, compañeros de cuarto o tu pareja. Fynx calcula quién debe qué de forma automática."}
          </Text>
          {/* Feature list */}
          {[
            lang === 'en' ? "Split any expense 50/50 in one tap" : "Divide cualquier gasto al 50% en un toque",
            lang === 'en' ? "See the exact balance per person" : "Ve el balance exacto por persona",
            lang === 'en' ? "Mark payments as received" : "Marca pagos como recibidos",
          ].map((item, i) => (
            <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10, alignSelf:"flex-start" }}>
              <View style={{ width:22, height:22, borderRadius:11, backgroundColor:C.mint+"20", borderWidth:1, borderColor:C.mint+"40", alignItems:"center", justifyContent:"center" }}>
                <Ionicons name="checkmark" size={13} color={C.mint} />
              </View>
              <Text style={{ fontSize:13, color:C.t2, flex:1 }}>{item}</Text>
            </View>
          ))}
          {/* CTA */}
          <TouchableOpacity onPress={() => setAddingPerson(true)}
            style={{ marginTop:20, flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.mint, borderRadius:16, paddingHorizontal:24, paddingVertical:13,
              shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.35, shadowRadius:12 }}>
            <Ionicons name="person-add-outline" size={18} color="#000" />
            <Text style={{ fontSize:14, fontWeight:"800", color:"#000" }}>
              {lang === 'en' ? "Add first person" : "Añadir primera persona"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {shared.length > 0 && (
        <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:C.mint+"45" }}>
          <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10,10,10,0.4)" }}>
            <View style={{ padding:16 }}>
              <Text style={{ fontSize:9, color:C.mint, letterSpacing:2.5, fontWeight:"700", marginBottom:8 }}>{lang === 'en' ? "TOTAL OWED TO YOU" : "TOTAL A TU FAVOR"}</Text>
              <Text style={{ fontSize:34, fontWeight:"900", color:C.mint, letterSpacing:-1 }}>{money(totalOwed, cur)}</Text>
            </View>
          </BlurView>
        </View>
      )}

      {shared.map(p => (
        <GlassCard key={p.id} style={{ marginHorizontal:16 }} borderColor={C.mint+"45"} padding={0}>
          <View style={{ padding:16 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                <View style={{ width:44, height:44, borderRadius:13, backgroundColor:C.mint+"22", borderWidth:1.5, borderColor:C.mint+"40", alignItems:"center", justifyContent:"center" }}>
                  <Ionicons name="people" size={20} color={C.mint} />
                </View>
                <View>
                  <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>{p.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize:12, color: p.balance > 0 ? C.t2 : C.t1 }}>
                      {p.balance > 0 ? (lang === 'en' ? "Owes you: " : "Te debe: ") : (lang === 'en' ? "Settled / Saldado" : "Saldado")} 
                    </Text>
                    {p.balance > 0 && (
                      <Text style={{ color:C.mint, fontWeight:"800", fontSize: 13, marginLeft: 4 }}>
                        {money(p.balance, cur)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => updateState({ shared: shared.filter(x => x.id !== p.id) })}
                style={{ padding:6, borderRadius:9, backgroundColor:"rgba(255,255,255,0.05)" }}>
                <Ionicons name={ICON.close} size={18} color={C.t3} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection:"row", gap:10 }}>
              <TouchableOpacity onPress={() => { setSelectedPerson(p); setActionType('split'); setActionForm({amount:"", desc:lang === 'en' ? "Shared Expense" : "Gasto Compartido"}); }} style={{ flex:1, height:40, backgroundColor:C.card2, borderRadius: 10, borderWidth:1, borderColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center" }}>
                <Text style={{ color: C.t1, fontSize: 13, fontWeight: "700" }}>{lang === 'en' ? "Split Expense" : "Dividir Gasto"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectedPerson(p); setActionType('pay'); setActionForm({amount:p.balance.toString(), desc:""}); }} disabled={p.balance <= 0} style={{ flex:1, height:40, backgroundColor: p.balance > 0 ? C.mint : "transparent", borderRadius: 10, borderWidth:1, borderColor: p.balance > 0 ? C.mint : C.t4, alignItems:"center", justifyContent:"center", opacity: p.balance > 0 ? 1 : 0.4 }}>
                <Text style={{ color: p.balance > 0 ? "#000" : C.t3, fontSize: 13, fontWeight: "800" }}>{lang === 'en' ? "Receive Pay" : "Recibir Pago"}</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPerson?.id === p.id && actionType && (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 16 }}>
                <Text style={[styles.lbl, { color:C.t2 }]}>{actionType === 'split' ? (lang === 'en' ? "TOTAL AMOUNT TO SPLIT 50/50" : "MONTO TOTAL A DIVIDIR 50/50") : (lang === 'en' ? "AMOUNT RECEIVED" : "MONTO RECIBIDO")}</Text>
                <Input value={actionForm.amount} onChange={v => setActionForm({ ...actionForm, amount:v })} placeholder="0" numeric style={{ marginBottom: 10 }} />
                {actionType === 'split' && (
                  <Input value={actionForm.desc} onChange={v => setActionForm({ ...actionForm, desc:v })} placeholder={lang === 'en' ? "Description" : "Descripción (ej: Supermercado)"} style={{ marginBottom: 10 }} />
                )}
                <View style={{ flexDirection:"row", gap:10 }}>
                  <Btn label={lang === 'en' ? "Cancel" : "Cancelar"} onPress={() => setActionType(null)} ghost style={{ flex:1 }} />
                  <Btn label={lang === 'en' ? "Confirm" : "Confirmar"} onPress={handleAction} style={{ flex:1 }} />
                </View>
              </View>
            )}
          </View>
        </GlassCard>
      ))}

      {addingPerson ? (
        <GlassCard style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:14, fontWeight:"700", color:C.t1, marginBottom:14 }}>{lang === 'en' ? "Add Person" : "Añadir Persona"}</Text>
          <Input value={personForm.name} onChange={v => setPersonForm({ name:v })} placeholder={lang === 'en' ? "Name (e.g., Laura)" : "Nombre (ej: Laura)"} />
          <View style={{ flexDirection:"row", gap:10, marginTop:10 }}>
            <Btn label={lang === 'en' ? "Cancel" : "Cancelar"} onPress={() => setAddingPerson(false)} ghost style={{ flex:1 }} />
            <Btn label={lang === 'en' ? "Save" : "Guardar"} onPress={handleAddPerson} style={{ flex:2 }} />
          </View>
        </GlassCard>
      ) : null}


    </ScrollView>
  );
}

// ── EstrategiaScreen ─────────────────────────────────────────────────────────
export function EstrategiaScreen({ initialSubTab }) {
  const { appState, updateState, addExpenseWithStreak } = useFinance();
  const { t, lang } = useLanguage();
  const { showAlert } = useEliteAlert();
  const [subTab, setSubTab] = useState(initialSubTab || "metas");
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#000" }}>
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color:C.t1, letterSpacing:-0.5 }}>{lang === 'en' ? "Strategy" : "Estrategia"}</Text>
        <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>{lang === 'en' ? "Destroy debts. Build wealth." : "Destruye deudas. Construye riqueza."}</Text>
      </View>
      
      <View style={{ marginHorizontal:16, marginBottom:10, borderRadius:13, overflow:"hidden", borderWidth:1, borderColor:C.gold+"30" }}>
        <BlurView intensity={20} tint="dark" style={{ backgroundColor:"rgba(0,0,0,0.4)" }}>
          <View style={{ flexDirection:"row", padding:4 }}>
            {[["metas",lang === 'en' ? "Goals" : "Metas"],["deudas",lang === 'en' ? "Debts" : "Deudas"],["pagos",lang === 'en' ? "Fixed" : "Fijos"], ["compartidas",lang === 'en' ? "Shared" : "Compartidas"]].map(([id,label]) => (
              <TouchableOpacity key={id} onPress={() => setSubTab(id)}
                style={{ flex:1, paddingVertical:10, borderRadius:10,
                  backgroundColor: subTab===id ? "rgba(201,168,76,0.15)" : "transparent", alignItems:"center" }}>
                <Text style={{ fontSize:11, fontWeight:"700", color: subTab===id ? C.gold : C.t3 }} numberOfLines={1}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </View>
      
      {subTab === "metas"  && <MetasTab  state={appState} setGoals={v => updateState({ goals:v })} onPremium={() => setShowPremium(true)} t={t} lang={lang} showAlert={showAlert} />}
      {subTab === "deudas" && <DeudasTab state={appState} setDebts={v => updateState({ debts:v })} onPremium={() => setShowPremium(true)} t={t} lang={lang} showAlert={showAlert} />}
      {subTab === "pagos"  && <PagosFijosTab state={appState} setReminders={v => updateState({ reminders:v })} onPremium={() => setShowPremium(true)} t={t} lang={lang} showAlert={showAlert} />}
      {subTab === "compartidas"  && <CompartidasTab state={appState} updateState={updateState} onPremium={() => setShowPremium(true)} t={t} lang={lang} showAlert={showAlert} addExpense={addExpenseWithStreak} />}

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          if (success) {
            updateState({ user: { ...appState.user, premium: true } });
            setShowPremium(false);
          }
        }}
      />
    </SafeAreaView>
  );
}
