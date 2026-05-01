import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
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
function MetasTab({ state, setGoals, onPremium }) {
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
      {goals.length === 0 ? (
        <View style={{ alignItems:"center", paddingVertical:50, paddingHorizontal:32 }}>
          <View style={{ width:110, height:110, borderRadius:55, borderWidth:10, borderColor:"rgba(255,255,255,0.05)",
            alignItems:"center", justifyContent:"center", marginBottom:22 }}>
            <Ionicons name={ICON.target} size={42} color={C.t3} />
          </View>
          <Text style={{ fontSize:17, fontWeight:"800", color:C.t1, textAlign:"center", marginBottom:8 }}>Sin metas activas</Text>
          <Text style={{ fontSize:12, color:C.t3, textAlign:"center", lineHeight:19, marginBottom:26 }}>
            Define tu primer objetivo y visualiza tu progreso.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems:"center", paddingVertical:24 }}>
            <CircleProgress pct={activePct} size={200} color={activeColor}>
              <Ionicons name={active.emoji || "flag-outline"} size={28} color={activeColor} style={{ marginBottom:3 }} />
              <Text style={{ fontSize:38, fontWeight:"900", color:activeColor, letterSpacing:-2 }}>{Math.round(activePct)}%</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>Progreso</Text>
              <Text style={{ fontSize:13, fontWeight:"700", color:C.t2, marginTop:3 }} numberOfLines={1}>{active.name}</Text>
            </CircleProgress>
            <View style={{ marginTop:14, alignItems:"center" }}>
              <Text style={{ fontSize:20, fontWeight:"900", color:C.t1 }}>{money(active.saved, cur)}</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>de {money(active.target, cur)}</Text>
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
                      <Text style={{ fontSize:11, color:C.t3, marginTop:1 }}>{money(g.saved,cur)} de {money(g.target,cur)}</Text>
                    </View>
                    <View style={{ alignItems:"flex-end", gap:4 }}>
                      <Tag label={Math.round(pct)+"%"} color={col} />
                      <TouchableOpacity onPress={() => setGoals(goals.filter(x => x.id !== g.id))}>
                        <Text style={{ fontSize:10, color:C.t4 }}>eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Bar pct={pct} color={col} h={6} />
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:8 }}>
                    <Text style={{ fontSize:10, color:C.t3 }}>Aparta {money(+perPeriod,cur)}{freqInfo.suffix}</Text>
                    <Text style={{ fontSize:10, color:col, fontWeight:"700" }}>Faltan {money(g.target-g.saved,cur)}</Text>
                  </View>
                </GlassCard>
              </Animated.View>
            );
          })}
        </>
      )}

      {adding && (
        <GlassCard style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:15, fontWeight:"800", color:C.t1, marginBottom:14 }}>Nueva meta</Text>
          <Text style={[styles.lbl, { color:C.t3 }]}>QUÉ QUIERES LOGRAR</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder="ej: Laptop, Viaje, Fondo..." />
          <View style={{ flexDirection:"row", gap:10, marginBottom:10 }}>
            <View style={{ flex:2.5 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>COSTO ({cur})</Text>
              <Input value={form.target} onChange={v => setForm({ ...form, target:v })} placeholder="ej: 50000" numeric />
            </View>
          </View>
          <Text style={[styles.lbl, { color:C.t3 }]}>SÍMBOLO</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {GOAL_ICONS.map(ic => (
              <TouchableOpacity key={ic} onPress={() => setForm({ ...form, emoji:ic })}
                style={{ width:42, height:42, borderRadius:10, borderWidth:1.5,
                  borderColor: form.emoji===ic ? C.mint : "rgba(255,255,255,0.05)", backgroundColor: form.emoji===ic ? C.mint+"22" : "rgba(20,20,20,0.5)", alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={ic} size={18} color={form.emoji===ic ? C.mint : C.t3} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.lbl, { color:C.t3 }]}>PLAZO</Text>
          <View style={{ flexDirection:"row", gap:8, marginTop:8, marginBottom:14 }}>
            {[["4","1 mes"],["12","3 meses"],["24","6 meses"],["52","1 año"]].map(([w,l]) => (
              <TouchableOpacity key={w} onPress={() => setForm({ ...form, weeks:w })}
                style={{ flex:1, paddingVertical:10, borderRadius:11, borderWidth:1.5, alignItems:"center",
                  borderColor: form.weeks===w ? C.mint : "rgba(255,255,255,0.1)", backgroundColor: form.weeks===w ? C.mint+"20" : "rgba(20,20,20,0.5)" }}>
                <Text style={{ fontSize:10, fontWeight:"700", color: form.weeks===w ? C.mint : C.t3 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.lbl, { color:C.t3, marginTop:4 }]}>FRECUENCIA DE AHORRO</Text>
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
                  Aparta <Text style={{ color:C.mint, fontWeight:"700" }}>{cur}{amount.toLocaleString()}{fi.suffix}</Text>
                </Text>
              </View>
            );
          })()}
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label="Atrás" onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label="Guardar meta" onPress={() => {
              const targetNum = Number(form.target);
              if (!form.name || !form.target) return;
              if (isNaN(targetNum) || targetNum <= 0) {
                import("react-native").then(rn => rn.Alert.alert("Monto Inválido", "El monto de la meta debe ser mayor a 0."));
                return;
              }
              setGoals([...goals, { id:Date.now(), ...form, target:targetNum, saved:0, weeks:+form.weeks, freq:form.freq }]);
              setAdding(false); setForm({ name:"", emoji:"flag-outline", target:"", weeks:"12", freq:"semanal" });
            }} style={{ flex:2 }} />
          </View>
        </GlassCard>
      )}

      {!adding && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && goals.length >= 1) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.mint,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>Añadir meta</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Deudas ──────────────────────────────────────────────────────────────────
function DeudasTab({ state, setDebts, onPremium }) {
  const { user, debts=[] } = state;
  const cur = user.currency;
  const [adding, setAdding] = useState(false);
  const [extra,  setExtra]  = useState("");
  const [form,   setForm]   = useState({ name:"", type:"tarjeta", balance:"", rate:"", minPay:"", limit:"", color:C.rose });

  const totalDebt = debts.reduce((a,d) => a+d.balance, 0);
  const totalInt  = debts.reduce((a,d) => a+(d.balance*d.rate/100/12), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
      {debts.length > 0 && (
        <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:C.rose+"45" }}>
          <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10,10,10,0.4)" }}>
            <View style={{ padding:16 }}>
              <Text style={{ fontSize:9, color:C.rose, letterSpacing:2.5, fontWeight:"700", marginBottom:8 }}>RESUMEN</Text>
              <Text style={{ fontSize:34, fontWeight:"900", color:C.rose, letterSpacing:-1 }}>{money(totalDebt, cur)}</Text>
            </View>
            <View style={{ flexDirection:"row", backgroundColor:C.rose+"10", borderTopWidth:1, borderTopColor:C.rose+"22" }}>
              {[[money(Math.round(totalInt),cur),"Intereses/mes"],[debts.length+" deudas","Activas"],[money(debts.reduce((a,d)=>a+d.minPay,0),cur),"Pago mín."]].map(([v,l],i) => (
                <View key={l} style={{ flex:1, paddingVertical:12, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:C.rose+"18" }}>
                  <Text style={{ fontSize:12, fontWeight:"800", color:i===0?C.rose:C.t1 }}>{v}</Text>
                  <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </View>
      )}

      {debts.length > 0 && (
        <GlassCard style={{ marginHorizontal:16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 6 }}>
            <Ionicons name={ICON.save} size={16} color={C.t1} />
            <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>Pago Extra</Text>
          </View>
          <Input value={extra} onChange={setExtra} placeholder={`Abono adicional mensual (${cur})`} numeric style={{ marginBottom:0 }} />
        </GlassCard>
      )}

      {debts.map(d => {
        const t       = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
        const dc      = d.color || t.color;
        const pctPaid = d.limit > 0 ? Math.round(((d.limit-d.balance)/d.limit)*100) : 0;
        const mo      = payoffMonths(d.balance, d.rate, d.minPay + Number(extra||0));
        const tl      = mo === Infinity ? "Solo intereses" : mo > 24 ? (mo/12).toFixed(1)+" años" : mo+" meses";
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
                {[["Saldo",money(d.balance,cur),C.rose],["Tasa",d.rate+"% anual",C.gold],["Mín/mes",money(d.minPay,cur),C.t1]].map(([l,v,c],i) => (
                  <View key={l} style={{ flex:1, paddingVertical:10, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:"rgba(255,255,255,0.05)" }}>
                    <Text style={{ fontSize:12, fontWeight:"800", color:c }}>{v}</Text>
                    <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
                  </View>
                ))}
              </View>
              {d.limit > 0 && (
                <View style={{ marginBottom:10 }}>
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:5 }}>
                    <Text style={{ fontSize:11, color:C.t3 }}>Progreso de pago</Text>
                    <Text style={{ fontSize:11, color:dc, fontWeight:"700" }}>{pctPaid}% pagado</Text>
                  </View>
                  <Bar pct={pctPaid} color={dc} h={6} />
                </View>
              )}
              <View style={{ backgroundColor:dc+"14", borderRadius:11, padding:10, borderWidth:1, borderColor:dc+"25",
                flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ fontSize:12, color:C.t2 }}>Libre en: <Text style={{ color:dc, fontWeight:"700" }}>{tl}</Text></Text>
                {d.rate > 0 && <Text style={{ fontSize:11, color:C.rose, fontWeight:"700" }}>{money(Math.round(d.balance*d.rate/100),cur)}/año</Text>}
              </View>
            </View>
          </GlassCard>
        );
      })}

      {adding ? (
        <GlassCard style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:14, fontWeight:"700", color:C.t1, marginBottom:14 }}>Nueva deuda</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder="Nombre (ej: Tarjeta BHD)" />
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {DEBT_TYPES.map(t => (
              <TouchableOpacity key={t.id} onPress={() => setForm({ ...form, type:t.id, color:t.color })}
                style={{ paddingHorizontal:11, paddingVertical:8, borderRadius:10, borderWidth:1.5,
                  borderColor: form.type===t.id ? t.color : "rgba(255,255,255,0.05)", backgroundColor: form.type===t.id ? t.color+"22" : "rgba(20,20,20,0.5)" }}>
                <Text style={{ fontSize:12, fontWeight:"700", color: form.type===t.id ? t.color : C.t3 }}>{t.icon} {t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection:"row", gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>SALDO ({cur})</Text>
              <Input value={form.balance} onChange={v => setForm({ ...form, balance:v })} placeholder="0" numeric />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>TASA (%)</Text>
              <Input value={form.rate} onChange={v => setForm({ ...form, rate:v })} placeholder="0" numeric />
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>PAGO MÍN.</Text>
              <Input value={form.minPay} onChange={v => setForm({ ...form, minPay:v })} placeholder="0" numeric />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>LÍMITE</Text>
              <Input value={form.limit} onChange={v => setForm({ ...form, limit:v })} placeholder="0" numeric />
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label="Cancelar" onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label="Guardar deuda" onPress={() => {
              if (!form.name || !form.balance) return;
              setDebts([...debts, { id:Date.now(), ...form, balance:+form.balance, rate:+form.rate, minPay:+form.minPay, limit:+form.limit }]);
              setAdding(false);
            }} style={{ flex:2 }} />
          </View>
        </GlassCard>
      ) : null}

      {!adding && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.gold, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && debts.length >= 1) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.gold,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>Añadir deuda</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Pagos Fijos ─────────────────────────────────────────────────────────────
function PagosFijosTab({ state, setReminders, onPremium }) {
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
      {sorted.map(r => {
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
                <Text style={{ fontSize:11, color:C.t3 }}>{isPaid ? "Pagado este mes" : (r.day >= today2 ? `Vence en ${r.day - today2} días` : `Venció el día ${r.day}`)}</Text>
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
          <Text style={{ fontSize:14, fontWeight:"700", color:C.t1, marginBottom:14 }}>Nuevo Pago Fijo</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder="Servicio (ej: Luz, Internet)" />
          <View style={{ flexDirection:"row", gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>MONTO ({cur})</Text>
              <Input value={form.amount} onChange={v => setForm({ ...form, amount:v })} placeholder="0" numeric />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>DÍA DEL MES</Text>
              <Input value={form.day} onChange={v => setForm({ ...form, day:v })} placeholder="1-31" numeric />
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label="Cancelar" onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label="Guardar" onPress={() => {
              if (!form.name || !form.amount || !form.day) return;
              setReminders([...reminders, { id:Date.now(), name:form.name, amount:+form.amount, day:+form.day, active:true }]);
              setAdding(false); setForm({ name:"", amount:"", day:"" });
            }} style={{ flex:2 }} />
          </View>
        </GlassCard>
      ) : null}

      {!adding && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => {
            if (!user?.premium && reminders.length >= 3) onPremium();
            else setAdding(true);
          }}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.mint,
              borderRadius:18, paddingHorizontal:22, paddingVertical:13 }}>
            <Text style={{ fontSize:18, color:"#000", fontWeight:"900" }}>+</Text>
            <Text style={{ fontSize:13, fontWeight:"800", color:"#000" }}>Añadir pago</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── EstrategiaScreen ─────────────────────────────────────────────────────────
export function EstrategiaScreen({ initialSubTab }) {
  const { appState, updateState } = useFinance();
  const [subTab, setSubTab] = useState(initialSubTab || "metas");
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#000" }}>
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color:C.t1, letterSpacing:-0.5 }}>Estrategia</Text>
        <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>Destruye deudas. Construye riqueza.</Text>
      </View>
      
      <View style={{ marginHorizontal:16, marginBottom:10, borderRadius:13, overflow:"hidden", borderWidth:1, borderColor:C.gold+"30" }}>
        <BlurView intensity={20} tint="dark" style={{ backgroundColor:"rgba(0,0,0,0.4)" }}>
          <View style={{ flexDirection:"row", padding:4 }}>
            {[["metas","Metas"],["deudas","Deudas"],["pagos","Pagos Fijos"]].map(([id,label]) => (
              <TouchableOpacity key={id} onPress={() => setSubTab(id)}
                style={{ flex:1, paddingVertical:10, borderRadius:10,
                  backgroundColor: subTab===id ? "rgba(201,168,76,0.15)" : "transparent", alignItems:"center" }}>
                <Text style={{ fontSize:12, fontWeight:"700", color: subTab===id ? C.gold : C.t3 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </View>
      
      {subTab === "metas"  && <MetasTab  state={appState} setGoals={v => updateState({ goals:v })} onPremium={() => setShowPremium(true)} />}
      {subTab === "deudas" && <DeudasTab state={appState} setDebts={v => updateState({ debts:v })} onPremium={() => setShowPremium(true)} />}
      {subTab === "pagos"  && <PagosFijosTab state={appState} setReminders={v => updateState({ reminders:v })} onPremium={() => setShowPremium(true)} />}

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
