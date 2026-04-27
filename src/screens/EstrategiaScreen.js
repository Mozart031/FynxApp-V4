import React, { useState, useRef, useEffect } from "react";
import { View, SafeAreaView, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { ICON, CATS, DEBT_TYPES, DEF_BUDGETS } from "../constants";
import { money, DAY } from "../utils/formatters";
import { payoffMonths } from "../utils/finance";
import { Card, Btn, Bar, Tag, CatIcon, FadeIn, Input, styles } from "../components/base";

// ── Metas ──────────────────────────────────────────────────────────────────
function MetasTab({ state, setGoals }) {
  const { user, goals=[], income=[] } = state;
  const cur      = user.currency;
  const totalInc = income.reduce((a,i) => a+i.amount, 0);
  const [adding,   setAdding]   = useState(false);
  const [selected, setSelected] = useState(0);
  const [form,     setForm]     = useState({ name:"", emoji:ICON.target, target:"", weeks:"12" });
  const goalColors = [C.sky, C.mint, C.violet, C.gold, C.orange, C.pink];
  const active     = goals.length > 0 ? goals[Math.min(selected, goals.length-1)] : null;
  const activePct  = active ? Math.min((active.saved / active.target)*100, 100) : 0;
  const activeColor = goalColors[selected % goalColors.length];

  // Stagger animation para lista
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
        <View style={{ position:"absolute", width:size, height:size, borderRadius:size/2, borderWidth:10, borderColor:C.border2 }} />
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
          <View style={{ width:110, height:110, borderRadius:55, borderWidth:10, borderColor:C.border2,
            alignItems:"center", justifyContent:"center", marginBottom:22 }}>
            <Text style={{ fontSize:36, color:C.t3, fontWeight:"900" }}>{ICON.target}</Text>
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
              <Text style={{ fontSize:28, color:activeColor, fontWeight:"900", marginBottom:3 }}>{active.emoji}</Text>
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
                        borderColor: selected===i ? col : C.border,
                        backgroundColor: selected===i ? col+"20" : C.card2, alignItems:"center", minWidth:86 }}>
                      <Text style={{ fontSize:16, color:col, fontWeight:"900", marginBottom:2 }}>{g.emoji}</Text>
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
            const weekly = ((g.target - g.saved) / Math.max(g.weeks, 1)).toFixed(0);
            const anim   = staggerAnims[i] || new Animated.Value(1);
            return (
              <Animated.View key={g.id} style={{ opacity:anim, transform:[{ translateY:anim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }] }}>
                <View style={{ marginHorizontal:16, marginBottom:10, borderRadius:18, backgroundColor:C.card,
                  borderWidth:1, borderColor: selected===i ? col+"50" : C.border, padding:16 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 }}>
                    <View style={{ width:44, height:44, borderRadius:13, backgroundColor:col+"20",
                      borderWidth:1.5, borderColor:col+"40", alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontSize:20, color:col, fontWeight:"900" }}>{g.emoji}</Text>
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
                    <Text style={{ fontSize:10, color:C.t3 }}>Aparta {money(+weekly,cur)}/semana</Text>
                    <Text style={{ fontSize:10, color:col, fontWeight:"700" }}>Faltan {money(g.target-g.saved,cur)}</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </>
      )}

      {adding && (
        <Card style={{ marginHorizontal:16 }}>
          <Text style={{ fontSize:15, fontWeight:"800", color:C.t1, marginBottom:14 }}>Nueva meta</Text>
          <Text style={[styles.lbl, { color:C.t3 }]}>QUÉ QUIERES LOGRAR</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder="ej: Laptop, Viaje, Fondo..." />
          <View style={{ flexDirection:"row", gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>SÍMBOLO</Text>
              <Input value={form.emoji} onChange={v => setForm({ ...form, emoji:v })} style={{ textAlign:"center", fontSize:18 }} />
            </View>
            <View style={{ flex:2.5 }}>
              <Text style={[styles.lbl, { color:C.t3 }]}>COSTO ({cur})</Text>
              <Input value={form.target} onChange={v => setForm({ ...form, target:v })} placeholder="ej: 50000" numeric />
            </View>
          </View>
          <Text style={[styles.lbl, { color:C.t3 }]}>PLAZO</Text>
          <View style={{ flexDirection:"row", gap:8, marginTop:8, marginBottom:14 }}>
            {[["4","1 mes"],["12","3 meses"],["24","6 meses"],["52","1 año"]].map(([w,l]) => (
              <TouchableOpacity key={w} onPress={() => setForm({ ...form, weeks:w })}
                style={{ flex:1, paddingVertical:10, borderRadius:11, borderWidth:1.5, alignItems:"center",
                  borderColor: form.weeks===w ? C.mint : C.border, backgroundColor: form.weeks===w ? C.mintBg : C.card2 }}>
                <Text style={{ fontSize:10, fontWeight:"700", color: form.weeks===w ? C.mint : C.t3 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.name && form.target && (
            <View style={{ backgroundColor:C.mintBg2, borderRadius:11, borderWidth:1, borderColor:C.mint+"40", padding:11, marginBottom:12 }}>
              <Text style={{ fontSize:12, color:C.t2 }}>
                Aparta <Text style={{ color:C.mint, fontWeight:"700" }}>{cur}{Math.ceil(+form.target / +form.weeks).toLocaleString()}/semana</Text>
              </Text>
            </View>
          )}
          <View style={{ flexDirection:"row", gap:10 }}>
            <Btn label="Atrás" onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
            <Btn label="Guardar meta" onPress={() => {
              if (!form.name || !form.target) return;
              setGoals([...goals, { id:Date.now(), ...form, target:+form.target, saved:0, weeks:+form.weeks }]);
              setAdding(false); setForm({ name:"", emoji:ICON.target, target:"", weeks:"12" });
            }} style={{ flex:2 }} />
          </View>
        </Card>
      )}

      {!adding && (
        <View style={{ position:"absolute", bottom:16, alignSelf:"center",
          shadowColor:C.mint, shadowOffset:{width:0,height:5}, shadowOpacity:0.4, shadowRadius:12 }}>
          <TouchableOpacity onPress={() => setAdding(true)}
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
function DeudasTab({ state, setDebts }) {
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
          <View style={{ backgroundColor:C.roseBg, padding:16 }}>
            <Text style={{ fontSize:9, color:C.rose, letterSpacing:2.5, fontWeight:"700", marginBottom:8 }}>RESUMEN</Text>
            <Text style={{ fontSize:34, fontWeight:"900", color:C.rose, letterSpacing:-1 }}>{money(totalDebt, cur)}</Text>
          </View>
          <View style={{ flexDirection:"row", backgroundColor:C.rose+"0E", borderTopWidth:1, borderTopColor:C.rose+"22" }}>
            {[[money(Math.round(totalInt),cur),"Intereses/mes"],[debts.length+" deudas","Activas"],[money(debts.reduce((a,d)=>a+d.minPay,0),cur),"Pago mín."]].map(([v,l],i) => (
              <View key={l} style={{ flex:1, paddingVertical:12, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:C.rose+"18" }}>
                <Text style={{ fontSize:12, fontWeight:"800", color:i===0?C.rose:C.t1 }}>{v}</Text>
                <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {debts.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:12 }}>{ICON.save} Pago Extra</Text>
          <Input value={extra} onChange={setExtra} placeholder={`Abono adicional mensual (${cur})`} numeric style={{ marginBottom:0 }} />
        </Card>
      )}

      {debts.map(d => {
        const t       = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
        const dc      = d.color || t.color;
        const pctPaid = d.limit > 0 ? Math.round(((d.limit-d.balance)/d.limit)*100) : 0;
        const mo      = payoffMonths(d.balance, d.rate, d.minPay + Number(extra||0));
        const tl      = mo === Infinity ? "Solo intereses" : mo > 24 ? (mo/12).toFixed(1)+" años" : mo+" meses";
        return (
          <View key={d.id} style={{ marginHorizontal:16, marginBottom:12, borderRadius:20, overflow:"hidden",
            borderWidth:1, borderColor:dc+"45" }}>
            <View style={{ backgroundColor:dc+"0C", padding:16 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                  <View style={{ width:44, height:44, borderRadius:13, backgroundColor:dc+"22", borderWidth:1.5, borderColor:dc+"40", alignItems:"center", justifyContent:"center" }}>
                    <Text style={{ fontSize:20, color:dc, fontWeight:"900" }}>{t.icon}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize:14, fontWeight:"800", color:C.t1 }}>{d.name}</Text>
                    <Tag label={t.label} color={dc} size="sm" />
                  </View>
                </View>
                <TouchableOpacity onPress={() => setDebts(debts.filter(x => x.id !== d.id))}
                  style={{ padding:6, borderRadius:9, backgroundColor:C.roseBg }}>
                  <Text style={{ color:C.rose, fontSize:14, fontWeight:"900" }}>{ICON.close}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection:"row", backgroundColor:C.bg+"80", borderRadius:12, overflow:"hidden", marginBottom:12 }}>
                {[["Saldo",money(d.balance,cur),C.rose],["Tasa",d.rate+"% anual",C.gold],["Mín/mes",money(d.minPay,cur),C.t1]].map(([l,v,c],i) => (
                  <View key={l} style={{ flex:1, paddingVertical:10, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:C.border2 }}>
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
          </View>
        );
      })}

      {adding ? (
        <Card style={{ marginBottom:12 }}>
          <Text style={{ fontSize:14, fontWeight:"700", color:C.t1, marginBottom:14 }}>Nueva deuda</Text>
          <Input value={form.name} onChange={v => setForm({ ...form, name:v })} placeholder="Nombre (ej: Tarjeta BHD)" />
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:12 }}>
            {DEBT_TYPES.map(t => (
              <TouchableOpacity key={t.id} onPress={() => setForm({ ...form, type:t.id, color:t.color })}
                style={{ paddingHorizontal:11, paddingVertical:8, borderRadius:10, borderWidth:1.5,
                  borderColor: form.type===t.id ? t.color : C.border, backgroundColor: form.type===t.id ? t.color+"22" : C.card2 }}>
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
        </Card>
      ) : (
        <View style={{ marginHorizontal:16 }}>
          <Btn label="+ Registrar deuda" onPress={() => setAdding(true)} ghost />
        </View>
      )}
    </ScrollView>
  );
}

// ── EstrategiaScreen ─────────────────────────────────────────────────────────
export function EstrategiaScreen() {
  const { appState, updateState } = useFinance();
  const [subTab, setSubTab] = useState("metas");
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color:C.t1, letterSpacing:-0.5 }}>Estrategia</Text>
        <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>Destruye deudas. Construye riqueza.</Text>
      </View>
      <View style={{ flexDirection:"row", marginHorizontal:16, marginBottom:8, backgroundColor:C.card,
        borderRadius:12, padding:4, borderWidth:1, borderColor:C.border }}>
        {[["metas","Metas de Ahorro"],["deudas","Deudas"]].map(([id,label]) => (
          <TouchableOpacity key={id} onPress={() => setSubTab(id)}
            style={{ flex:1, paddingVertical:10, borderRadius:10,
              backgroundColor: subTab===id ? C.card2 : "transparent", alignItems:"center" }}>
            <Text style={{ fontSize:12, fontWeight:"700", color: subTab===id ? C.t1 : C.t3 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {subTab === "metas"  && <MetasTab  state={appState} setGoals={v => updateState({ goals:v })} />}
      {subTab === "deudas" && <DeudasTab state={appState} setDebts={v => updateState({ debts:v })} />}
    </SafeAreaView>
  );
}
