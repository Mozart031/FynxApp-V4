import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal, Animated, Image, TextInput, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { WeeklySummaryModal } from "../components/WeeklySummaryModal";
import { TarsGuideModal } from "../components/TarsGuideModal";
import { RankingModal } from "../components/RankingModal";
import { TourOnboarding } from "../components/TourOnboarding";
import { updateFynxWidgetLocal } from "../../widget-task";
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
  const prevAdLoadedRef = React.useRef(adLoaded);
  if (adLoaded && !prevAdLoadedRef.current) {
    setAdTimeout(false);
  }
  prevAdLoadedRef.current = adLoaded;
  React.useEffect(() => {
    if (adLoaded) return;
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
              {lang === 'en' ? "Watch Ad - Unlock 4h" : "Ver Anuncio - Desbloquear 4h"}
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
              {lang === 'en' ? "Subscribe to Elite" : "Suscribirse a Elite"}
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

export function PerfilScreen({ openSettings, setTab, onStartTour, onOpenReport }) {
  const { appState, updateState } = useFinance();
  const [showTarsGuide, setShowTarsGuide] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [tarsTopic, setTarsTopic] = useState("insight");
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
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [receiptScansLeft, setReceiptScansLeft] = useState(3);
  const [widgetTheme, setWidgetTheme] = useState("dark");
  const [widgetSize, setWidgetSize] = useState("medium");
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



  const pickImage = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(lang === 'en' ? 'Permission Denied' : 'Permiso Denegado', lang === 'en' ? 'Sorry, we need camera roll permissions to make this work!' : '¡Lo sentimos, necesitamos permisos de la galería para que esto funcione!', [], "error");
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
      showAlert(lang === 'en' ? "Module Error" : "Error de Módulo", lang === 'en' ? "The image selector is being configured. Please restart the app." : "El selector de imágenes se está configurando. Por favor reinicia la app.", [], "error");
    }
  };

  useEffect(() => {
    if (!isTempUnlocked) return;
    const interval = setInterval(() => {
      const remaining = tempUnlock - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        // CRITICAL FIX: Solo limpiar tempUnlock.
        // NO tocar premium — si el usuario compró una suscripción real,
        // premium:true debe mantenerse independientemente del trial de anuncios.
        const currentUser = userRef.current;
        if (!currentUser.premium) {
          // Solo resetear si no es suscriptor real
          updateState({ user: { ...currentUser, tempUnlock: 0 } });
        } else {
          // Es suscriptor: solo limpiar tempUnlock sin afectar premium
          updateState({ user: { ...currentUser, tempUnlock: 0, premium: true } });
        }
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tempUnlock, isTempUnlocked]);

  // Load receipt scan count
  useEffect(() => {
    AsyncStorage.getItem("@fynx_receipt_scans").then(val => {
      if (val !== null) setReceiptScansLeft(Math.max(0, 3 - parseInt(val, 10)));
    }).catch(() => {});
    
    AsyncStorage.getItem("@fynx_widget_theme").then(val => {
      if (val) setWidgetTheme(val);
    }).catch(() => {});
    AsyncStorage.getItem("@fynx_widget_size").then(val => {
      if (val) setWidgetSize(val);
    }).catch(() => {});
  }, []);

  const changeWidgetTheme = async (theme) => {
    setWidgetTheme(theme);
    await AsyncStorage.setItem("@fynx_widget_theme", theme);
    try { await updateFynxWidgetLocal(); } catch (e) { console.warn("Failed to update widget", e); }
  };

  const changeWidgetSize = async (size) => {
    setWidgetSize(size);
    await AsyncStorage.setItem("@fynx_widget_size", size);
  };

  const handlePinWidget = async () => {
    try {
      const { WidgetPinModule } = NativeModules;
      if (WidgetPinModule) {
        const success = await WidgetPinModule.requestPin();
        if (success) {
          Alert.alert(lang === "en" ? "Success" : "Éxito", lang === "en" ? "Check your home screen." : "Revisa tu pantalla de inicio.");
        } else {
          Alert.alert(lang === "en" ? "Notice" : "Aviso", lang === "en" ? "Your device doesn't support auto-pin. Please add it manually." : "Tu dispositivo no soporta auto-anclaje. Agrégalo manualmente.");
        }
      } else {
        Alert.alert(lang === "en" ? "Notice" : "Aviso", lang === "en" ? "Native module not found. Please add it manually." : "Módulo nativo no encontrado. Agrégalo manualmente.");
      }
    } catch (e) {
      console.warn("Failed to pin widget", e);
    }
  };

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
      const Constants = require("expo-constants").default;
      if (Constants.appOwnership !== "expo") {
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
      }
    } catch (e) {
      console.warn("Rewarded Interstitial ads disabled", e);
    }
  }, []);

  const { totalInc, totalExp } = React.useMemo(() => ({
    totalInc: income.reduce((a, i) => a + i.amount, 0),
    totalExp: expenses.reduce((a, e) => a + e.amount, 0)
  }), [income, expenses]);

  const { total, grade, s } = React.useMemo(() => score(expenses, totalInc, budgets, streakDays, [], lang), [expenses, totalInc, budgets, streakDays, lang]);
  const scoreDiscipline = s?.presupuesto || 0;
  const scoreSavings = s?.ahorro || 0;
  const scoreStability = s?.deuda || 0;
  const scoreConstancy = s?.consistencia || 0;
  const streak = React.useMemo(() => calcStreak(streakDays), [streakDays]);

  const { balEOM, dailyAvg, runOut, pctSpent } = predictMonthEnd(appState);

  const { upcoming, daysThisMonth, consistency, spentByCat } = React.useMemo(() => {
    const today = new Date().getDate();
    const curMo = new Date().toISOString().slice(0, 7);
    const up = reminders.filter(r => r.active && r.paidMonth !== curMo).sort((a, b) => a.day - b.day);
    const dThisMo = (streakDays || []).filter(d => d.startsWith(curMo)).length;
    const cons = Math.round((dThisMo / DAY) * 100);
    const spent = expenses.filter(e => e.date && e.date.startsWith(curMo)).reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    return { upcoming: up, daysThisMonth: dThisMo, consistency: cons, spentByCat: spent };
  }, [reminders, streakDays, expenses]);

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

      {/* Fondo Deep Space */}
      <View style={StyleSheet.absoluteFill}>
        <Image source={require("../../assets/icon.png")} style={{ width: "100%", height: 300, opacity: 0.05, transform: [{ scale: 1.5 }] }} blurRadius={50} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
      </View>

      {/* ── CABECERA PREMIUM CONCEPT ───────────────────────────── */}
      <View style={{ zIndex: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Avatar con Anillo Dorado */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity onPress={pickImage} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#111', borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user && user.photo ? (
                <Image key={user.photo} source={{ uri: user.photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFF' }}>{user.name ? user.name[0].toUpperCase() : 'E'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: C.gold, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' }}>
              <Ionicons name="camera" size={12} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Info Usuario */}
          <View>
            <TextInput
              style={{ fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5, padding: 0, marginBottom: 2 }}
              defaultValue={user.name || (lang === 'en' ? "Fynx User" : "Usuario Fynx")}
              placeholder={lang === 'en' ? "Fynx User" : "Usuario Fynx"}
              placeholderTextColor={C.t4}
              onEndEditing={(e) => {
                const newName = e.nativeEvent.text.trim();
                if (newName) updateState({ user: { ...user, name: newName } });
              }}
              returnKeyType="done"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.sky }}>{lang === 'en' ? 'Nivel' : 'Nivel'} {level}</Text>
              <Text style={{ fontSize: 10, color: C.t3 }}>•</Text>
              <Ionicons name="diamond" size={10} color={C.gold} />
              <Text style={{ fontSize: 10, fontWeight: '900', color: C.gold, letterSpacing: 1 }}>FYNX ELITE</Text>
            </View>
            
            {/* Badges/Tags */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,165,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,165,0,0.3)' }}>
                <Ionicons name="flame" size={12} color="#FF4500" />
                <Text style={{ fontSize: 10, color: C.t2, fontWeight: '700' }}>{streak} {lang === 'en' ? 'day streak' : 'días de racha'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(218,165,32,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(218,165,32,0.3)' }}>
                <Ionicons name="water" size={12} color={C.gold} />
                <Text style={{ fontSize: 10, color: C.t2, fontWeight: '700' }}>{lang === 'en' ? 'Consistency' : 'Constancia'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Right Icons */}
        <View style={{ flexDirection: 'row', gap: 12, alignSelf: 'flex-start' }}>
          <TouchableOpacity onPress={openSettings} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.gold + '40' }}>
            <Ionicons name="settings-outline" size={18} color={C.gold} />
          </TouchableOpacity>

        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 24 }}>

        {/* 2. RESUMEN FINANCIERO */}
        <FadeIn delay={20}>
          <View style={{ backgroundColor: '#000000', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.gold + '30' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1.5 }}>RESUMEN FINANCIERO</Text>
              <TouchableOpacity onPress={() => onOpenReport && onOpenReport()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, color: C.gold, fontWeight: '600' }}>Ver más</Text>
                <Ionicons name="chevron-forward" size={12} color={C.gold} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(74, 255, 231, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="trending-up" size={16} color="#4AFFE7" />
                </View>
                <Text style={{ fontSize: 10, color: '#A0AAB2', marginBottom: 2 }}>Ingresos</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>{money(totalInc, cur)}</Text>
                <Text style={{ fontSize: 10, color: '#4AFFE7', fontWeight: '600', marginTop: 2 }}>+12.4%</Text>
              </View>
              <View style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 69, 58, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="trending-down" size={16} color="#FF453A" />
                </View>
                <Text style={{ fontSize: 10, color: '#A0AAB2', marginBottom: 2 }}>Gastos</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>{money(totalExp, cur)}</Text>
                <Text style={{ fontSize: 10, color: '#FF453A', fontWeight: '600', marginTop: 2 }}>-5.7%</Text>
              </View>
              <View style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212, 175, 55, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="wallet" size={16} color="#D4AF37" />
                </View>
                <Text style={{ fontSize: 10, color: '#A0AAB2', marginBottom: 2 }}>Ahorros</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>{money(totalInc - totalExp, cur)}</Text>
                <Text style={{ fontSize: 10, color: '#4AFFE7', fontWeight: '600', marginTop: 2 }}>+18.9%</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        
{/* 1. SCORE FINANCIERO */}
        <FadeIn delay={40}>
          <View style={{ backgroundColor: '#051214', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#4AFFE730' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1.5 }}>SCORE FINANCIERO</Text>
                  <Ionicons name="information-circle-outline" size={14} color="#A0AAB2" />
                </View>
                <Text style={{ fontSize: 56, fontWeight: '900', color: '#FFF', letterSpacing: -2, lineHeight: 60 }}>{total}</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: grade.color, letterSpacing: 1 }}>{grade.label}</Text>
                <Text style={{ fontSize: 11, color: '#A0AAB2', marginTop: 8, lineHeight: 16, maxWidth: '90%' }}>
                  Estás en el <Text style={{ color: '#4AFFE7', fontWeight: '800' }}>top 15%</Text> de la comunidad
                </Text>
              </View>
              <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={120} height={120} viewBox="0 0 120 120">
                  <Circle cx="60" cy="60" r="50" stroke="#0A2226" strokeWidth="12" fill="transparent" />
                  <AnimatedCircle cx="60" cy="60" r="50" stroke="#FDE68A" strokeWidth="12" fill="transparent" strokeDasharray={`${2 * Math.PI * 50}`} strokeDashoffset={scoreAnim.interpolate({ inputRange: [0, 1], outputRange: [2 * Math.PI * 50, 0] })} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#4AFFE7' }}>TOP</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF' }}>15%</Text>
                  <Text style={{ fontSize: 8, color: '#A0AAB2', textAlign: 'center', width: 60 }}>de la comunidad</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4AFFE720', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trending-up" size={10} color="#4AFFE7" />
                </View>
                <Text style={{ fontSize: 10, color: '#A0AAB2', fontWeight: '600' }}>+12 pts esta semana</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '800' }}>{total} <Text style={{ color: '#666' }}>/ 100</Text></Text>
            </View>
          </View>
        </FadeIn>

        {/* 3. SPLIT CARDS */}
        <FadeIn delay={60}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* TARS Intelligence */}
            <View style={{ flex: 1, backgroundColor: '#000000', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.gold + '30' }}>
              <TouchableOpacity onPress={() => { setTarsTopic("insight"); setShowTarsGuide(true); }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="bulb-outline" size={14} color={C.gold} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1 }}>TARS INTELLIGENCE</Text>
                </View>
                <Ionicons name="chevron-forward" size={12} color={C.gold} />
              </TouchableOpacity>

              <View style={{ gap: 12, marginBottom: 16 }}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="brain" size={12} color="#FDE68A" />
                      <Text style={{ fontSize: 10, color: '#D1D5DB' }}>Disciplina financiera</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#FDE68A' }}>{Math.round(scoreDiscipline)}%</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}><View style={{ height: '100%', width: `${scoreDiscipline}%`, backgroundColor: '#FDE68A', borderRadius: 2 }} /></View>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="leaf" size={12} color="#FF6B6B" />
                      <Text style={{ fontSize: 10, color: '#D1D5DB' }}>Ahorro</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#FDE68A' }}>{Math.round(scoreSavings)}%</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}><View style={{ height: '100%', width: `${scoreSavings}%`, backgroundColor: '#FDE68A', borderRadius: 2 }} /></View>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="shield-checkmark" size={12} color="#4ADE80" />
                      <Text style={{ fontSize: 10, color: '#D1D5DB' }}>Estabilidad</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#FDE68A' }}>{Math.round(scoreStability)}%</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}><View style={{ height: '100%', width: `${scoreStability}%`, backgroundColor: '#FDE68A', borderRadius: 2 }} /></View>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="flame" size={12} color="#F59E0B" />
                      <Text style={{ fontSize: 10, color: '#D1D5DB' }}>Constancia</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#F59E0B' }}>{Math.round(scoreConstancy)}%</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}><View style={{ height: '100%', width: `${scoreConstancy}%`, backgroundColor: '#F59E0B', borderRadius: 2 }} /></View>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', gap: 8 }}>
                <Ionicons name="ribbon" size={18} color={C.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '700', marginBottom: 2 }}>Buen progreso, {user.name || 'usuario'}.</Text>
                  <Text style={{ fontSize: 9, color: '#A0AAB2' }}>Sigue así, vas por el camino correcto.</Text>
                </View>
              </View>
            </View>

            {/* Mi Progreso */}
            <View style={{ flex: 1, backgroundColor: '#000000', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.gold + '30', justifyContent: 'space-between' }}>
              <View>
                <TouchableOpacity onPress={() => { setTarsTopic("score"); setShowTarsGuide(true); }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1 }}>MI PROGRESO</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.gold} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, color: '#D1D5DB' }}>Nivel actual</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={10} color="#3B82F6" />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#3B82F6' }}>Nivel {level}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#3B82F6' }}>{Math.round(levelProgress * 500)}</Text>
                  <Text style={{ fontSize: 10, color: '#A0AAB2' }}>/ 500 XP</Text>
                </View>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, marginBottom: 6 }}><View style={{ height: '100%', width: `${levelProgress * 100}%`, backgroundColor: '#3B82F6', borderRadius: 3 }} /></View>
                <Text style={{ fontSize: 9, color: '#A0AAB2', textAlign: 'right', marginBottom: 16 }}>Siguiente: Nivel {level + 1}</Text>
                
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Ionicons name="flame" size={16} color="#FF4500" style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFF' }}>{streak}</Text>
                    <Text style={{ fontSize: 8, color: '#A0AAB2', textTransform: 'uppercase' }}>Racha</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Ionicons name="flag" size={16} color={C.gold} style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFF' }}>{appState.goals?.length || 0}</Text>
                    <Text style={{ fontSize: 8, color: '#A0AAB2', textTransform: 'uppercase' }}>Metas</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Ionicons name="card" size={16} color="#EF4444" style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFF' }}>{appState.debts?.length || 0}</Text>
                    <Text style={{ fontSize: 8, color: '#A0AAB2', textTransform: 'uppercase' }}>Deudas</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={() => setTab("estrategia")} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,0,0,0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)' }}>
                <Ionicons name="locate" size={16} color="#EF4444" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>Mis metas</Text>
                <Ionicons name="chevron-forward" size={12} color={C.gold} style={{ position: 'absolute', right: 12 }} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        {/* 4. RANKING GLOBAL */}
        <FadeIn delay={80}>
          <View style={{ backgroundColor: '#000000', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.gold + '30' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1.5 }}>RANKING GLOBAL EN VIVO</Text>
              <TouchableOpacity onPress={() => setShowRanking(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, color: C.gold, fontWeight: '600' }}>Ranking</Text>
                <Ionicons name="chevron-forward" size={12} color={C.gold} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ width: 140, height: 140, backgroundColor: '#0A151A', borderRadius: 16, padding: 16, justifyContent: 'center', overflow: 'hidden' }}>
                <Ionicons name="globe-outline" size={140} color="#ffffff08" style={{ position: 'absolute', right: -40, top: 0 }} />
                <Text style={{ fontSize: 10, color: '#A0AAB2', marginBottom: 4 }}>TU POSICIÓN</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#4AFFE7', marginBottom: 8, letterSpacing: -1 }}>TOP 15%</Text>
                <Text style={{ fontSize: 12, color: '#D1D5DB' }}>Score: {total} pts</Text>
              </View>

              <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 4 }}>
                {[
                  { id: 1, icon: 'flame', name: 'Fynx_Elite_9X', score: 92, pct: 92, color: '#FF4500' },
                  { id: 2, icon: 'ribbon', name: 'User_8421', score: 85, pct: 85, color: '#E5E7EB' },
                  { id: 3, icon: 'medal', name: 'Tú', score: total, pct: total, color: C.gold, isMe: true },
                  { id: 4, icon: null, name: 'User_1092', score: 72, pct: 72, color: '#A0AAB2' },
                  { id: 5, icon: null, name: 'Anon_4491', score: 65, pct: 65, color: '#A0AAB2' },
                ].map(r => (
                  <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 10, color: '#A0AAB2', width: 12 }}>{r.id}</Text>
                    <View style={{ width: 14, alignItems: 'center' }}>
                      {r.icon && <Ionicons name={r.icon} size={12} color={r.color} />}
                    </View>
                    <Text style={{ fontSize: 10, color: r.isMe ? '#FFF' : '#D1D5DB', fontWeight: r.isMe ? '800' : '400', flex: 1, marginRight: 8 }} numberOfLines={1}>{r.name}</Text>
                    <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <View style={{ width: `${r.pct}%`, height: '100%', backgroundColor: r.isMe ? C.gold : '#4AFFE7', borderRadius: 2 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: '#FDE68A', fontWeight: '800', width: 34, textAlign: 'right' }}>{r.score} pts</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeIn>

        {/* 5. MEDALLAS Y LOGROS */}
        <FadeIn delay={100}>
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#A0AAB2', letterSpacing: 1.5 }}>MEDALLAS Y LOGROS</Text>
              <TouchableOpacity onPress={() => Alert.alert("Medallas", "El panel completo de medallas y logros históricos estará disponible en el próximo nivel de la actualización.")} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, color: C.gold, fontWeight: '600' }}>Ver todas</Text>
                <Ionicons name="chevron-forward" size={12} color={C.gold} />
              </TouchableOpacity>
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
                  })} style={{ width: 90, height: 110, borderRadius: 16, backgroundColor: '#000000', borderWidth: 1, borderColor: active ? C.gold : C.gold + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: active ? C.gold + '15' : 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name={ach.icon} size={22} color={active ? '#FDE68A' : '#333'} />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: '#FFF', textAlign: "center", textTransform: "uppercase", marginBottom: 4 }}>{ach.title[lang] || ach.title.es}</Text>
                    <Text style={{ fontSize: 8, color: active ? '#4ADE80' : '#A0AAB2', fontWeight: '800' }}>{active ? 'Completada' : 'Bloqueada'}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={{ width: 90, height: 110, borderRadius: 16, backgroundColor: '#000000', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: C.gold, marginBottom: 8 }}>+5</Text>
                <Text style={{ fontSize: 9, color: '#A0AAB2', textAlign: 'center' }}>Más medallas</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </FadeIn>

        {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
        <FadeIn delay={190}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: C.t3, letterSpacing: 1.5, marginBottom: 12 }}>
            {lang === 'en' ? "TOOLS" : "HERRAMIENTAS"}
          </Text>
          <View style={{ gap: 12, marginBottom: 32 }}>

            {/* Weekly Summary */}
            <TouchableOpacity onPress={() => setShowWeeklySummary(true)}
              style={{ backgroundColor: '#000000', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.gold + "30", flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.gold + "15", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="bar-chart" size={22} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.gold, marginBottom: 3 }}>
                  {lang === 'en' ? "Weekly Summary" : "Resumen Semanal"}
                </Text>
                <Text style={{ fontSize: 11, color: C.t3, lineHeight: 16 }}>
                  {lang === 'en' ? "Your performance from the last 4 weeks." : "Tu desempeño de las últimas 4 semanas."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.gold + "80"} />
            </TouchableOpacity>

            {/* Widget Customizer — Android only */}
            {Platform.OS === 'android' && <View style={{ backgroundColor: '#000000', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.gold + "30" }}>

              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.gold + "15", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="color-palette" size={22} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: C.gold, marginBottom: 3 }}>
                    {lang === 'en' ? "Home Screen Widget" : "Widget de Inicio"}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.t3, lineHeight: 16 }}>
                    {lang === 'en' ? "Preview and customize your widget." : "Previsualiza y personaliza tu widget."}
                  </Text>
                </View>
              </View>

              {/* ── LIVE PREVIEW ───────────────────────────── */}
              {/* Phone wallpaper mock background */}
              <View style={{
                backgroundColor: '#1a1a2e',
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                alignItems: 'center',
                overflow: 'hidden',
                minHeight: widgetSize === 'small' ? 160 : widgetSize === 'medium' ? 200 : 240,
                justifyContent: 'center',
              }}>
                {/* Decorative dots like wallpaper */}
                <View style={{ position: 'absolute', top: 12, left: 12, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <View style={{ position: 'absolute', top: 30, right: 20, width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <View style={{ position: 'absolute', bottom: 20, left: 30, width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <Text style={{ position: 'absolute', top: 8, fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: 1 }}>PREVIEW</Text>

                {/* The actual widget preview card */}
                <View style={{
                  width: widgetSize === 'small' ? 140 : widgetSize === 'medium' ? '85%' : '100%',
                  backgroundColor: widgetTheme === 'transparent' ? 'rgba(5,5,5,0.75)'
                    : widgetTheme === 'dark' ? '#050505' : '#F2FFFFFF',
                  borderRadius: 20,
                  padding: widgetSize === 'small' ? 12 : 18,
                  borderWidth: 1,
                  borderColor: widgetTheme === 'dark' || widgetTheme === 'transparent'
                    ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.08)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                }}>
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: widgetSize === 'small' ? 6 : 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4AFFE7', marginRight: 5 }} />
                      <Text style={{ fontSize: 8, color: '#4AFFE7', fontWeight: '800', letterSpacing: 1 }}>
                        {widgetSize === 'small' ? 'TARS' : 'TARS.SYS // ACTIVE'}
                      </Text>
                    </View>
                    {widgetSize !== 'small' && (
                      <View style={{ backgroundColor: 'rgba(212,175,55,0.12)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                        <Text style={{ fontSize: 8, color: '#D4AF37', fontWeight: '800' }}>SC: {total}</Text>
                      </View>
                    )}
                  </View>

                  {/* Balance label */}
                  {widgetSize !== 'small' && (
                    <Text style={{ fontSize: 9, color: widgetTheme === 'light' ? '#D4AF37' : '#D4AF3790', letterSpacing: 1.5, marginBottom: 2, fontWeight: '700' }}>
                      {lang === 'en' ? 'AVAILABLE BALANCE' : 'BALANCE DISPONIBLE'}
                    </Text>
                  )}

                  {/* Balance amount — REAL DATA */}
                  <Text style={{
                    fontSize: widgetSize === 'small' ? 20 : widgetSize === 'medium' ? 26 : 30,
                    color: widgetTheme === 'light' ? '#1A1A1A' : '#FFFFFF',
                    fontWeight: '900',
                    marginBottom: widgetSize === 'small' ? 0 : 12,
                    letterSpacing: -0.5,
                  }}>
                    {money(totalInc - totalExp, cur)}
                  </Text>

                  {/* Divider + prompt — only in medium/large */}
                  {widgetSize !== 'small' && (
                    <>
                      <View style={{ height: 1, backgroundColor: widgetTheme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(212,175,55,0.18)', marginBottom: 10 }} />
                      <Text style={{ fontSize: widgetSize === 'large' ? 11 : 9, color: widgetTheme === 'light' ? '#666' : '#A0A0A0', fontWeight: '600' }}>
                        {lang === 'en' ? '> Ready to log today?' : '> Que vamos a registrar?'}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* ── SIZE SELECTOR ──────────────────────────── */}
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.t3, letterSpacing: 1.5, marginBottom: 8 }}>
                {lang === 'en' ? 'SIZE' : 'TAMAÑO'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'small',  label: lang === 'en' ? 'Small'  : 'Pequeño', icon: 'square-outline' },
                  { key: 'medium', label: lang === 'en' ? 'Medium' : 'Mediano', icon: 'stop-outline' },
                  { key: 'large',  label: lang === 'en' ? 'Large'  : 'Grande',  icon: 'stop' },
                ].map(s => (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => changeWidgetSize(s.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 10,
                      borderWidth: 1,
                      gap: 4,
                      borderColor: widgetSize === s.key ? C.gold : 'rgba(255,255,255,0.06)',
                      backgroundColor: widgetSize === s.key ? C.gold + '15' : 'transparent',
                    }}
                  >
                    <Ionicons name={s.icon} size={16} color={widgetSize === s.key ? C.gold : C.t3} />
                    <Text style={{ fontSize: 10, color: widgetSize === s.key ? C.gold : C.t3, fontWeight: '700' }}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── THEME SELECTOR ─────────────────────────── */}
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.t3, letterSpacing: 1.5, marginBottom: 8 }}>
                {lang === 'en' ? 'THEME' : 'TEMA'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {[
                  { key: 'dark',        label: lang === 'en' ? 'Dark'        : 'Oscuro',      dot: '#050505' },
                  { key: 'light',       label: lang === 'en' ? 'Light'       : 'Claro',       dot: '#F2FFFFFF' },
                  { key: 'transparent', label: lang === 'en' ? 'Transparent' : 'Transparente', dot: 'transparent' },
                ].map(th => (
                  <TouchableOpacity
                    key={th.key}
                    onPress={() => changeWidgetTheme(th.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 10,
                      borderWidth: 1,
                      gap: 4,
                      borderColor: widgetTheme === th.key ? C.gold : 'rgba(255,255,255,0.06)',
                      backgroundColor: widgetTheme === th.key ? C.gold + '15' : 'transparent',
                    }}
                  >
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: th.dot, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                    <Text style={{ fontSize: 9, color: widgetTheme === th.key ? C.gold : C.t3, fontWeight: '700' }}>{th.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Instructions */}
              <View style={{ backgroundColor: 'rgba(74,255,231,0.05)', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: 'rgba(74,255,231,0.1)' }}>
                <Ionicons name="information-circle" size={16} color={C.sky} style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 11, color: C.t3, flex: 1, lineHeight: 17 }}>
                  {lang === 'en'
                    ? "Long press an empty space on your home screen → Widgets → Fynx Resumen. Then drag to adjust size."
                    : "Mantén presionado un espacio vacío en tu inicio → Widgets → Fynx Resumen. Arrastra los bordes para ajustar el tamaño."}
                </Text>
              </View>

              {/* Add button */}
              <TouchableOpacity
                onPress={handlePinWidget}
                style={{ backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Ionicons name="add-circle" size={18} color="#000" />
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#000' }}>
                  {lang === 'en' ? 'ADD WIDGET TO HOME SCREEN' : 'AGREGAR WIDGET AL INICIO'}
                </Text>
              </TouchableOpacity>
            </View>}

            {/* Repetir Tutorial */}
            <TouchableOpacity onPress={onStartTour}
              style={{ backgroundColor: '#000000', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.gold + "30", flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.gold + "15", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="hardware-chip" size={22} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.gold, marginBottom: 3 }}>
                  {lang === 'en' ? "TARS Tour" : "Tutorial TARS"}
                </Text>
                <Text style={{ fontSize: 11, color: C.t3, lineHeight: 16 }}>
                  {lang === 'en' ? "Restart the interactive guide." : "Reinicia la guía interactiva."}
                </Text>
              </View>
              <Ionicons name="refresh" size={18} color={C.gold + "80"} />
            </TouchableOpacity>



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
                adLoaded={adLoaded} rewardedAd={rewardedAd} adError={adError} setAdError={setAdError} onUpgrade={() => setShowPremium(true)} userEmail={user.email} lang={lang} isTempUnlocked={isTempUnlocked}
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

      {/* ── WEEKLY SUMMARY MODAL ─────────────────────────────── */}
      <WeeklySummaryModal
        visible={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
        appState={appState}
        lang={lang}
        cur={cur}
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

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.mint, marginBottom: 12 }}>🚀 {lang === 'en' ? "HOW TO REACH 100?" : "¿CÓMO LLEGAR AL 100?"}</Text>
                <Text style={{ fontSize: 13, color: C.t2, lineHeight: 20 }}>
                  {lang === 'en'
                    ? "To reach the maximum Elite status, you must optimize all clusters:"
                    : "Para alcanzar el estatus máximo de Elite, debes optimizar todos los clústeres:"}
                </Text>
                <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
                  <Text style={{ fontSize: 12, color: "#FFF", marginBottom: 8 }}>1. {lang === 'en' ? "Maintain savings > 30% of your total income." : "Mantén ahorros > 30% de tus ingresos totales."}</Text>
                  <Text style={{ fontSize: 12, color: "#FFF", marginBottom: 8 }}>2. {lang === 'en' ? "Do not exceed ANY category budget." : "No excedas NINGÚN presupuesto de categoría."}</Text>
                  <Text style={{ fontSize: 12, color: "#FFF", marginBottom: 8 }}>3. {lang === 'en' ? "Record at least 1 transaction every 24h." : "Registra al menos 1 transacción cada 24h."}</Text>
                  <Text style={{ fontSize: 12, color: "#FFF" }}>4. {lang === 'en' ? "Keep your debt-to-income ratio below 10%." : "Mantén tu ratio deuda/ingreso por debajo del 10%."}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setShowLogic(false)} style={{ backgroundColor: C.gold, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10 }}>
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
      <TarsGuideModal visible={showTarsGuide} onClose={() => setShowTarsGuide(false)} topic={tarsTopic} />
      <RankingModal visible={showRanking} onClose={() => setShowRanking(false)} userScore={total} />
    </SafeAreaView>
  );
}
