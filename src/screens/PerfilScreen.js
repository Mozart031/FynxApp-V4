import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { PremiumModal } from "../components/PremiumModal";
import { AdBanner } from "../components/AdBanner";
import { ICON } from "../constants";
import { money, DAY, DAYS_IN_MONTH } from "../utils/formatters";
import { score, calcStreak, predictMonthEnd } from "../utils/finance";
import { Bar, Btn, Input, FadeIn } from "../components/base";
import { BlurView } from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { generatePDF } from "../services/pdfGenerator";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

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

const EliteLockOverlay = ({ description, adLoaded, rewardedAd, adError, setAdError, onUpgrade, userEmail, onSimulateAd, lang }) => {
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
        <TouchableOpacity
          activeOpacity={1}
          onPress={onUpgrade}
          onLongPress={() => {
            if (userEmail === 'elprinciperojo21@gmail.com' && onSimulateAd) {
              onSimulateAd();
            }
          }}
          delayLongPress={1500}
          style={{ alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold + "20", borderWidth: 1, borderColor: C.gold + "40", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="lock-closed" size={14} color={C.gold} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "900", color: C.gold, letterSpacing: 0.2 }}>Fynx Elite</Text>
          </View>
          {!!description && (
            <Text style={{ fontSize: 11, color: C.t3, textAlign: "center", marginBottom: 8, lineHeight: 16, maxWidth: 240 }}>{description}</Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.gold + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Ionicons name="diamond-outline" size={10} color={C.gold} />
            <Text style={{ fontSize: 10, color: C.gold, fontWeight: "800" }}>{lang === 'en' ? 'From $2.99/mo' : 'Desde $2.99/mes'}</Text>
          </View>
        </TouchableOpacity>
        {adLoaded && rewardedAd ? (
          <TouchableOpacity onPress={() => { try { rewardedAd.show(); } catch (e) { console.warn(e); } }}
            style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
            <Text style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}>📺  Ver Anuncio · Desbloquear 4h</Text>
          </TouchableOpacity>
        ) : adError ? (
          <TouchableOpacity onPress={() => { setAdError(false); rewardedAd?.load(); }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 12, borderWidth: 1, borderColor: C.rose + "50" }}>
            <Text style={{ fontSize: 10, color: C.rose, fontWeight: "600" }}>Sin anuncios disponibles. Reintentar</Text>
          </TouchableOpacity>
        ) : showFallback ? (
          <TouchableOpacity onPress={onUpgrade}
            style={{ paddingHorizontal: 20, paddingVertical: 9, backgroundColor: C.gold + "25", borderRadius: 12, borderWidth: 1, borderColor: C.gold + "60" }}>
            <Text style={{ fontSize: 11, color: C.gold, fontWeight: "800" }}>Suscribirse a Elite →</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
            <Ionicons name="hourglass-outline" size={11} color={C.t4} />
            <Text style={{ fontSize: 10, color: C.t4, fontWeight: "600" }}>Preparando acceso gratuito...</Text>
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
  const { user = {}, expenses = [], income = [], budgets = {}, reminders = [], streakDays = [] } = appState || {};
  const cur = user.currency || "RD$";

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", day: "" });
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

  const onSimulateAd = () => {
    const unlockTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    updateState({ user: { ...userRef.current, tempUnlock: unlockTime } });
    if (showAlert) showAlert("MODO DEV", "Has simulado un anuncio exitoso. Acceso desbloqueado por 4h.");
  };

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
    } catch (e) {
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
      } catch (e) { console.warn("Error checking premium status on load", e); }
    })();
  }, []);

  const totalInc = income.reduce((a, i) => a + i.amount, 0);
  const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
  const { total, grade } = score(expenses, totalInc, budgets, streakDays, []);
  const streak = calcStreak(streakDays);

  const { balEOM, dailyAvg, runOut, pctSpent } = predictMonthEnd(appState);

  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const upcoming = reminders.filter(r => r.active && r.paidMonth !== currentMonth).sort((a, b) => a.day - b.day);
  const daysThisMonth = (streakDays || []).filter(d => d.startsWith(currentMonth)).length;
  const consistency = Math.round((daysThisMonth / DAY) * 100);

  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
  const spentByCat = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>

      {/* ── CABECERA PREMIUM (Centrada) ───────────────────────────── */}
      <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
        <TouchableOpacity onPress={openSettings} style={{ position: "absolute", top: 20, right: 16, padding: 8, zIndex: 10 }}>
          <Ionicons name={ICON.settings} size={22} color={C.t3} />
        </TouchableOpacity>

        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1A1A1A", borderWidth: 2, borderColor: C.gold + "60", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: C.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10 }}>
          <Ionicons name={ICON.profile} size={34} color={C.gold} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 }}>
            {user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}
          </Text>
          {esPremium && (
            <View style={{ backgroundColor: C.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: "#000", textTransform: "uppercase" }}>
                {lang === 'en' ? "Elite User" : "Usuario Elite"}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="flame" size={16} color={C.orange} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.t2 }}>{streak} <Text style={{ color: C.t4, fontWeight: "500" }}>{lang === 'en' ? 'Days' : 'Días'}</Text></Text>
          </View>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.t4, opacity: 0.3 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="star" size={16} color={C.sky} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.t2 }}>{t.dash?.nivel || "Nivel"} <Text style={{ color: C.sky, fontWeight: "800" }}>{Math.max(1, Math.floor(streak / 7))}</Text></Text>
          </View>
        </View>

        {esPremium ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold + "15", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.gold + "40" }}>
            <Ionicons name="diamond" size={14} color={C.gold} />
            <Text style={{ fontSize: 11, fontWeight: "900", color: C.gold, letterSpacing: 1.5 }}>{t.premium?.titulo ? t.premium.titulo.toUpperCase() : "FYNX ELITE"}</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowPremium(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.t4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: C.t3, letterSpacing: 1 }}>{t.premium?.badgeGratis ? t.premium.badgeGratis.toUpperCase() : "FREE PLAN"}</Text>
            <Ionicons name="chevron-forward" size={12} color={C.t4} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 24 }}>

        {/* ── SCORE HERO (Social Score) ────────────────────────────── */}
        <FadeIn delay={60}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: C.t4, letterSpacing: 3, marginBottom: 16 }}>{t.perfil?.socialScore?.toUpperCase() || "SOCIAL SCORE"}</Text>

            <View style={{ width: 180, height: 180, alignItems: "center", justifyContent: "center" }}>
              {/* Outer Ring Glow */}
              <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: isFullyUnlocked ? "#4AFFE710" : "#FFFFFF05", borderWidth: 1, borderColor: isFullyUnlocked ? "#4AFFE740" : "#FFFFFF10" }} />

              <Svg width={160} height={160} viewBox="0 0 160 160" style={{ position: "absolute" }}>
                <Defs>
                  <RadialGradient id="scoreRad" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor={isFullyUnlocked ? "#4AFFE7" : C.t3} stopOpacity="0.2" />
                    <Stop offset="100%" stopColor={isFullyUnlocked ? "#4AFFE7" : C.t3} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="80" cy="80" r="70" fill="url(#scoreRad)" />
                <Circle cx="80" cy="80" r="70" stroke={isFullyUnlocked ? "#4AFFE7" : C.t4} strokeWidth="3" fill="transparent" strokeDasharray="300 100" strokeLinecap="round" />
              </Svg>

              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 48, fontWeight: "900", color: isFullyUnlocked ? "#4AFFE7" : C.t3, letterSpacing: -2 }}>
                  {isFullyUnlocked ? "TOP" : "--"}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: isFullyUnlocked ? "#FFFFFF" : C.t4, marginTop: -4 }}>
                  {isFullyUnlocked ? "15%" : (lang === 'en' ? "Locked" : "Bloqueado")}
                </Text>
              </View>
            </View>

            {!isFullyUnlocked && (
              <TouchableOpacity onPress={() => setShowPremium(true)} style={{ marginTop: -10, backgroundColor: C.gold + "20", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.gold + "50", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={ICON.lock} size={14} color={C.gold} />
                <Text style={{ fontSize: 11, fontWeight: "800", color: C.gold }}>{lang === 'en' ? "Unlock Ranking" : "Desbloquear Ranking"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </FadeIn>

        {/* ── STATS HUD ────────────────────────────────────────────── */}
        <FadeIn delay={120}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32, justifyContent: "center" }}>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="card-outline" size={18} color={C.rose} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{appState.debts?.length || 0}</Text>
              <Text style={{ fontSize: 8, color: C.t4, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Debts' : 'Deudas'}</Text>
            </View>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="flag-outline" size={18} color={C.mint} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{appState.goals?.filter(g => (g.current || g.saved) >= (g.target || g.amount)).length || 0}</Text>
              <Text style={{ fontSize: 8, color: C.t4, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Goals' : 'Metas'}</Text>
            </View>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="trending-up-outline" size={18} color={C.gold} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{totalInc > 0 ? Math.max(0, Math.round(((totalInc - totalExp) / totalInc) * 100)) : 0}%</Text>
              <Text style={{ fontSize: 8, color: C.t4, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Savings' : 'Ahorro'}</Text>
            </View>
          </View>
        </FadeIn>

        {/* ── CALL TO ACTION (PDF) ─────────────────────────────────── */}
        <FadeIn delay={180}>
          <View style={{ position: "relative" }}>
            <TouchableOpacity
              onPress={() => {
                if (!esPremium) setShowPremium(true);
                else {
                  showAlert(lang === 'en' ? "Generating PDF" : "Generando PDF", lang === 'en' ? "Preparing your Fynx Elite report..." : "Preparando tu reporte Fynx Elite...", [], "info");
                  try { generatePDF(appState, lang); } catch (e) { showAlert("Error", String(e.message || e), [], "error"); }
                }
              }}
              style={{ backgroundColor: esPremium ? C.gold + "15" : "#1A1A1A", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: esPremium ? C.gold + "50" : C.border2, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: esPremium ? C.gold : C.card3, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={esPremium ? "document-text" : "lock-closed"} size={24} color={esPremium ? "#000" : C.t3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: esPremium ? C.gold : C.t2, marginBottom: 4 }}>
                  {esPremium ? (lang === 'en' ? "Generate PDF Report" : "Generar Reporte PDF") : (lang === 'en' ? "Upgrade to Premium for Reports" : "Mejora a Premium para Reportes")}
                </Text>
                <Text style={{ fontSize: 12, color: C.t3, lineHeight: 18 }}>
                  {esPremium ? (lang === 'en' ? "Download a detailed analysis of your finances." : "Descarga un análisis detallado de tus finanzas.") : (lang === 'en' ? "Get quarterly professional summaries of your progress." : "Obtén resúmenes trimestrales profesionales de tu progreso.")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={esPremium ? C.gold : C.t4} />
            </TouchableOpacity>
            {!isFullyUnlocked && (
              <EliteLockOverlay
                description={lang === 'en' ? "Unlock Quarterly PDF Reports" : "Desbloquear Reportes PDF Trimestrales"}
                adLoaded={adLoaded} rewardedAd={rewardedAd} adError={adError} setAdError={setAdError} onUpgrade={() => setShowPremium(true)} userEmail={user.email} onSimulateAd={onSimulateAd} lang={lang}
              />
            )}
          </View>
        </FadeIn>

        {/* ── AD BANNER WRAPPED ELEGANTLY (PRD P2) ─────────────────── */}
        {!esPremium && (
          <View style={{ marginBottom: 30, backgroundColor: "#111", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", padding: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 9, color: C.t4, letterSpacing: 1.5, fontWeight: "600" }}>
                {lang === 'en' ? "ADVERTISEMENT" : "PUBLICIDAD"}
              </Text>
            </View>
            <AdBanner esPremium={esPremium} onUpgrade={() => setShowPremium(true)} />
          </View>
        )}
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
