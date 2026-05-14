import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal, Animated, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C, F } from "../constants/themes";
import { PremiumModal } from "../components/PremiumModal";
import { BudgetsModal } from "../components/BudgetsModal";
import { SocialLeaderboard } from "../components/SocialLeaderboard";
import { AdBanner } from "../components/AdBanner";
import { ICON } from "../constants";
import { money, DAY, DAYS_IN_MONTH } from "../utils/formatters";
import { score, calcStreak, predictMonthEnd } from "../utils/finance";
import { generateTarsInsight, ACHIEVEMENTS } from "../utils/nudges";
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

const EliteLockOverlay = ({ description, adLoaded, rewardedAd, adError, setAdError, onUpgrade, userEmail, onSimulateAd, lang, isTempUnlocked }) => {
  const [adTimeout, setAdTimeout] = React.useState(false);
  React.useEffect(() => {
    if (adLoaded) { setAdTimeout(false); return; }
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
        {isTempUnlocked ? (
          <TouchableOpacity onPress={onUpgrade}
            style={{ paddingHorizontal: 20, paddingVertical: 9, backgroundColor: C.gold + "25", borderRadius: 12, borderWidth: 1, borderColor: C.gold + "60" }}>
            <Text style={{ fontSize: 11, color: C.gold, fontWeight: "800", textAlign: "center" }}>
              {lang === 'en' ? "Full Subscription Required →" : "Requiere Suscripción Real →"}
            </Text>
          </TouchableOpacity>
        ) : adLoaded && rewardedAd ? (
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
  const [showBudgets, setShowBudgets] = useState(false);
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
  const [hasAutoTriggeredAd, setHasAutoTriggeredAd] = useState(false);

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

  useEffect(() => {
    if (adLoaded && !isFullyUnlocked && rewardedAd && !hasAutoTriggeredAd) {
      // Evitar que se triggeree múltiples veces
      setHasAutoTriggeredAd(true);
      // Dar un pequeño tiempo para que el usuario lea "Ganarás 4 horas..." en la barra de tiempo
      const t = setTimeout(() => {
        try {
          rewardedAd.show();
        } catch (e) {
          console.warn("Auto-trigger ad failed:", e);
        }
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [adLoaded, isFullyUnlocked, rewardedAd, hasAutoTriggeredAd]);

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
        setHasAutoTriggeredAd(false); // Resetear para el futuro cuando se agote
        if (showAlert) showAlert(lang === 'en' ? "Reward Earned!" : "¡Recompensa Obtenida!", lang === 'en' ? "You unlocked 4 hours of Fynx Elite." : "Has desbloqueado 4 horas de Fynx Elite.");
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

  const achievementsList = appState?.achievements || [];
  const lastAchievementId = achievementsList.length > 0 ? achievementsList[achievementsList.length - 1] : null;
  const lastAchievement = lastAchievementId ? Object.values(ACHIEVEMENTS).find(a => a.id === lastAchievementId) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={['top', 'left', 'right']}>

      {/* ── CABECERA PREMIUM (Estilo X / Banner) ───────────────────────────── */}
      <View style={{ marginBottom: 10 }}>
        {/* Banner Background */}
        <View style={{ 
          height: 100, 
          backgroundColor: C.gold + "10", 
          borderBottomWidth: 1.5, 
          borderBottomColor: C.gold, 
          position: "relative"
        }}>
          {/* Subtle overlay */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundColor: "#FFF" }} />
          
          <TouchableOpacity onPress={openSettings} style={{ position: "absolute", top: 16, right: 16, padding: 8, zIndex: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20 }}>
            <Ionicons name={ICON.settings} size={20} color={C.gold} />
          </TouchableOpacity>

          {/* Último Logro (En la portada) */}
          {lastAchievement && (
            <View style={{ 
              position: "absolute", bottom: 12, right: 16, 
              flexDirection: "row", alignItems: "center", gap: 6, 
              backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 6, 
              borderRadius: 20, borderWidth: 1, borderColor: C.gold + "40" 
            }}>
              <Ionicons name={lastAchievement.icon} size={14} color={C.gold} />
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.gold }}>
                {lastAchievement.title[lang] || lastAchievement.title.es}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Content (Overlapping) */}
        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <View>
              <TouchableOpacity onPress={pickImage} style={{ 
                width: 80, height: 80, borderRadius: 40, backgroundColor: C.card2, 
                overflow: "hidden", borderWidth: 3, borderColor: "#000", 
                alignItems: "center", justifyContent: "center" 
              }}>
                {user && user.photo ? (
                  <Image key={user.photo} source={{ uri: user.photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Ionicons name={ICON.profile} size={38} color={C.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImage} style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#111", borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 }}>
                <Ionicons name="camera" size={14} color={C.gold} />
              </TouchableOpacity>
            </View>

            {/* Premium Badge (Derecha) */}
            <View style={{ paddingBottom: 8 }}>
              {esPremium ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.gold + "40" }}>
                  <Ionicons name="diamond" size={12} color={C.gold} />
                  <Text style={{ fontSize: 10, fontWeight: "900", color: C.gold, letterSpacing: 1.5 }}>{t.premium?.titulo ? t.premium.titulo.toUpperCase() : "ELITE"}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setShowPremium(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.t4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: C.t3, letterSpacing: 1 }}>{t.premium?.badgeGratis ? t.premium.badgeGratis.toUpperCase() : "FREE"}</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.t4} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Nombre */}
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5, marginBottom: 12 }}>
            {user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}
          </Text>

          {/* Racha & Nivel */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
                 <Animated.View style={{ position: "absolute", transform: [{ scale: flameAnim3 }], opacity: 0.3 }}>
                   <Ionicons name="flame" size={24} color="#FF4500" />
                 </Animated.View>
                 <Animated.View style={{ position: "absolute", transform: [{ scale: flameAnim2 }], opacity: 0.6 }}>
                   <Ionicons name="flame" size={20} color={C.orange} />
                 </Animated.View>
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

          {/* Barra de Progreso de Nivel */}
          <View style={{ width: "100%", marginBottom: 8 }}>
            <View style={{ height: 6, backgroundColor: "#1A1A1A", borderRadius: 3, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
              <View style={{ width: `${levelProgress * 100}%`, height: "100%", backgroundColor: C.sky, borderRadius: 3 }} />
            </View>
            <Text style={{ fontSize: 10, color: C.t3, marginTop: 6, fontWeight: "700" }}>
              {lang === 'en' ? `Level ${level} → Level ${level + 1}: ${daysNeeded} more days` : `Nivel ${level} → Nivel ${level + 1}: faltan ${daysNeeded} días`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 24 }}>

        <FadeIn delay={100}>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}>
            <View style={{ flex: 1, backgroundColor: C.card2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Ionicons name="pie-chart" size={22} color={C.rose} />
                <Text style={{ fontSize: 16, color: C.t1, fontFamily: F.monoB }}>{expenses.length || 0}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.t3, marginTop: 12, fontFamily: F.sansM, textTransform: "uppercase" }}>{lang === 'en' ? "Expenses" : "Gastos"}</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: C.card2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Ionicons name="trending-up" size={22} color={C.mint} />
                <Text style={{ fontSize: 16, color: C.t1, fontFamily: F.monoB }}>{income.length || 0}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.t3, marginTop: 12, fontFamily: F.sansM, textTransform: "uppercase" }}>{lang === 'en' ? "Income" : "Ingresos"}</Text>
            </View>

            <TouchableOpacity onPress={() => setShowBudgets(true)} style={{ flex: 1, backgroundColor: C.card2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.gold + "50" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Ionicons name="calculator" size={22} color={C.gold} />
                <Text style={{ fontSize: 16, color: C.t1, fontFamily: F.monoB }}>{Object.keys(budgets).length}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.gold, marginTop: 12, fontFamily: F.sansM, textTransform: "uppercase" }}>{lang === 'en' ? "Budgets" : "Presup"}</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* ── BARRA DE TIEMPO (ELITE TEMPORAL) ────────────────────── */}
        <FadeIn delay={10}>
          <View style={{ marginBottom: 32, padding: 18, backgroundColor: "rgba(10,10,10,0.8)", borderRadius: 20, borderWidth: 1, borderColor: isFullyUnlocked ? C.gold + "50" : C.border2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="time" size={20} color={isFullyUnlocked ? C.gold : C.t3} />
                <Text style={{ fontSize: 12, fontWeight: "900", color: isFullyUnlocked ? C.gold : C.t2, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {lang === 'en' ? "Elite Time Bar" : "Barra de Tiempo Elite"}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFF", fontVariant: ['tabular-nums'] }}>
                {isFullyUnlocked ? (esPremium ? "∞" : formatTimeLeft(timeLeft)) : "00:00:00"}
              </Text>
            </View>

            <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
              <Animated.View style={{ width: esPremium ? "100%" : `${Math.min(100, Math.max(0, (timeLeft / (4 * 60 * 60 * 1000)) * 100))}%`, height: "100%", backgroundColor: isFullyUnlocked ? C.gold : C.t4 }} />
            </View>

            {!isFullyUnlocked ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: C.t2, flex: 1, marginRight: 16, lineHeight: 16 }}>
                  {adLoaded && !hasAutoTriggeredAd 
                    ? (lang === 'en' ? "🎁 Preparing your reward... You will win 4 hours of Fynx Elite automatically." : "🎁 Preparando tu recompensa... Ganarás 4 horas de Fynx Elite automáticamente.")
                    : adLoaded
                    ? (lang === 'en' ? "You can claim 4 more hours right now." : "Puedes reclamar 4 horas más ahora mismo.")
                    : adError
                    ? (lang === 'en' ? "Failed to load ad." : "No se pudo cargar el anuncio.")
                    : (lang === 'en' ? "Loading your next reward..." : "Cargando tu próxima recompensa...")}
                </Text>
                {adLoaded && hasAutoTriggeredAd && (
                  <TouchableOpacity onPress={() => rewardedAd?.show()} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.gold + "20", borderRadius: 8, borderWidth: 1, borderColor: C.gold + "50" }}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: C.gold }}>{lang === 'en' ? "CLAIM" : "RECLAMAR"}</Text>
                  </TouchableOpacity>
                )}
                {(!adLoaded || adError) && (
                  <TouchableOpacity onPress={onSimulateAd} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
                    <Text style={{ fontSize: 9, fontWeight: "900", color: C.t2 }}>{lang === 'en' ? "SIMULATE" : "SIMULAR"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: C.t3 }}>
                {esPremium 
                  ? (lang === 'en' ? "You have unlimited access to all Fynx Elite features." : "Tienes acceso ilimitado a todas las funciones de Fynx Elite.") 
                  : (lang === 'en' ? "You have temporary access. Make the most of your Elite tools!" : "Tienes acceso temporal. ¡Aprovecha tus herramientas Elite al máximo!")}
              </Text>
            )}
          </View>
        </FadeIn>

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
                      : (lang === 'en' ? `Better than ${100 - (esPremium ? 15 : 0)}% of users` : `Mejor que el ${100 - (esPremium ? 15 : 0)}% de usuarios`)}
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

        {/* ── SOCIAL SCORE (Gamified Lock) - HORIZONTAL REDESIGN ────────────────────────────── */}
        <FadeIn delay={60}>
          <View style={{ marginBottom: 32, backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: esPremium ? "#4AFFE740" : "rgba(255,255,255,0.05)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: C.t2, letterSpacing: 2 }}>{t.perfil?.socialScore?.toUpperCase() || "SOCIAL SCORE"}</Text>
              <Ionicons name="globe-outline" size={18} color={esPremium ? "#4AFFE7" : C.gold} />
            </View>

            {!esPremium ? (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <View style={{ width: "100%", height: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
                  <View style={{ width: "45%", height: "100%", backgroundColor: C.gold, opacity: 0.3 }} />
                </View>
                <Ionicons name="lock-closed" size={32} color={C.gold} style={{ marginBottom: 12 }} />
                <TouchableOpacity onPress={() => setShowPremium(true)} style={{ backgroundColor: C.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#000" }}>{lang === 'en' ? "REVEAL RANKING" : "REVELAR RANKING"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 11, color: C.t3, marginBottom: 4, fontFamily: F.mono }}>{lang === 'en' ? "YOUR POSITION" : "TU POSICIÓN"}</Text>
                    <Text style={{ fontSize: 36, fontWeight: "900", color: "#4AFFE7", letterSpacing: -1, lineHeight: 36 }}>TOP 15%</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: C.t3, marginBottom: 4, fontFamily: F.mono }}>SCORE</Text>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFF", lineHeight: 28 }}>{Math.round(total)} <Text style={{ fontSize: 14, color: C.t3 }}>pts</Text></Text>
                  </View>
                </View>

                {/* Horizontal Progress Bar */}
                <View style={{ width: "100%", height: 16, backgroundColor: "#000", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 20 }}>
                  <View style={{ width: "85%", height: "100%", backgroundColor: "#4AFFE7", borderRadius: 8, shadowColor: "#4AFFE7", shadowRadius: 10, shadowOpacity: 0.8, elevation: 5 }} />
                </View>

                <FadeIn delay={200}>
                  <SocialLeaderboard userScore={Math.round(total)} />
                </FadeIn>
              </View>
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
              <Ionicons name="flame-outline" size={18} color={C.rose} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFF" }}>{calcStreak(appState.streakDays || [])}</Text>
              <Text style={{ fontSize: 8, color: C.t2, fontWeight: "800", letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>{lang === 'en' ? 'Streak' : 'Racha'}</Text>
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
              {Object.values(ACHIEVEMENTS).map((ach, i) => {
                const active = achievementsList.includes(ach.id);
                return (
                  <TouchableOpacity key={i} onPress={() => setSelectedBadge({
                    icon: ach.icon,
                    label: ach.title[lang] || ach.title.es,
                    desc: ach.desc[lang] || ach.desc.es,
                    color: ach.color || C.gold,
                    active
                  })} style={{ width: 84, height: 100, borderRadius: 16, backgroundColor: "#151515", borderWidth: 1, borderColor: active ? (ach.color || C.gold) + "40" : "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", opacity: active ? 1 : 0.6 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: active ? (ach.color || C.gold) + "15" : "rgba(255,255,255,0.02)", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Ionicons name={ach.icon} size={22} color={active ? (ach.color || C.gold) : "#333"} />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: active ? C.t2 : C.t4, textAlign: "center", textTransform: "uppercase" }}>{ach.title[lang] || ach.title.es}</Text>
                  </TouchableOpacity>
                );
              })}
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
            {!esPremium && (
              <EliteLockOverlay
                description={lang === 'en' ? "Professional Financial Audits" : "Auditorías Financieras Profesionales"}
                adLoaded={adLoaded} rewardedAd={rewardedAd} adError={adError} setAdError={setAdError} onUpgrade={() => setShowPremium(true)} userEmail={user.email} onSimulateAd={onSimulateAd} lang={lang} isTempUnlocked={isTempUnlocked}
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
      {/* Modales */}
      {showPremium && <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />}
      {showBudgets && <BudgetsModal visible={showBudgets} onClose={() => setShowBudgets(false)} />}
    </SafeAreaView>
  );
}
