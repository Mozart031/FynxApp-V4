import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { PremiumModal } from "../components/PremiumModal";
import { AdBanner }     from "../components/AdBanner";
import { ICON } from "../constants";
import { money, DAY, DAYS_IN_MONTH } from "../utils/formatters";
import { score, calcStreak, predictMonthEnd } from "../utils/finance";
import { Bar, Btn, Input } from "../components/base";
import { BlurView } from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { generatePDF } from "../services/pdfGenerator";

const GlassCard = ({ children, style, danger, padding = 16 }) => {
  const borderCol = danger ? C.rose + "40" : C.gold + "30";
  const bg = danger ? "rgba(239, 68, 68, 0.1)" : "rgba(10, 10, 10, 0.4)";
  return (
    <View style={[{ borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: borderCol }, style]}>
      <BlurView intensity={20} tint="dark" style={{ backgroundColor: bg }}>
        <View style={{ padding }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

export function PerfilScreen({ openSettings }) {
  const { appState, updateState } = useFinance();
  const { t, lang } = useLanguage();
  const { showAlert } = useEliteAlert();
  const posthog = usePostHog();
  const { user={}, expenses=[], income=[], budgets={}, reminders=[], streakDays=[] } = appState || {};
  const cur = user.currency || "RD$";
  
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", day:"" });
  const [showPremium, setShowPremium] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetCat, setBudgetCat] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");
  const esPremium = appState?.user?.premium || false;
  const tempUnlock = appState?.user?.tempUnlock || 0;
  const isTempUnlocked = Date.now() < tempUnlock;
  const isFullyUnlocked = esPremium || isTempUnlocked;

  const [rewardedAd, setRewardedAd] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);

  React.useEffect(() => {
    try {
      const { RewardedAd, RewardedAdEventType, TestIds } = require("react-native-google-mobile-ads");
      const adUnitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED;
      const ad = RewardedAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setAdLoaded(true));
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        const unlockTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
        updateState({ user: { ...user, tempUnlock: unlockTime } });
        setAdLoaded(false);
      });
      const unsubClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        ad.load(); // Preload next ad
      });

      ad.load();
      setRewardedAd(ad);

      return () => { unsubLoaded(); unsubEarned(); unsubClosed(); };
    } catch(e) {
      console.warn("Rewarded ads disabled", e);
    }
  }, [user]);
  React.useEffect(() => {
    (async () => {
      try {
        const rc = require("../services/revenuecat");
        const isActive = await rc.rcCheckSubscription();
        if (isActive !== esPremium) {
          updateState({ user: { ...user, premium: isActive } });
        }
      } catch(e) { }
    })();
  }, []);

  const totalInc = income.reduce((a,i) => a+i.amount, 0);
  const totalExp = expenses.reduce((a,e) => a+e.amount, 0);
  const { total, grade } = score(expenses, totalInc, budgets, streakDays, []);
  const streak = calcStreak(streakDays);
  
  const { balEOM, dailyAvg, runOut, pctSpent } = predictMonthEnd(appState);
  
  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0,7);
  const upcoming = reminders.filter(r=>r.active && r.paidMonth !== currentMonth).sort((a,b)=>a.day-b.day);
  const daysThisMonth = (streakDays||[]).filter(d=>d.startsWith(currentMonth)).length;
  const consistency = Math.round((daysThisMonth/DAY)*100);

  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
  const spentByCat = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#000" }}>
      {/* HEADER IDENTITY */}
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingTop:14, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "Profile" : "Perfil"}</Text>
        <TouchableOpacity onPress={openSettings} style={{ backgroundColor:"rgba(20,20,20,0.5)", borderRadius:11, borderWidth:1, borderColor:C.border2, paddingHorizontal:12, paddingVertical:7, flexDirection:"row", alignItems:"center", gap:4 }}>
          <Ionicons name={ICON.settings} size={14} color={C.t2} />
          <Text style={{ fontSize:12, fontWeight:"700", color:C.t2 }}>Config</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16, paddingBottom:110 }}>
        
        {/* AVATAR & INFO */}
        <View style={{ flexDirection:"row", alignItems:"center", gap:16, marginBottom:20, marginTop:10 }}>
          <View style={{ width:60, height:60, borderRadius:30, backgroundColor:"rgba(0,0,0,0.5)", borderWidth:1, borderColor:C.gold, alignItems:"center", justifyContent:"center" }}>
            <Ionicons name={ICON.profile} size={30} color={C.gold} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:20, fontWeight:"900", color:C.t1 }}>{user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}</Text>
            <Text style={{ fontSize:13, color:C.t3 }}>{user.email || "usuario@fynx.app"}</Text>
          </View>
        </View>

        {/* ELITE STATUS & PDF */}
        <GlassCard padding={0}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Ionicons name="diamond" size={20} color={esPremium ? C.gold : C.t3} />
                <Text style={{ fontSize:15, fontWeight:"800", color:C.t1 }}>{esPremium ? "Fynx Elite" : "Fynx Free"}</Text>
              </View>
              {!esPremium && (
                <TouchableOpacity onPress={() => setShowPremium(true)} style={{ backgroundColor:C.goldBg, borderRadius:8, borderWidth:1, borderColor:C.gold+"50", paddingHorizontal:8, paddingVertical:4 }}>
                  <Text style={{ fontSize:10, fontWeight:"800", color:C.gold }}>UPGRADE</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => {
              if (!esPremium) setShowPremium(true);
              else {
                showAlert(lang === 'en' ? "Generating PDF" : "Generando PDF", lang === 'en' ? "Preparing your Fynx Elite report..." : "Preparando tu reporte Fynx Elite...", [], "info");
                try {
                  generatePDF(appState);
                } catch(e) {
                  console.error("PDF generation error:", e);
                  showAlert("Error", String(e.message || e), [], "error");
                }
              }
            }} style={{ backgroundColor: esPremium ? C.gold+"20" : "rgba(20,20,20,0.5)", borderRadius:12, paddingVertical:12, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8, borderWidth: 1, borderColor: esPremium ? C.gold+"60" : C.border2 }}>
              {!esPremium && <Ionicons name={ICON.lock} size={16} color={C.t3} />}
              <Text style={{ fontSize:13, fontWeight:"800", color: esPremium ? C.gold : C.t2 }}>{lang === 'en' ? "Export Summary (PDF)" : "Exportar Resumen (PDF)"}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* SCORE & CONSISTENCY (GRID) */}
        <View style={{ flexDirection:"row", gap:12, marginBottom:12 }}>
          <View style={{ flex:1, borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:grade.color+"40" }}>
            <BlurView intensity={20} tint="dark" style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, backgroundColor:grade.color+"10" }} />
            <View style={{ padding:16, alignItems:"center", justifyContent:"center", height:140 }}>
              <Ionicons name={grade.icon} size={24} color={grade.color} style={{marginBottom:6}} />
              <Text style={{ fontSize:42, fontWeight:"900", color:grade.color, letterSpacing:-2 }}>{total}</Text>
              <Text style={{ fontSize:10, color:C.t3 }}>Fynx Score</Text>
            </View>
          </View>
          <View style={{ flex:1, gap:12 }}>
            <View style={{ flex:1, borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:C.gold+"30", minHeight: 64 }}>
              <BlurView intensity={20} tint="dark" style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, backgroundColor:"rgba(10,10,10,0.4)" }} />
              <View style={{ padding:12, alignItems:"center", justifyContent:"center", flex:1 }}>
                <Text style={{ fontSize:22, fontWeight:"900", color:consistency>=70?C.mint:C.gold }}>{consistency}%</Text>
                <Text style={{ fontSize:10, color:C.t3, textAlign:"center" }}>Consistencia</Text>
              </View>
            </View>
            <View style={{ flex:1, borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:C.gold+"30", minHeight: 64 }}>
              <BlurView intensity={20} tint="dark" style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, backgroundColor:"rgba(10,10,10,0.4)" }} />
              <View style={{ padding:12, alignItems:"center", justifyContent:"center", flex:1 }}>
                <Text style={{ fontSize:22, fontWeight:"900", color:C.orange }}>{streak}d</Text>
                <Text style={{ fontSize:10, color:C.t3, textAlign:"center" }}>Racha Activa</Text>
              </View>
            </View>
          </View>
        </View>

        {/* PREDICTOR */}
        <View style={{ marginBottom: 12 }}>
          <GlassCard danger={!!runOut && esPremium}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Ionicons name={ICON.chart} size={18} color={esPremium ? C.t1 : C.t3} />
                <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>Predictor de Mes</Text>
              </View>
              {!esPremium && <Ionicons name={ICON.lock} size={16} color={C.t3} />}
            </View>
            
            {runOut && esPremium ? (
              <Text style={{ fontSize:14, color:C.rose, fontWeight:"700", lineHeight:22 }}>
                Alerta: Quedarás en cero el día <Text style={{ fontSize:20 }}>{runOut}</Text>
              </Text>
            ) : (
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                <View>
                  <Text style={{ fontSize:10, color:C.t3, marginBottom:2 }}>Proyección al día {DAYS_IN_MONTH}</Text>
                  <Text style={{ fontSize:28, fontWeight:"900", color:C.mint, letterSpacing:-1 }}>{money(Math.round(balEOM),cur)}</Text>
                </View>
                <View style={{ alignItems:"flex-end" }}>
                  <Text style={{ fontSize:10, color:C.t3, marginBottom:2 }}>Ritmo actual</Text>
                  <Text style={{ fontSize:14, fontWeight:"800", color:C.t1 }}>{money(Math.round(dailyAvg),cur)}/d</Text>
                </View>
              </View>
            )}
            <View style={{ marginTop:14 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
                <Text style={{ fontSize:10, color:C.t3 }}>Día {DAY} de {DAYS_IN_MONTH}</Text>
                <Text style={{ fontSize:10, fontWeight:"700", color:pctSpent>100?C.rose:pctSpent>80?C.gold:C.mint }}>{Math.round(pctSpent)}% gastado</Text>
              </View>
              <Bar pct={pctSpent} color={pctSpent>100?C.rose:C.mint} h={5} />
            </View>
            {!isFullyUnlocked && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 16, overflow: "hidden" }]}>
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.85)" }]}>
                  <TouchableOpacity activeOpacity={1} onPress={() => setShowPremium(true)} style={{ alignItems: "center", marginBottom: adLoaded ? 16 : 0 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold+"20", borderWidth: 1, borderColor: C.gold+"40", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Ionicons name={ICON.lock} size={24} color={C.gold} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: C.gold }}>Exclusivo Fynx Elite</Text>
                  </TouchableOpacity>
                  {adLoaded && rewardedAd && (
                    <TouchableOpacity onPress={() => {
                      try { rewardedAd.show(); } catch(e) { console.warn(e); }
                    }} style={{ paddingHorizontal:16, paddingVertical:8, backgroundColor:"rgba(255,255,255,0.05)", borderRadius:12, borderWidth:1, borderColor:C.border }}>
                      <Text style={{ fontSize:10, color:C.t2, fontWeight:"700" }}>Ver Anuncio (Desbloquea 4h)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </GlassCard>
        </View>

        {/* PRESUPUESTOS */}
        <GlassCard>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
              <Ionicons name="pie-chart-outline" size={18} color={C.mint} />
              <Text style={{ fontSize:13, fontWeight:"800", color:C.t1 }}>{lang === 'en' ? "Category Budgets" : "Presupuestos de Categoría"}</Text>
            </View>
            <TouchableOpacity onPress={() => {
              if (!esPremium) setShowPremium(true);
              else setEditingBudget(!editingBudget);
            }} style={{ backgroundColor:"rgba(255,255,255,0.05)", paddingHorizontal:8, paddingVertical:4, borderRadius:8 }}>
              <Text style={{ fontSize:10, fontWeight:"700", color:C.t2 }}>{editingBudget ? (lang === 'en' ? "Close" : "Cerrar") : (lang === 'en' ? "Edit" : "Editar")}</Text>
            </TouchableOpacity>
          </View>
          
          {editingBudget ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection:"row", gap:10 }}>
                <View style={{ flex:2 }}><Input placeholder="Categoría (ej: Comida)" value={budgetCat} onChange={setBudgetCat} /></View>
                <View style={{ flex:1.5 }}><Input placeholder="Límite" value={budgetAmt} onChange={setBudgetAmt} numeric /></View>
              </View>
              <Btn label="Asignar Presupuesto" onPress={() => {
                if(budgetCat && budgetAmt) {
                   updateState({ budgets: { ...budgets, [budgetCat]: +budgetAmt } });
                   setBudgetCat(""); setBudgetAmt("");
                }
              }} />
            </View>
          ) : null}

          {Object.keys(budgets).length === 0 && !editingBudget ? (
             <Text style={{ fontSize:12, color:C.t3 }}>No tienes presupuestos definidos. {esPremium ? "Toca editar para comenzar." : "Exclusivo de Fynx Elite."}</Text>
          ) : (
            Object.keys(budgets).map(cat => {
               const limit = budgets[cat];
               const spent = spentByCat[cat] || 0;
               const pct = Math.min((spent / Math.max(limit,1))*100, 100);
               const over = spent > limit;
               const barCol = over ? C.rose : (pct > 85 ? C.gold : C.mint);
               return (
                 <View key={cat} style={{ marginBottom:12 }}>
                   <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:4 }}>
                     <Text style={{ fontSize:12, fontWeight:"700", color:C.t1 }}>{cat}</Text>
                     <Text style={{ fontSize:11, color: over ? C.rose : C.t2 }}>{money(spent,cur)} / {money(limit,cur)}</Text>
                   </View>
                   <Bar pct={pct} color={barCol} h={6} />
                 </View>
               );
            })
          )}
          {!isFullyUnlocked && Object.keys(budgets).length > 0 && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 16, overflow: "hidden", top: 40 }]}>
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.85)" }]}>
                  <TouchableOpacity activeOpacity={1} onPress={() => setShowPremium(true)} style={{ alignItems: "center", marginBottom: adLoaded ? 16 : 0 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold+"20", borderWidth: 1, borderColor: C.gold+"40", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Ionicons name={ICON.lock} size={24} color={C.gold} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: C.gold }}>{lang === 'en' ? "Fynx Elite Exclusive" : "Exclusivo Fynx Elite"}</Text>
                  </TouchableOpacity>
                  {adLoaded && rewardedAd && (
                    <TouchableOpacity onPress={() => {
                      try { rewardedAd.show(); } catch(e) { console.warn(e); }
                    }} style={{ paddingHorizontal:16, paddingVertical:8, backgroundColor:"rgba(255,255,255,0.05)", borderRadius:12, borderWidth:1, borderColor:C.border }}>
                      <Text style={{ fontSize:10, color:C.t2, fontWeight:"700" }}>Ver Anuncio (Desbloquea 4h)</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          )}
        </GlassCard>


        {/* SOCIAL SCORE (Solo premium) */}
        <View style={{ marginBottom: 12 }}>
          <GlassCard>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Ionicons name={ICON.chart} size={18} color={isFullyUnlocked ? C.sky : C.t3} />
                <Text style={{ fontSize:13, fontWeight:"800", color:C.t1 }}>Social Score</Text>
              </View>
              {!isFullyUnlocked && <Ionicons name={ICON.lock} size={16} color={C.t3} />}
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
              <Text style={{ fontSize:12, color:C.t3, flex:1 }}>Tu nivel frente a la comunidad Fynx Elite.</Text>
              <View style={{ alignItems:"center", backgroundColor:C.sky+"15", paddingHorizontal:12, paddingVertical:8, borderRadius:12 }}>
                <Text style={{ fontSize:10, color:C.sky, fontWeight:"700" }}>TOP</Text>
                <Text style={{ fontSize:22, fontWeight:"900", color:isFullyUnlocked ? C.sky : C.t4 }}>{isFullyUnlocked ? "15%" : "--"}</Text>
              </View>
            </View>
            
            {!isFullyUnlocked && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 16, overflow: "hidden" }]}>
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.85)" }]}>
                  <TouchableOpacity activeOpacity={1} onPress={() => setShowPremium(true)} style={{ alignItems: "center", marginBottom: adLoaded ? 16 : 0 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold+"20", borderWidth: 1, borderColor: C.gold+"40", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Ionicons name={ICON.lock} size={24} color={C.gold} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: C.gold }}>Exclusivo Fynx Elite</Text>
                  </TouchableOpacity>
                  {adLoaded && rewardedAd && (
                    <TouchableOpacity onPress={() => {
                      try { rewardedAd.show(); } catch(e) { console.warn(e); }
                    }} style={{ paddingHorizontal:16, paddingVertical:8, backgroundColor:"rgba(255,255,255,0.05)", borderRadius:12, borderWidth:1, borderColor:C.border }}>
                      <Text style={{ fontSize:10, color:C.t2, fontWeight:"700" }}>Ver Anuncio (Desbloquea 4h)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </GlassCard>
        </View>

        <AdBanner esPremium={esPremium} onUpgrade={() => setShowPremium(true)} />
      </ScrollView>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          if (success) {
            posthog?.capture('Suscripcion_Exitosa', { plan });
            updateState({ user: { ...appState.user, premium: true } });
            setShowPremium(false);
          } else {
            posthog?.capture('Suscripcion_Fallida', { plan });
          }
        }}
      />
    </SafeAreaView>
  );
}
