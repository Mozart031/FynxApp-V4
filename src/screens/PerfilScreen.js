import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal } from "react-native";
import { View, SafeAreaView, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { PremiumModal } from "../components/PremiumModal";
import { LegalScreen }   from "./LegalScreen";
import { cerrarSesion }  from "../services/firebase";
import { AdBanner }     from "../components/AdBanner";
import { PREMIUM }      from "../constants/texts";
import { ICON } from "../constants";
import { money, DAY, DAYS_IN_MONTH, weeklyBreakdown } from "../utils/formatters";
import { score, calcStreak, streakMessage } from "../utils/finance";
import { Card, Bar, Tag, CatIcon, FadeIn, Btn, Input, styles } from "../components/base";
import { StreakBanner } from "../components/StreakBanner";

export function PerfilScreen({ openSettings }) {
  const { appState, updateState, isDark, toggleTheme, frenoState, toggleFreno } = useFinance();
  const { user={}, expenses=[], income=[], budgets={}, reminders=[], streakDays=[], goals=[], debts=[] } = appState || {};
  const cur      = user.currency || "RD$";
  const [sub, setSub] = useState("score");
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ name:"", amount:"", day:"" });
  const [showPremium, setShowPremium] = useState(false);
  const [showLegal,   setShowLegal]   = useState(false);
  const [cerrando,    setCerrando]    = useState(false);
  const esPremium = appState?.user?.premium || false;

  async function handleLogout() {
    setCerrando(true);
    try {
      await cerrarSesion();
      await AsyncStorage.multiRemove(["@fynx_session", "@fynx_appstate"]);
      // Forzar recarga de la app
      await AsyncStorage.removeItem("@fynx_carousel_visto");
    } catch(e) { console.warn(e); }
    setCerrando(false);
  }

  const totalInc = income.reduce((a,i) => a+i.amount, 0);
  const totalExp = expenses.reduce((a,e) => a+e.amount, 0);
  const { total, s, grade } = score(expenses, totalInc, budgets);
  const savePct  = totalInc > 0 ? Math.round(((totalInc-totalExp)/totalInc)*100) : 0;
  const streak   = calcStreak(streakDays);
  const dailyAvg = totalExp / Math.max(DAY, 1);
  const projected= totalExp + dailyAvg * (DAYS_IN_MONTH - DAY);
  const balEOM   = totalInc - projected;
  const runOut   = balEOM < 0 ? Math.round(DAY + (totalInc-totalExp)/Math.max(dailyAvg,1)) : null;
  const pctSpent = Math.min((projected / Math.max(totalInc,1))*100, 120);
  const today2   = new Date().getDate();
  const totalRem = reminders.filter(r=>r.active).reduce((a,r)=>a+r.amount,0);
  const upcoming = reminders.filter(r=>r.active && r.day>=today2).sort((a,b)=>a.day-b.day);
  const past     = reminders.filter(r=>r.active && r.day<today2);

  const savingGoal = user.savingGoalPct || 20;
  const ct = {};
  expenses.forEach(e => { ct[e.cat] = (ct[e.cat]||0) + e.amount; });
  const overBudget   = Object.entries(budgets).some(([k,l]) => (ct[k]||0) > l);
  const isSuperSaver = savePct >= 30;
  const noNewDebts   = debts.length === 0;
  const perfectMonth = expenses.length >= 20 && !overBudget && savePct >= savingGoal;
  const hasGoal      = goals.length > 0;
  const weeklyExp    = weeklyBreakdown(expenses);
  const maxWeek      = Math.max(...weeklyExp, 1);
  const weekNames    = ["S1","S2","S3","S4","S5"];
  const bestIdx      = weeklyExp.indexOf(Math.min(...weeklyExp.filter(w=>w>0)));
  const worstIdx     = weeklyExp.indexOf(Math.max(...weeklyExp));
  const daysThisMonth= (streakDays||[]).filter(d=>d.startsWith(new Date().toISOString().slice(0,7))).length;
  const consistency  = Math.round((daysThisMonth/DAY)*100);
  const topCat       = Object.entries(ct).sort((a,b)=>b[1]-a[1])[0];

  const TABS = [["score","Score"],["resumen","Resumen"],["predictor","Predictor"],["pagos","Pagos"]];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
        paddingHorizontal:16, paddingTop:14, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color:C.t1 }}>Perfil</Text>
        <View style={{ flexDirection:"row", gap:8 }}>
          {!esPremium && (
            <TouchableOpacity onPress={() => setShowPremium(true)}
              style={{ backgroundColor:C.goldBg, borderRadius:11, borderWidth:1, borderColor:C.gold+"50", paddingHorizontal:10, paddingVertical:7 }}>
              <Text style={{ fontSize:11, fontWeight:"800", color:C.gold }}>★ Premium</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openSettings}
            style={{ backgroundColor:C.card2, borderRadius:11, borderWidth:1, borderColor:C.border2, paddingHorizontal:12, paddingVertical:7 }}>
            <Text style={{ fontSize:12, fontWeight:"700", color:C.t2 }}>{ICON.settings} Config</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
        <View style={{ flexDirection:"row", marginHorizontal:16, marginBottom:10, backgroundColor:C.card,
          borderRadius:13, padding:4, borderWidth:1, borderColor:C.border }}>
          {TABS.map(([id,label]) => (
            <TouchableOpacity key={id} onPress={() => setSub(id)}
              style={{ flex:1, paddingVertical:9, borderRadius:10, backgroundColor:sub===id?C.card2:"transparent", alignItems:"center" }}>
              <Text style={{ fontSize:10, fontWeight:"700", color:sub===id?C.t1:C.t3 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SCORE */}
        {sub === "score" && (
          <>
            <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:22, overflow:"hidden",
              borderWidth:1, borderColor:grade.color+"45" }}>
              <View style={{ backgroundColor:grade.color+"0C", padding:26, alignItems:"center" }}>
                <Text style={{ fontSize:22, color:grade.color, fontWeight:"900", marginBottom:8 }}>{grade.icon}</Text>
                <Text style={{ fontSize:68, fontWeight:"900", color:grade.color, letterSpacing:-3, lineHeight:72 }}>{total}</Text>
                <Text style={{ fontSize:12, color:C.t3, marginTop:2 }}>puntos de 100</Text>
                <View style={{ marginTop:10 }}><Tag label={grade.label} color={grade.color} /></View>
              </View>
              <View style={{ flexDirection:"row", backgroundColor:grade.color+"10",
                borderTopWidth:1, borderTopColor:grade.color+"22" }}>
                {[[streak+"d","Racha",C.orange],[savePct+"%","Ahorro",C.mint],[expenses.length+"","Registros",C.sky]].map(([v,l,c],i) => (
                  <View key={l} style={{ flex:1, paddingVertical:12, alignItems:"center",
                    borderRightWidth:i<2?1:0, borderRightColor:grade.color+"18" }}>
                    <Text style={{ fontSize:15, fontWeight:"800", color:c }}>{v}</Text>
                    <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Card style={{ marginBottom:12 }}>
              <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:14 }}>Desglose del Score</Text>
              {[["Tasa de ahorro",s.ahorro,C.mint],["Control",s.presupuesto,C.sky],
                ["Registro",s.consistencia,C.violet],["Manejo de deudas",s.deuda,C.gold]].map(([label,val,color],idx) => (
                <View key={label} style={{ marginBottom:idx<3?14:0 }}>
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:5 }}>
                    <Text style={{ fontSize:12, color:C.t2 }}>{label}</Text>
                    <Text style={{ fontSize:12, fontWeight:"800", color }}>{Math.round(val)}pts</Text>
                  </View>
                  <Bar pct={val} color={color} h={5} />
                </View>
              ))}
            </Card>
            <Card>
              <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:14 }}>Logros</Text>
              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
                {[
                  [ICON.fire,"Racha activa",streak+" días",streak>=3,C.orange],
                  [ICON.check,"Sin exceder","Presupuesto OK",!overBudget&&expenses.length>0,C.mint],
                  [ICON.target,"Meta activa","Ahorro en curso",hasGoal,C.sky],
                  [ICON.save,"Super ahorrador","30%+ ahorro",isSuperSaver,C.gold],
                  [ICON.shield,"Sin deudas","Lista limpia",noNewDebts,C.green],
                  [ICON.star,"Mes perfecto","20+ registros",perfectMonth,C.violet],
                ].map(([ic,label,desc,done,col]) => (
                  <View key={label} style={{ width:"47%", backgroundColor:done?col+"14":C.card2,
                    borderRadius:14, borderWidth:1, borderColor:done?col+"40":C.border,
                    padding:13, opacity:done?1:0.28 }}>
                    <Text style={{ fontSize:18, color:done?col:C.t3, fontWeight:"900", marginBottom:6 }}>{ic}</Text>
                    <Text style={{ fontSize:11, fontWeight:"800", color:done?col:C.t3 }}>{label}</Text>
                    <Text style={{ fontSize:10, color:C.t3, marginTop:2 }}>{desc}</Text>
                    {done && <View style={{ position:"absolute", top:10, right:10, width:7, height:7, borderRadius:4, backgroundColor:col }} />}
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* RESUMEN */}
        {sub === "resumen" && (
          <>
            <StreakBanner streakDays={streakDays} />
            {weeklyExp.some(w=>w>0) && (
              <Card style={{ marginBottom:12 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>Gasto por semana</Text>
                  <Tag label={money(totalExp,cur)} color={C.rose} />
                </View>
                <View style={{ flexDirection:"row", alignItems:"flex-end", gap:8, height:90 }}>
                  {weeklyExp.map((w,i) => {
                    const h      = maxWeek>0?Math.max((w/maxWeek)*72,w>0?8:0):0;
                    const isBest = i===bestIdx&&w>0;
                    const isWst  = weeklyExp.filter(x=>x>0).length>1&&i===worstIdx;
                    const barCol = isBest?C.mint:isWst?C.rose:C.sky;
                    return (
                      <View key={i} style={{ flex:1, alignItems:"center", justifyContent:"flex-end", height:90 }}>
                        {(isBest||isWst)&&<Text style={{ fontSize:7, color:barCol, fontWeight:"700", marginBottom:3 }}>{isBest?"MIN":"MAX"}</Text>}
                        <View style={{ width:"100%", height:h, borderRadius:7, backgroundColor:barCol, opacity:w===0?0.15:1 }} />
                        <Text style={{ fontSize:8, color:C.t3, marginTop:4 }}>{weekNames[i]}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}
            <Card style={{ marginBottom:12 }}>
              <View style={{ flexDirection:"row", gap:10 }}>
                {[[daysThisMonth+"/"+DAY,"Días activos",C.mint],[consistency+"%","Consistencia",consistency>=70?C.mint:C.gold],[streak+"d","Racha",C.orange]].map(([v,l,c]) => (
                  <View key={l} style={{ flex:1, backgroundColor:c+"12", borderRadius:12, borderWidth:1, borderColor:c+"28", padding:12, alignItems:"center" }}>
                    <Text style={{ fontSize:16, fontWeight:"900", color:c }}>{v}</Text>
                    <Text style={{ fontSize:9, color:C.t3, marginTop:3, textAlign:"center" }}>{l}</Text>
                  </View>
                ))}
              </View>
            </Card>
            {topCat && (
              <Card style={{ marginBottom:12 }}>
                <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:12 }}>Mayor gasto del mes</Text>
                <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                  <CatIcon cat={topCat[0]} size={48} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:15, fontWeight:"800", color:C.t1 }}>{topCat[0]}</Text>
                    <View style={{ marginTop:8 }}>
                      <Bar pct={totalExp>0?(topCat[1]/totalExp)*100:0} color={C.mint} h={5} />
                    </View>
                  </View>
                  <View style={{ alignItems:"flex-end" }}>
                    <Text style={{ fontSize:15, fontWeight:"900", color:C.mint }}>{money(topCat[1],cur)}</Text>
                    <Text style={{ fontSize:10, color:C.t3 }}>{totalExp>0?Math.round((topCat[1]/totalExp)*100):0}%</Text>
                  </View>
                </View>
              </Card>
            )}
            <Card style={{ marginBottom:12 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>Actividad del mes</Text>
                <Tag label={daysThisMonth+" días"} color={C.mint} />
              </View>
              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:5 }}>
                {Array.from({ length:DAYS_IN_MONTH }, (_,i) => {
                  const dn  = i+1;
                  const ds  = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(dn).padStart(2,"0")}`;
                  const done= (streakDays||[]).includes(ds);
                  const isPast=dn<=DAY; const isT=dn===DAY;
                  return (
                    <View key={dn} style={{ width:26, height:26, borderRadius:7,
                      backgroundColor:done?C.mint:isT?C.mintBg2:isPast?C.card3:C.card2,
                      borderWidth:isT?1.5:0, borderColor:C.mint+"70", alignItems:"center", justifyContent:"center" }}>
                      {done?<Text style={{ fontSize:10, color:"#000", fontWeight:"900" }}>{ICON.check}</Text>
                           :<Text style={{ fontSize:9, color:isPast?C.t4:C.t5, fontWeight:"600" }}>{dn}</Text>}
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {/* PREDICTOR */}
        {sub === "predictor" && (
          <>
            <Card style={{ marginBottom:12, borderColor:runOut?C.rose+"50":C.mint+"40",
              backgroundColor:runOut?C.roseBg:C.mintBg }}>
              <Text style={{ fontSize:9, color:runOut?C.rose:C.mint, letterSpacing:2.5, marginBottom:8, fontWeight:"700" }}>
                {runOut?"ALERTA":"PROYECCION FAVORABLE"}
              </Text>
              {runOut ? (
                <Text style={{ fontSize:14, color:C.rose, fontWeight:"700", lineHeight:22 }}>
                  Quedarás en cero el día <Text style={{ fontSize:22 }}>{runOut}</Text>
                </Text>
              ) : (
                <>
                  <Text style={{ fontSize:10, color:C.t3, marginBottom:4 }}>Balance al día {DAYS_IN_MONTH}</Text>
                  <Text style={{ fontSize:36, fontWeight:"900", color:C.mint, letterSpacing:-1 }}>{money(Math.round(balEOM),cur)}</Text>
                  <Text style={{ fontSize:12, color:C.t3, marginTop:6 }}>Ritmo: <Text style={{ color:C.t1, fontWeight:"600" }}>{money(Math.round(dailyAvg),cur)}/día</Text></Text>
                </>
              )}
              <View style={{ marginTop:14 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
                  <Text style={{ fontSize:10, color:C.t3 }}>Día {DAY} de {DAYS_IN_MONTH}</Text>
                  <Text style={{ fontSize:10, fontWeight:"700", color:pctSpent>100?C.rose:pctSpent>80?C.gold:C.mint }}>{Math.round(pctSpent)}% proyectado</Text>
                </View>
                <Bar pct={pctSpent} color={C.mint} h={5} />
              </View>
            </Card>
            <Card style={{ flexDirection:"row", padding:0, overflow:"hidden", marginBottom:12 }}>
              {[[money(Math.round(dailyAvg),cur),"Por día",C.gold],[money(Math.round(dailyAvg*7),cur),"Por semana",C.sky],[(DAYS_IN_MONTH-DAY)+" días","Restantes",C.violet]].map(([v,l,c],i) => (
                <View key={l} style={{ flex:1, padding:14, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:C.border }}>
                  <Text style={{ fontSize:12, fontWeight:"800", color:c, marginBottom:2 }}>{v}</Text>
                  <Text style={{ fontSize:9, color:C.t3 }}>{l}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* PAGOS */}
        {sub === "pagos" && (
          <>
            {reminders.length > 0 && (
              <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:C.gold+"40" }}>
                <View style={{ backgroundColor:C.goldBg, padding:16 }}>
                  <Text style={{ fontSize:9, color:C.gold, letterSpacing:2.5, fontWeight:"700", marginBottom:6 }}>COMPROMISOS</Text>
                  <Text style={{ fontSize:30, fontWeight:"900", color:C.gold, letterSpacing:-1 }}>{money(totalRem,cur)}</Text>
                </View>
              </View>
            )}
            {[["Próximos", upcoming], ["Ya pagados", past]].map(([title, list]) => list.length > 0 && (
              <Card key={title} style={{ marginBottom:12 }}>
                <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:12 }}>{title}</Text>
                {list.map((r,i) => (
                  <View key={r.id}>
                    <View style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:8 }}>
                      <View style={{ width:36, height:36, borderRadius:11, backgroundColor:C.mintBg2, alignItems:"center", justifyContent:"center" }}>
                        <Text style={{ fontSize:14, color:C.mint, fontWeight:"900" }}>{ICON.check}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:13, fontWeight:"700", color:title==="Ya pagados"?C.t2:C.t1,
                          textDecorationLine:title==="Ya pagados"?"line-through":"none" }}>{r.name}</Text>
                        <Text style={{ fontSize:10, color:C.t3 }}>Día {r.day}</Text>
                      </View>
                      <Text style={{ fontSize:13, fontWeight:"800", color:title==="Ya pagados"?C.t3:C.mint }}>{money(r.amount,cur)}</Text>
                      <TouchableOpacity onPress={() => updateState({ reminders: reminders.filter(x=>x.id!==r.id) })}>
                        <Text style={{ color:C.t4, fontSize:18 }}>{ICON.close}</Text>
                      </TouchableOpacity>
                    </View>
                    {i < list.length-1 && <View style={{ height:1, backgroundColor:C.border, marginLeft:48 }} />}
                  </View>
                ))}
              </Card>
            ))}
            {adding ? (
              <Card style={{ marginBottom:12 }}>
                <Text style={{ fontSize:13, fontWeight:"700", color:C.t1, marginBottom:12 }}>Nuevo recordatorio</Text>
                <Input value={form.name}   onChange={v => setForm({ ...form, name:v })}   placeholder="Nombre (Ej.: Netflix)" />
                <Input value={form.amount} onChange={v => setForm({ ...form, amount:v })} placeholder={`Monto (${cur})`} numeric />
                <Input value={form.day}    onChange={v => setForm({ ...form, day:v })}    placeholder="Día del mes (1-31)" numeric />
                <View style={{ flexDirection:"row", gap:10 }}>
                  <Btn label="Cancelar" onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
                  <Btn label="Guardar" onPress={() => {
                    if (!form.name||!form.amount||!form.day) return;
                    updateState({ reminders:[...reminders,{ id:Date.now(), name:form.name, amount:+form.amount, day:+form.day, active:true }] });
                    setAdding(false); setForm({ name:"", amount:"", day:"" });
                  }} style={{ flex:2 }} />
                </View>
              </Card>
            ) : (
              <View style={{ marginHorizontal:16 }}>
                <Btn label="+ Nuevo recordatorio" onPress={() => setAdding(true)} ghost />
              </View>
            )}
          </>
        )}

        {/* Banner publicitario — solo usuarios gratuitos */}
        <AdBanner esPremium={esPremium} onUpgrade={() => setShowPremium(true)} />

      </ScrollView>

      {/* Sección legal y cuenta */}
      <View style={{ marginHorizontal:16, marginBottom:16 }}>
        <Text style={{ fontSize:9, color:C.t3, fontWeight:"700", letterSpacing:2.5, marginBottom:10 }}>
          LEGAL Y CUENTA
        </Text>

        {/* Términos y Privacidad */}
        <TouchableOpacity onPress={() => setShowLegal(true)}
          style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between",
            backgroundColor:C.card2, borderRadius:14, borderWidth:1, borderColor:C.border,
            padding:16, marginBottom:10 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
            <View style={{ width:36, height:36, borderRadius:10, backgroundColor:C.skyBg,
              alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:16 }}>◈</Text>
            </View>
            <View>
              <Text style={{ fontSize:14, fontWeight:"700", color:C.t1 }}>Términos y Privacidad</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>Condiciones de uso y datos</Text>
            </View>
          </View>
          <Text style={{ color:C.t3, fontSize:16 }}>›</Text>
        </TouchableOpacity>

        {/* Acerca de */}
        <View style={{ backgroundColor:C.card2, borderRadius:14, borderWidth:1,
          borderColor:C.border, padding:16, marginBottom:10 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:12, marginBottom:8 }}>
            <View style={{ width:36, height:36, borderRadius:10, backgroundColor:C.mintBg,
              alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:14, fontWeight:"800", color:C.mint }}>FX</Text>
            </View>
            <View>
              <Text style={{ fontSize:14, fontWeight:"700", color:C.t1 }}>Acerca de Fynx</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>Versión 1.0.0 — com.fynx.app</Text>
            </View>
          </View>
          <View style={{ height:1, backgroundColor:C.border, marginBottom:8 }} />
          <Text style={{ fontSize:11, color:C.t3, lineHeight:17 }}>
            Fynx es tu asistente de disciplina financiera personal.{"
"}
            Contacto: soporte@fynx.app
          </Text>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={handleLogout} disabled={cerrando}
          style={{ flexDirection:"row", alignItems:"center", justifyContent:"center",
            backgroundColor:C.roseBg, borderRadius:14, borderWidth:1, borderColor:C.rose+"40",
            padding:16, gap:10 }}>
          <Text style={{ fontSize:14, fontWeight:"700", color:C.rose }}>
            {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal Legal */}
      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>

      {/* Modal Premium */}
      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={() => {
          // Aquí conectar con RevenueCat / Stripe / IAP
          // Por ahora simula activación para pruebas
          updateState({ user: { ...appState.user, premium: true } });
          setShowPremium(false);
        }}
      />

    </SafeAreaView>
  );
}
