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
import { Bar, Btn, Input, FadeIn } from "../components/base";
import { BlurView } from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { generatePDF } from "../services/pdfGenerator";

const GlassCard = ({ children, style, danger, padding = 16 }) => {
  const borderCol = danger ? C.rose + "50" : C.gold + "30";
  const bg = "rgba(10, 10, 10, 0.4)"; // Siempre gris neutro — el latido rojo ya alerta visualmente
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

const EliteLockOverlay = ({ description, adLoaded, rewardedAd, adError, setAdError, onUpgrade }) => {
  const [adTimeout, setAdTimeout] = React.useState(false);
  React.useEffect(() => {
    if (adLoaded) { setAdTimeout(false); return; }
    // Aumentado a 5s para dar más tiempo a redes lentas / AdMob real
    const t = setTimeout(() => setAdTimeout(true), 5000);
    return () => clearTimeout(t);
  }, [adLoaded]);
  const showFallback = !adLoaded && !adError && adTimeout;
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 16, overflow: "hidden" }]}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.85)", padding: 12 }]}>
        <TouchableOpacity activeOpacity={1} onPress={onUpgrade} style={{ alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold+"20", borderWidth: 1, borderColor: C.gold+"40", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="lock-closed" size={14} color={C.gold} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "900", color: C.gold, letterSpacing: 0.2 }}>Fynx Elite</Text>
          </View>
          {!!description && (
            <Text style={{ fontSize: 11, color: C.t3, textAlign: "center", marginBottom: 8, lineHeight: 16, maxWidth: 240 }}>{description}</Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.gold+"15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Ionicons name="diamond-outline" size={10} color={C.gold} />
            <Text style={{ fontSize: 10, color: C.gold, fontWeight: "800" }}>Desde $2.99/mes</Text>
          </View>
        </TouchableOpacity>
        {adLoaded && rewardedAd ? (
          <TouchableOpacity onPress={() => { try { rewardedAd.show(); } catch(e) { console.warn(e); } }}
            style={{ paddingHorizontal:16, paddingVertical:10, backgroundColor:"rgba(255,255,255,0.07)", borderRadius:12, borderWidth:1, borderColor:"rgba(255,255,255,0.15)" }}>
            <Text style={{ fontSize:10, color:"#fff", fontWeight:"700" }}>📺  Ver Anuncio · Desbloquear 4h</Text>
          </TouchableOpacity>
        ) : adError ? (
          <TouchableOpacity onPress={() => { setAdError(false); rewardedAd?.load(); }}
            style={{ paddingHorizontal:16, paddingVertical:8, backgroundColor:"rgba(239,68,68,0.08)", borderRadius:12, borderWidth:1, borderColor:C.rose+"50" }}>
            <Text style={{ fontSize:10, color:C.rose, fontWeight:"600" }}>Sin anuncios disponibles. Reintentar</Text>
          </TouchableOpacity>
        ) : showFallback ? (
          <TouchableOpacity onPress={onUpgrade}
            style={{ paddingHorizontal:20, paddingVertical:9, backgroundColor:C.gold+"25", borderRadius:12, borderWidth:1, borderColor:C.gold+"60" }}>
            <Text style={{ fontSize:11, color:C.gold, fontWeight:"800" }}>Suscribirse a Elite →</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:16, paddingVertical:8, backgroundColor:"rgba(255,255,255,0.03)", borderRadius:12, borderWidth:1, borderColor:"rgba(255,255,255,0.07)" }}>
            <Ionicons name="hourglass-outline" size={11} color={C.t4} />
            <Text style={{ fontSize:10, color:C.t4, fontWeight:"600" }}>Preparando acceso gratuito...</Text>
          </View>
        )}
      </View>
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
  const [adError, setAdError] = useState(false);

  const [timeLeft, setTimeLeft] = useState(Math.max(0, tempUnlock - Date.now()));

  const userRef = React.useRef(user);
  userRef.current = user;

  React.useEffect(() => {
    if (!isTempUnlocked) return;
    const interval = setInterval(() => {
      const remaining = tempUnlock - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        updateState({ user: { ...userRef.current, tempUnlock: 0 } });
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000); // Check every second for UI freshness
    return () => clearInterval(interval);
  }, [tempUnlock, isTempUnlocked]);

  const formatTimeLeft = (ms) => {
    if (ms <= 0) return "0h 0m 0s";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  React.useEffect(() => {
    try {
      const { RewardedAd, RewardedAdEventType, TestIds } = require("react-native-google-mobile-ads");
      const adUnitId = __DEV__ ? TestIds.REWARDED : "ca-app-pub-4592841309124858/9960731632";
      const ad = RewardedAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdLoaded(true);
        setAdError(false);
      });
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        const unlockTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
        updateState({ user: { ...userRef.current, tempUnlock: unlockTime } });
        setAdLoaded(false);
      });
      const unsubClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        setAdError(false);
        setAdLoaded(false);
        ad.load(); // Preload next ad
      });
      const unsubError = ad.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
        console.warn("Ad failed to load: ", error);
        setAdLoaded(false);
        setAdError(true);
      });

      ad.load();
      setRewardedAd(ad);

      return () => { unsubLoaded(); unsubEarned(); unsubClosed(); unsubError(); };
    } catch(e) {
      console.warn("Rewarded ads disabled", e);
    }
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        const rc = require("../services/revenuecat");
        const isActive = await rc.isUserPremium();
        if (isActive !== esPremium) {
          updateState({ user: { ...user, premium: isActive } });
        }
      } catch(e) { console.warn("Error checking premium status on load", e); }
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

      {/* ── STICKY HEADER: Title + Settings ───────────────────────── */}
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingTop:14, paddingBottom:12, borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,0.05)" }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
          <View style={{ width:44, height:44, borderRadius:22, backgroundColor:"rgba(212,175,55,0.1)", borderWidth:1.5, borderColor:C.gold+"60", alignItems:"center", justifyContent:"center" }}>
            <Ionicons name={ICON.profile} size={22} color={C.gold} />
          </View>
          <View>
            <Text style={{ fontSize:17, fontWeight:"900", color:C.t1, letterSpacing:-0.3 }}>{user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}</Text>
            <Text style={{ fontSize:11, color:C.t3 }}>{user.email || "usuario@fynx.app"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openSettings} style={{ backgroundColor:"rgba(20,20,20,0.7)", borderRadius:11, borderWidth:1, borderColor:C.border2, paddingHorizontal:10, paddingVertical:7, flexDirection:"row", alignItems:"center", gap:4 }}>
          <Ionicons name={ICON.settings} size={13} color={C.t2} />
          <Text style={{ fontSize:11, fontWeight:"700", color:C.t2 }}>{lang === 'en' ? "Settings" : "Ajustes"}</Text>
        </TouchableOpacity>
      </View>

      {/* ── STICKY: Elite badge + PDF ─────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginTop:12, marginBottom:4, backgroundColor:"rgba(18,18,18,0.95)", borderRadius:16, borderWidth:1, borderColor:esPremium ? C.gold+"40" : C.border2 }}>
        <View style={{ padding:12, flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
          {esPremium ? (
            <View style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.gold+"20", paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:C.gold+"50" }}>
              <Ionicons name="diamond" size={16} color={C.gold} />
              <Text style={{ fontSize:13, fontWeight:"900", color:C.gold, letterSpacing:1 }}>FYNX ELITE</Text>
            </View>
          ) : isTempUnlocked ? (
            <View style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.skyBg2, paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:C.sky+"50" }}>
              <Ionicons name="time-outline" size={16} color={C.sky} />
              <Text style={{ fontSize:13, fontWeight:"900", color:C.sky, letterSpacing:1 }}>PASE 4H: {formatTimeLeft(timeLeft)}</Text>
            </View>
          ) : (
            <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
              <Ionicons name="diamond-outline" size={18} color={C.t3} />
              <Text style={{ fontSize:14, fontWeight:"800", color:C.t2 }}>Fynx Free</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => {
            if (!esPremium) setShowPremium(true);
            else {
              showAlert(lang === 'en' ? "Generating PDF" : "Generando PDF", lang === 'en' ? "Preparing your Fynx Elite report..." : "Preparando tu reporte Fynx Elite...", [], "info");
              try { generatePDF(appState); } catch(e) { showAlert("Error", String(e.message || e), [], "error"); }
            }
          }} style={{ flexDirection:"row", alignItems:"center", gap:6, backgroundColor: esPremium ? C.gold+"20" : "rgba(255,255,255,0.05)", borderRadius:10, paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor: esPremium ? C.gold+"60" : C.border2 }}>
            <Ionicons name={esPremium ? "document-text-outline" : ICON.lock} size={14} color={esPremium ? C.gold : C.t3} />
            <Text style={{ fontSize:12, fontWeight:"800", color: esPremium ? C.gold : C.t2 }}>{lang === 'en' ? "Export PDF" : "Exportar PDF"}</Text>
            {!esPremium && <Text style={{ fontSize:9, fontWeight:"900", color:C.gold, backgroundColor:C.gold+"20", paddingHorizontal:5, paddingVertical:2, borderRadius:5 }}>ELITE</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16, paddingBottom:110, paddingTop:12 }}>

        {/* ── SCORE GRID ─────────────────────────────────────────── */}
        <FadeIn delay={60}>
          <View style={{ flexDirection:"row", gap:10, marginBottom:10 }}>
            {/* Score Principal */}
            <View style={{ flex:1.2, borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:grade.color+"50" }}>
              <BlurView intensity={25} tint="dark" style={{ position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:grade.color+"12" }} />
              <View style={{ padding:16, alignItems:"center", justifyContent:"center", height:148 }}>
                <Ionicons name={grade.icon} size={20} color={grade.color} style={{ marginBottom:4 }} />
                <Text style={{ fontSize:52, fontWeight:"900", color:grade.color, letterSpacing:-3 }}>{total}</Text>
                <Text style={{ fontSize:9, color:grade.color+"BB", letterSpacing:2, fontWeight:"700" }}>FYNX SCORE</Text>
                <View style={{ marginTop:6, backgroundColor:grade.color+"20", paddingHorizontal:10, paddingVertical:3, borderRadius:8 }}>
                  <Text style={{ fontSize:10, color:grade.color, fontWeight:"800" }}>{grade.label}</Text>
                </View>
              </View>
            </View>
            {/* Stats col */}
            <View style={{ flex:1, gap:10 }}>
              <View style={{ flex:1, borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:C.mint+"30", minHeight:66 }}>
                <BlurView intensity={20} tint="dark" style={{ position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:"rgba(0,229,176,0.04)" }} />
                <View style={{ flex:1, padding:10, alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontSize:24, fontWeight:"900", color:consistency>=70?C.mint:C.gold }}>{consistency}%</Text>
                  <Text style={{ fontSize:9, color:C.t4, textAlign:"center", letterSpacing:1 }}>CONSISTENCIA</Text>
                </View>
              </View>
              <View style={{ flex:1, borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:C.orange+"30", minHeight:66 }}>
                <BlurView intensity={20} tint="dark" style={{ position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:"rgba(255,160,60,0.04)" }} />
                <View style={{ flex:1, padding:10, alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontSize:24, fontWeight:"900", color:C.orange }}>{streak}d</Text>
                  <Text style={{ fontSize:9, color:C.t4, textAlign:"center", letterSpacing:1 }}>RACHA</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* ── PREDICTOR ─────────────────────────────────────────── */}
        <FadeIn delay={120}>
          <View style={{ marginBottom: 10 }}>
          <GlassCard danger={!!runOut && esPremium} style={{ minHeight: !isFullyUnlocked ? 180 : 'auto' }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Ionicons name="pulse-outline" size={18} color={runOut && esPremium ? C.rose : C.sky} />
                <Text style={{ fontSize:13, fontWeight:"800", color:C.t1 }}>Predictor de Mes</Text>
              </View>
              {!esPremium && <Ionicons name={ICON.lock} size={16} color={C.t3} />}
            </View>
            
            {runOut && esPremium ? (
              <View>
                <View style={{ flexDirection:"row", alignItems:"flex-end", gap:6, marginBottom:8 }}>
                  <Ionicons name="warning-outline" size={20} color={C.rose} />
                  <Text style={{ fontSize:14, color:C.rose, fontWeight:"700", flex:1 }}>
                    Quedarás en cero el día <Text style={{ fontSize:22, fontWeight:"900" }}>{runOut}</Text>
                  </Text>
                </View>
                {/* ── EXPLICACIÓN DEL PREDICTOR ── */}
                <View style={{ backgroundColor:"rgba(239,68,68,0.08)", borderRadius:12, padding:10, borderWidth:1, borderColor:"rgba(239,68,68,0.2)", marginBottom:10 }}>
                  <Text style={{ fontSize:10, fontWeight:"700", color:C.rose, letterSpacing:1, marginBottom:4 }}>¿POR QUÉ ESTE ALERTA?</Text>
                  <Text style={{ fontSize:11, color:C.t2, lineHeight:16 }}>
                    Estás gastando <Text style={{ color:C.rose, fontWeight:"700" }}>{money(Math.round(dailyAvg),cur)}/día</Text> en promedio. A este ritmo, {Math.round(pctSpent)}% de tu ingreso mensual ya fue utilizado en solo {DAY} {DAY===1?"día":"días"}. El sistema proyecta que el saldo llegará a cero antes de fin de mes.
                  </Text>
                  <Text style={{ fontSize:10, color:C.t3, marginTop:6 }}>💡 Solución: Reduce tu gasto diario a menos de <Text style={{ color:C.mint, fontWeight:"700" }}>{money(Math.round((totalInc - totalExp) / Math.max(DAYS_IN_MONTH - DAY, 1)), cur)}/día</Text> para llegar sano a fin de mes.</Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
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
            <View style={{ marginTop:8 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
                <Text style={{ fontSize:10, color:C.t3 }}>Día {DAY} de {DAYS_IN_MONTH}</Text>
                <Text style={{ fontSize:10, fontWeight:"700", color:pctSpent>100?C.rose:pctSpent>80?C.gold:C.mint }}>{Math.round(pctSpent)}% gastado</Text>
              </View>
              <Bar pct={pctSpent} color={pctSpent>100?C.rose:C.mint} h={5} />
            </View>
            {!isFullyUnlocked && (
              <EliteLockOverlay
                description="Proyección exacta de cuándo se agota tu balance este mes"
                adLoaded={adLoaded}
                rewardedAd={rewardedAd}
                adError={adError}
                setAdError={setAdError}
                onUpgrade={() => setShowPremium(true)}
              />
            )}
          </GlassCard>
          </View>
        </FadeIn>

        {/* PRESUPUESTOS */}
        <FadeIn delay={160}>
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
            <EliteLockOverlay
              description="Establece límites por categoría y controla cada centavo que gastas"
              adLoaded={adLoaded}
              rewardedAd={rewardedAd}
              adError={adError}
              setAdError={setAdError}
              onUpgrade={() => setShowPremium(true)}
            />
          )}
          </GlassCard>
        </FadeIn>


        {/* SOCIAL SCORE (Solo premium) */}
        <FadeIn delay={200}>
          <View style={{ marginBottom: 12 }}>
            <GlassCard>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                  <Ionicons name="globe-outline" size={18} color={isFullyUnlocked ? C.sky : C.t3} />
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
                <EliteLockOverlay
                  description="Compara tu salud financiera con la comunidad Fynx Elite"
                  adLoaded={adLoaded}
                  rewardedAd={rewardedAd}
                  adError={adError}
                  setAdError={setAdError}
                  onUpgrade={() => setShowPremium(true)}
                />
              )}
            </GlassCard>
          </View>
        </FadeIn>

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
