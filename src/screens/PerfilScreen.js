import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal, Animated, Image } from "react-native";
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
import { generateTarsInsight } from "../utils/nudges";
import { Bar, Btn, Input, FadeIn } from "../components/base";
import { BlurView } from "expo-blur";
import { usePostHog } from 'posthog-react-native';
import { generatePDF } from "../services/pdfGenerator";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
          <Ionicons name="diamond" size={24} color={C.gold} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: "900", color: C.gold, letterSpacing: 1 }}>{lang === 'en' ? 'Fynx Elite' : 'Fynx Elite'}</Text>
          {!!description && (
            <Text style={{ fontSize: 11, color: C.t2, textAlign: "center", marginTop: 4, lineHeight: 16, maxWidth: 220 }}>{description}</Text>
          )}
        </TouchableOpacity>
        {adLoaded && rewardedAd ? (
          <TouchableOpacity onPress={() => { try { rewardedAd.show(); } catch (e) { console.warn(e); } }}
            style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
            <Text style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}>
              {lang === 'en' ? "📺 Watch Ad · Unlock 4h" : "📺 Ver Anuncio · Desbloquear 4h"}
            </Text>
          </TouchableOpacity>
        ) : adError ? (
          <TouchableOpacity onPress={() => { setAdError(false); rewardedAd?.load(); }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 12, borderWidth: 1, borderColor: C.rose + "50" }}>
            <Text style={{ fontSize: 10, color: C.rose, fontWeight: "600" }}>
              {lang === 'en' ? "No ads available. Retry" : "Sin anuncios disponibles. Reintentar"}
            </Text>
          </TouchableOpacity>
        ) : showFallback ? (
          <TouchableOpacity onPress={onUpgrade}
            style={{ paddingHorizontal: 20, paddingVertical: 9, backgroundColor: C.gold + "25", borderRadius: 12, borderWidth: 1, borderColor: C.gold + "60" }}>
            <Text style={{ fontSize: 11, color: C.gold, fontWeight: "800" }}>
              {lang === 'en' ? "Subscribe to Elite →" : "Suscribirse a Elite →"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
            <Ionicons name="hourglass-outline" size={11} color={C.t3} />
            <Text style={{ fontSize: 10, color: C.t3, fontWeight: "600" }}>
              {lang === 'en' ? "Preparing free access..." : "Preparando acceso gratuito..."}
            </Text>
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

  // Animaciones
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const flameAnim1 = useRef(new Animated.Value(1)).current;
  const flameAnim2 = useRef(new Animated.Value(1)).current;
  const flameAnim3 = useRef(new Animated.Value(1)).current;
  
  const [showLogic, setShowLogic] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, tempUnlock - Date.now()));

  const userRef = React.useRef(user);
  userRef.current = user;

  const onSimulateAd = () => {
    const unlockTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    updateState({ user: { ...userRef.current, tempUnlock: unlockTime } });
    if (showAlert) showAlert(lang === 'en' ? "DEV MODE" : "MODO DEV", lang === 'en' ? "Simulated successful ad. Access unlocked for 4h." : "Has simulado un anuncio exitoso. Acceso desbloqueado por 4h.");
  };

  const pickImage = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(lang === 'en' ? 'Permission Denied' : 'Permiso Denegado', lang === 'en' ? 'Sorry, we need camera roll permissions to make this work!' : '¡Lo sentimos, necesitamos permisos de la galería para que esto funcione!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        updateState({ user: { ...user, photo: result.assets[0].uri } });
      }
    } catch (e) {
      console.warn("Error picking image:", e);
      Alert.alert(lang === 'en' ? "Module Error" : "Error de Módulo", lang === 'en' ? "The image selector is being configured. Please restart the app." : "El selector de imágenes se está configurando. Por favor reinicia la app.");
    }
  };

  useEffect(() => {
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

  useEffect(() => {
    try {
      const { RewardedInterstitialAd, RewardedAdEventType, TestIds } = require("react-native-google-mobile-ads");
      // PRD: Migración a Intersticial Recompensado para mejor Match Rate
      const adUnitId = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : "ca-app-pub-4592841309124858/6050727008";
      const ad = RewardedInterstitialAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdLoaded(true);
        setAdError(false);
      });
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log("User earned reward: ", reward);
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
        console.warn("Rewarded Interstitial failed: ", error);
        setAdLoaded(false);
        setAdError(true);
      });

      ad.load();
      setRewardedAd(ad);

      return () => { unsubLoaded(); unsubEarned(); unsubClosed(); unsubError(); };
    } catch (e) {
      console.warn("Rewarded Interstitial ads disabled", e);
    }
  }, []);

  const totalInc = income.reduce((a, i) => a + i.amount, 0);
  const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
  const { total, grade } = score(expenses, totalInc, budgets, streakDays, [], lang);
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

  // ── LÓGICA DE ADN FINANCIERO ──────────────────────────────
  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;
  const isOverBud = Object.entries(budgets).some(([k, v]) => (spentByCat[k] || 0) > v);
  const dna = savingsRate > 30 ? { label: lang === 'en' ? "SAVER" : "AHORRADOR", color: C.green, icon: "leaf", desc: lang === 'en' ? "Your priority is your future." : "Tu prioridad es tu futuro." }
            : isOverBud ? { label: lang === 'en' ? "IMPULSIVE" : "IMPULSIVO", color: C.rose, icon: "flash", desc: lang === 'en' ? "Watch out for emotional spending." : "Cuidado con los gastos emocionales." }
            : appState.debts?.length > 0 ? { label: lang === 'en' ? "STRATEGIST" : "ESTRATEGA", color: C.sky, icon: "shield-half", desc: lang === 'en' ? "Focused on clearing the path." : "Enfocado en limpiar el camino." }
            : { label: lang === 'en' ? "BALANCED" : "EQUILIBRADO", color: C.gold, icon: "infinite", desc: lang === 'en' ? "Stability is your strong point." : "La estabilidad es tu fuerte." };

  const level = Math.max(1, Math.floor(streak / 7) + 1);
  const nextLevelStreak = level * 7;
  const daysNeeded = nextLevelStreak - streak;
  const levelProgress = (streak % 7) / 7;

  useEffect(() => {
    Animated.timing(scoreAnim, { toValue: total / 100, duration: 1500, useNativeDriver: false }).start();
    
    // Fuego multinivel (Efecto flicker)
    const flicker = (anim, to, dur) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: to, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    };

    flicker(flameAnim1, 1.15, 600);
    flicker(flameAnim2, 1.3, 400);
    flicker(flameAnim3, 1.5, 300);
  }, [total]);

  useEffect(() => {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>

      {/* ── CABECERA PREMIUM (Centrada) ───────────────────────────── */}
      <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
        <TouchableOpacity onPress={openSettings} style={{ position: "absolute", top: 20, right: 16, padding: 8, zIndex: 10 }}>
          <Ionicons name={ICON.settings} size={22} color={C.t3} />
        </TouchableOpacity>

        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity onPress={pickImage} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "#1A1A1A", borderWidth: 2, borderColor: C.gold + "60", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {user && user.photo ? (
              <Image source={{ uri: user.photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Ionicons name={ICON.profile} size={38} color={C.gold} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: "#111", borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 }}>
            <Ionicons name="camera" size={14} color={C.gold} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 }}>
            {user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
               {/* Capa 1: Brillo exterior */}
               <Animated.View style={{ position: "absolute", transform: [{ scale: flameAnim3 }], opacity: 0.3 }}>
                 <Ionicons name="flame" size={24} color="#FF4500" />
               </Animated.View>
               {/* Capa 2: Fuego medio */}
               <Animated.View style={{ position: "absolute", transform: [{ scale: flameAnim2 }], opacity: 0.6 }}>
                 <Ionicons name="flame" size={20} color={C.orange} />
               </Animated.View>
               {/* Capa 3: Núcleo ardiente */}
               <Animated.View style={{ transform: [{ scale: flameAnim1 }] }}>
                 <Ionicons name="flame" size={16} color={C.gold} />
               </Animated.View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "900", color: C.t1 }}>{streak} <Text style={{ color: C.t3, fontWeight: "500", fontSize: 12 }}>{lang === 'en' ? 'Days' : 'Días'}</Text></Text>
          </View>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.t3, opacity: 0.3 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="star" size={18} color={C.sky} />
            <Text style={{ fontSize: 16, fontWeight: "900", color: C.t1 }}>{t.dash?.nivel || "Nivel"} <Text style={{ color: C.sky, fontWeight: "900" }}>{level}</Text></Text>
          </View>
        </View>

        {/* Level Progress Bar */}
        <View style={{ width: "80%", marginBottom: 16 }}>
          <View style={{ height: 6, backgroundColor: "#1A1A1A", borderRadius: 3, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
            <View style={{ width: `${levelProgress * 100}%`, height: "100%", backgroundColor: C.sky, borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 10, color: C.t3, textAlign: "center", marginTop: 6, fontWeight: "700" }}>
            {lang === 'en' ? `Level ${level} → Level ${level + 1}: ${daysNeeded} more days` : `Nivel ${level} → Nivel ${level + 1}: faltan ${daysNeeded} días`}
          </Text>
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

        {/* ── HERO SCORE ────────────────────────────── */}
        <FadeIn delay={20}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
             <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
               {/* Glow effect */}
               <View style={{ position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: grade.color + "15", blurRadius: 40 }} />
               
               <Svg width={220} height={220} viewBox="0 0 220 220">
                 <Circle cx="110" cy="110" r="95" stroke="#1A1A1A" strokeWidth="12" fill="transparent" />
                 <AnimatedCircle
                   cx="110" cy="110" r="95"
                   stroke={grade.color} strokeWidth="12" fill="transparent"
                   strokeDasharray={`${2 * Math.PI * 95}`}
                   strokeDashoffset={scoreAnim.interpolate({
                     inputRange: [0, 1],
                     outputRange: [2 * Math.PI * 95, 0]
                   })}
                   strokeLinecap="round"
                   transform="rotate(-90 110 110)"
                 />
               </Svg>
               
               <View style={{ position: "absolute", alignItems: "center", width: 170 }}>
                  <Text style={{ fontSize: 52, fontWeight: "900", color: "#FFF", letterSpacing: -2 }}>{total}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: grade.color, marginTop: -4, textTransform: "uppercase", letterSpacing: 2, textAlign: "center" }}>
                    {grade.label}
                  </Text>
                  <Text style={{ fontSize: 8.5, fontWeight: "700", color: C.t2, marginTop: 6, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", lineHeight: 12 }}>
                    {(appState?.globalStats?.totalUsers || 45) < 100 
                      ? (lang === 'en' ? "Be among the first to build your ranking" : "Sé de los primeros en construir tu ranking")
                      : (lang === 'en' ? `Better than ${100 - (isFullyUnlocked ? 15 : 0)}% of users` : `Mejor que el ${100 - (isFullyUnlocked ? 15 : 0)}% de usuarios`)}
                  </Text>
                </View>
             </View>
             <TouchableOpacity onPress={() => setShowLogic(true)} style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: C.t3, letterSpacing: 2 }}>{lang === 'en' ? "FINANCIAL SCORE" : "SCORE FINANCIERO"}</Text>
                <Ionicons name="information-circle-outline" size={14} color={C.t3} />
             </TouchableOpacity>
          </View>
        </FadeIn>

        {/* ── TARS INTELLIGENCE (Insight) ─────────────────────────── */}
        <FadeIn delay={40}>
          <TouchableOpacity activeOpacity={0.9} style={{ marginBottom: 24, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(184, 134, 11, 0.4)" }}>
            <BlurView intensity={30} tint="dark" style={{ backgroundColor: "#111111", padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(184, 134, 11, 0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(184, 134, 11, 0.3)" }}>
                  <Ionicons name="bulb" size={16} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: C.gold, letterSpacing: 1.5, textTransform: "uppercase" }}>TARS INTELLIGENCE</Text>
                  <Text style={{ fontSize: 12, color: C.t2, marginTop: 2, fontStyle: "italic", lineHeight: 18 }}>
                    "{generateTarsInsight(appState, { totalInc, totalExp, balance: totalInc - totalExp, sc: total }, lang)}"
                  </Text>
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </FadeIn>

        {/* ── SOCIAL SCORE (Gamified Lock) ────────────────────────────── */}
        <FadeIn delay={60}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.t3, letterSpacing: 3 }}>{t.perfil?.socialScore?.toUpperCase() || "SOCIAL SCORE"}</Text>
            </View>

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
                <Circle cx="80" cy="80" r="70" stroke={isFullyUnlocked ? "#4AFFE7" : C.t3} strokeWidth="3" fill="transparent" strokeDasharray="300 100" strokeLinecap="round" />
              </Svg>

              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {!isFullyUnlocked ? (
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.gold + "30" }}>
                     <Ionicons name="lock-closed" size={38} color={C.gold} />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 44, fontWeight: "900", color: "#4AFFE7", letterSpacing: -2 }}>TOP</Text>
                    <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF", marginTop: -4 }}>15%</Text>
                  </>
                )}
              </View>
            </View>

            {!isFullyUnlocked && (
              <TouchableOpacity onPress={() => setShowPremium(true)} style={{ marginTop: -10, backgroundColor: C.gold + "20", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.gold + "50", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={ICON.lock} size={14} color={C.gold} />
                <Text style={{ fontSize: 11, fontWeight: "800", color: C.gold }}>{lang === 'en' ? "Reveal Ranking" : "Revelar Ranking"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </FadeIn>

        {/* ── STATS HUD ────────────────────────────────────────────── */}
        <FadeIn delay={150}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32, justifyContent: "center" }}>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="card-outline" size={18} color={C.rose} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{appState.debts?.length || 0}</Text>
              <Text style={{ fontSize: 8, color: C.t2, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Debts' : 'Deudas'}</Text>
            </View>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="flag-outline" size={18} color={C.mint} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{appState.goals?.filter(g => (g.current || g.saved) >= (g.target || g.amount)).length || 0}</Text>
              <Text style={{ fontSize: 8, color: C.t2, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Goals' : 'Metas'}</Text>
            </View>
            <View style={{ width: "30%", backgroundColor: "#151515", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" }}>
              <Ionicons name="trending-up-outline" size={18} color={C.gold} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{totalInc > 0 ? Math.max(0, Math.round(((totalInc - totalExp) / totalInc) * 100)) : 0}%</Text>
              <Text style={{ fontSize: 8, color: C.t2, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Savings' : 'Ahorro'}</Text>
            </View>
          </View>
        </FadeIn>

        {/* ── SECCIÓN MEDALLAS (Gamer Vibes) ─────────────────────────── */}
        <FadeIn delay={180}>
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.t3, letterSpacing: 1.5 }}>{lang === 'en' ? "BADGES & ACHIEVEMENTS" : "MEDALLAS Y LOGROS"}</Text>
              <Ionicons name="trophy" size={14} color={C.gold} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
              {[
                { id: 'streak_7', icon: "shield-checkmark", color: C.mint, label: lang === 'en' ? "Disciplined" : "Disciplinado", active: streak >= 7, desc: lang === 'en' ? "Your dedication is clear. You logged your finances for 7 days straight." : "Tu dedicación es clara. Registraste tus finanzas durante 7 días seguidos.", condition: lang === 'en' ? "Register expenses 7 days in a row." : "Registra gastos 7 días seguidos." },
                { id: 'streak_30', icon: "flame", color: C.orange, label: lang === 'en' ? "Unstoppable" : "Imparable", active: streak >= 30, desc: lang === 'en' ? "Elite level consistency. 30 days of financial control." : "Consistencia nivel Élite. 30 días de control financiero.", condition: lang === 'en' ? "Reach a 30-day streak." : "Alcanza una racha de 30 días." },
                { id: 'investor', icon: "wallet", color: C.gold, label: lang === 'en' ? "Investor" : "Inversionista", active: totalInc > 0, desc: lang === 'en' ? "You registered your first income. The first step towards wealth." : "Registraste tu primer ingreso. El primer paso hacia la riqueza.", condition: lang === 'en' ? "Log your first income." : "Registra tu primer ingreso." },
                { id: 'architect', icon: "construct", color: C.sky, label: lang === 'en' ? "Architect" : "Arquitecto", active: Object.keys(budgets || {}).length >= 3, desc: lang === 'en' ? "Structure is power. You defined 3 or more budgets." : "La estructura es poder. Definiste 3 o más presupuestos.", condition: lang === 'en' ? "Create 3+ budgets." : "Crea 3+ presupuestos." },
                { id: 'killer', icon: "skull", color: C.rose, label: lang === 'en' ? "Debt Killer" : "Caza Deudas", active: (appState.debts || []).length > 0, desc: lang === 'en' ? "Facing your debts is the bravest step. You started your plan." : "Enfrentar tus deudas es el paso más valiente. Iniciaste tu plan.", condition: lang === 'en' ? "Register your first debt." : "Registra tu primera deuda." },
                { id: 'saver', icon: "leaf", color: C.green, label: lang === 'en' ? "Master Saver" : "Ahorrador", active: savingsRate >= 30, desc: lang === 'en' ? "Impressive! You are saving more than 30% of your income." : "¡Impresionante! Estás ahorrando más del 30% de tus ingresos.", condition: lang === 'en' ? "Reach a 30% savings rate." : "Alcanza una tasa de ahorro del 30%." },
                { id: 'visionary', icon: "eye", color: C.violet, label: lang === 'en' ? "Visionary" : "Visionario", active: (reminders || []).length >= 3, desc: lang === 'en' ? "Nothing escapes you. 3 or more active payment reminders." : "Nada se te escapa. 3 o más recordatorios de pago activos.", condition: lang === 'en' ? "Add 3+ reminders." : "Añade 3+ recordatorios." },
                { id: 'analyst', icon: "bar-chart", color: "#A855F7", label: lang === 'en' ? "Analyst" : "Analista", active: esPremium, desc: lang === 'en' ? "Data-driven decisions. You unlocked professional reports." : "Decisiones basadas en datos. Desbloqueaste reportes profesionales.", condition: lang === 'en' ? "Generate an Elite PDF report." : "Genera un reporte PDF Élite." },
                { id: 'ai', icon: "mic", color: "#F472B6", label: lang === 'en' ? "AI Powered" : "Voz TARS", active: true, desc: lang === 'en' ? "You are using the future. AI-powered voice commands." : "Estás usando el futuro. Comandos de voz con IA.", condition: lang === 'en' ? "Use TARS voice input." : "Usa la entrada de voz TARS." },
                { id: 'elite', icon: "ribbon", color: C.gold, label: lang === 'en' ? "Fynx Elite" : "Fynx Elite", active: esPremium, desc: lang === 'en' ? "The highest rank. You are part of the 1%." : "El rango más alto. Eres parte del 1%.", condition: lang === 'en' ? "Active Elite subscription." : "Suscripción Elite activa." },
              ].map((badge, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedBadge(badge)} style={{ width: 84, height: 100, borderRadius: 16, backgroundColor: "#151515", borderWidth: 1, borderColor: badge.active ? badge.color + "40" : "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: badge.active ? badge.color + "15" : "rgba(255,255,255,0.02)", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Ionicons name={badge.icon} size={22} color={badge.active ? badge.color : "#333"} />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: badge.active ? C.t2 : C.t4, textAlign: "center", textTransform: "uppercase" }}>{badge.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                  {esPremium ? (lang === 'en' ? "Professional Financial Reports" : "Reportes Financieros Profesionales") : (lang === 'en' ? "Elite Financial Audits" : "Auditorías Financieras Élite")}
                </Text>
                <Text style={{ fontSize: 12, color: C.t3, lineHeight: 18 }}>
                  {esPremium ? (lang === 'en' ? "Download your deep-dive financial analysis. Professional, visual, and ready for your records." : "Descarga tu análisis financiero profundo. Profesional, visual y listo para tus registros.") : (lang === 'en' ? "Unlock quarterly professional summaries. Perfect for your bank or personal accountant." : "Desbloquea resúmenes profesionales trimestrales. Ideal para tu banco o contador personal.")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={esPremium ? C.gold : C.t3} />
            </TouchableOpacity>
            {!isFullyUnlocked && (
              <EliteLockOverlay
                description={lang === 'en' ? "Professional Financial Audits" : "Auditorías Financieras Profesionales"}
                adLoaded={adLoaded} rewardedAd={rewardedAd} adError={adError} setAdError={setAdError} onUpgrade={() => setShowPremium(true)} userEmail={user.email} onSimulateAd={onSimulateAd} lang={lang}
              />
            )}
          </View>
        </FadeIn>

        {/* Separador sutil */}
        {!esPremium && <View style={{ height: 40 }} />}

        {/* ── AD BANNER ─────────────────── */}
        {!esPremium && (
          <View style={{ marginBottom: 30 }}>
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

      <Modal visible={showLogic} transparent animationType="fade" onRequestClose={() => setShowLogic(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 24 }}>
          <BlurView intensity={20} tint="dark" style={{ backgroundColor: "#111", borderRadius: 24, borderWidth: 1, borderColor: C.gold + "30", padding: 24, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: C.gold }}>{lang === 'en' ? "Fynx Methodology" : "Metodología Fynx"}</Text>
              <TouchableOpacity onPress={() => setShowLogic(false)}>
                <Ionicons name="close" size={24} color={C.t3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFF", marginBottom: 12 }}>📊 {lang === 'en' ? "The Score (1-100)" : "El Score (1-100)"}</Text>
                <Text style={{ fontSize: 13, color: C.t2, lineHeight: 20 }}>
                  {lang === 'en' 
                    ? "Your score is a weighted index of 4 key pillars:" 
                    : "Tu puntaje es un índice ponderado de 4 pilares clave:"}
                </Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text style={{ fontSize: 12, color: C.t2 }}>• <Text style={{ color: C.green, fontWeight: "700" }}>{lang === 'en' ? "Savings (40%):" : "Ahorro (40%):"}</Text> {lang === 'en' ? "How much capital you retain." : "Cuánto capital retienes de lo que ganas."}</Text>
                  <Text style={{ fontSize: 12, color: C.t2 }}>• <Text style={{ color: C.gold, fontWeight: "700" }}>{lang === 'en' ? "Discipline (30%):" : "Disciplina (30%):"}</Text> {lang === 'en' ? "Adherence to your budgets." : "Cumplimiento de tus presupuestos."}</Text>
                  <Text style={{ fontSize: 12, color: C.t2 }}>• <Text style={{ color: C.mint, fontWeight: "700" }}>{lang === 'en' ? "Consistency (20%):" : "Constancia (20%):"}</Text> {lang === 'en' ? "Consecutive days of logging." : "Días consecutivos de registro."}</Text>
                  <Text style={{ fontSize: 12, color: C.t2 }}>• <Text style={{ color: C.sky, fontWeight: "700" }}>{lang === 'en' ? "Stability (10%):" : "Estabilidad (10%):"}</Text> {lang === 'en' ? "Debt health index." : "Índice de salud de tus deudas."}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFF", marginBottom: 12 }}>🔮 {lang === 'en' ? "Predictions" : "Predicciones"}</Text>
                <Text style={{ fontSize: 13, color: C.t2, lineHeight: 20 }}>
                  {lang === 'en'
                    ? "TARS calculates your Daily Burn Rate. If your spending speed exceeds your available liquidity, Fynx projects the exact day you might run out of funds."
                    : "TARS calcula tu Velocidad de Quema diaria. Si tu ritmo de gasto supera tu liquidez disponible, Fynx proyecta el día exacto en que podrías quedarte sin fondos."}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowLogic(false)} style={{ backgroundColor: C.gold, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 24 }}>
                <Text style={{ fontWeight: "900", color: "#000" }}>{lang === 'en' ? "Understood" : "Entendido"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#111", borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: selectedBadge?.color + "40", maxWidth: 300 }}>
             <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedBadge?.color + "15", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name={selectedBadge?.icon} size={32} color={selectedBadge?.color} />
             </View>
             <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF", marginBottom: 8, textTransform: "uppercase" }}>{selectedBadge?.label}</Text>
             <Text style={{ fontSize: 13, color: C.t2, textAlign: "center", lineHeight: 20, marginBottom: 8 }}>
               {selectedBadge?.active ? selectedBadge?.desc : selectedBadge?.condition}
             </Text>
             {!selectedBadge?.active && (
               <Text style={{ fontSize: 11, color: C.t3, textAlign: "center", fontStyle: "italic", marginBottom: 24 }}>
                 {lang === 'en' ? "Keep going to unlock this achievement!" : "¡Sigue adelante para desbloquear este logro!"}
               </Text>
             )}
             <TouchableOpacity onPress={() => setSelectedBadge(null)} style={{ backgroundColor: selectedBadge?.active ? selectedBadge.color : "rgba(255,255,255,0.05)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, width: "100%", alignItems: "center", borderWidth: selectedBadge?.active ? 0 : 1, borderColor: "rgba(255,255,255,0.1)" }}>
                <Text style={{ fontWeight: "900", color: selectedBadge?.active ? "#000" : C.t3 }}>
                  {selectedBadge?.active ? (lang === 'en' ? "UNLOCKED" : "DESBLOQUEADO") : (lang === 'en' ? "LOCKED" : "BLOQUEADO")}
                </Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
