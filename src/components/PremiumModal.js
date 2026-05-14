/**
 * TARS — Modal de suscripción Premium
 * Muestra beneficios, precio y botón de conversión.
 * Posición: llamar desde PerfilScreen o Dashboard.
 */
import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal, StyleSheet, PanResponder, Easing, Alert } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { TypewriterText } from "./TypewriterText";
import * as rc from "../services/revenuecat";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";

const UNLOCKED_FEATURES = (t, lang) => [
  { icon: "chatbubble-ellipses-outline", label: lang === 'en' ? "Unlimited TARS AI" : "TARS AI sin límites", desc: lang === 'en' ? "Unlimited queries with your AI advisor" : "Consultas ilimitadas con tu asesor IA" },
  { icon: "pie-chart-outline",           label: lang === 'en' ? "Elite Budgets" : "Presupuestos Elite",  desc: lang === 'en' ? "Total control by category" : "Control total por categoría" },
  { icon: "document-text-outline",       label: lang === 'en' ? "PDF Reports" : "Reportes PDF",        desc: lang === 'en' ? "Export your financial health" : "Exporta tu salud financiera" },
  { icon: "globe-outline",               label: lang === 'en' ? "Social Score" : "Social Score",        desc: lang === 'en' ? "Ranking vs. Fynx community" : "Ranking vs. la comunidad Fynx" },
  { icon: "ban-outline",                 label: lang === 'en' ? "Ad-Free" : "Sin anuncios",        desc: lang === 'en' ? "100% clean experience" : "Experiencia 100% limpia" },
];

// Partícula de oro animada
function GoldParticle({ delay, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: "absolute", left: x, bottom: 0,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.gold,
      opacity: anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 0.8, 0] }),
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -220] }) }],
    }} />
  );
}

export function PremiumModal({ visible, onClose, onSuscribir }) {
  const { updateState, appState } = useFinance();
  const { t, lang } = useLanguage();
  const benefs = t.premium?.beneficios || [{},{},{},{},{}];
  
  const features = UNLOCKED_FEATURES(t, lang);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const benefitAnims   = useRef(benefs.map(() => new Animated.Value(0))).current;
  const featureAnims   = useRef(features.map(() => new Animated.Value(0))).current;
  const ringAnim       = useRef(new Animated.Value(0)).current;
  const diamondAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim   = useRef(new Animated.Value(0)).current;
  const [plan, setPlan] = useState("anual");
  const [success, setSuccess] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [rewardedAd, setRewardedAd] = useState(null);

  useEffect(() => {
    if (visible) {
      setSuccess(false);
      // benefitAnims se resetean usando driver nativo al cerrar el modal
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 45, friction: 12 }),
        Animated.timing(bgAnim,    { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      // Empezar stagger pronto, sin esperar a que el slide termine
      setTimeout(() => {
        Animated.stagger(80,
          benefitAnims.map(a => Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true }))
        ).start();
      }, 200);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 600, duration: 300, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 0,   duration: 300, useNativeDriver: true }),
        ...benefitAnims.map(a => Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true }))
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    try {
      const { RewardedInterstitialAd, RewardedAdEventType, TestIds } = require("react-native-google-mobile-ads");
      const adUnitId = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : "ca-app-pub-4592841309124858/6050727008";
      const ad = RewardedInterstitialAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdLoaded(true);
      });
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log("User earned reward from PremiumModal: ", reward);
        const unlockTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
        updateState({ user: { ...appState.user, tempUnlock: unlockTime } });
        setAdLoaded(false);
        onClose(); // Cerrar modal al ganar recompensa
      });
      const unsubClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        setAdLoaded(false);
        ad.load();
      });

      ad.load();
      setRewardedAd(ad);

      return () => { unsubLoaded(); unsubEarned(); unsubClosed(); };
    } catch (e) {
      console.warn("Rewarded Interstitial ads disabled in PremiumModal", e);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (e, gs) => { if (gs.dy > 0) slideAnim.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 12, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const startSuccessAnimation = () => {
    // Reset all
    featureAnims.forEach(a => a.setValue(0));
    ringAnim.setValue(0);
    diamondAnim.setValue(0);
    progressAnim.setValue(0);

    // Seq: diamond -> ring -> features -> progress bar
    Animated.sequence([
      Animated.spring(diamondAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.stagger(120, featureAnims.map(a =>
        Animated.spring(a, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true })
      )),
    ]).start();

    // Progress bar independiente
    Animated.timing(progressAnim, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: false }).start();
  };

  const handleSubscribe = async () => {
    try {
      const offerings = await rc.getOfferings();
      if (!offerings || offerings.length === 0) {
        alert(lang === 'en' ? "No plans available right now." : "No hay planes disponibles en este momento.");
        return;
      }
      const packageToBuy = offerings.find(p =>
        plan === "anual" ? p.packageType === "ANNUAL" : p.packageType === "MONTHLY"
      ) || offerings[0];
      const isPurchased = await rc.purchasePackage(packageToBuy);
      if (isPurchased) {
        const { haptic } = require("./base");
        haptic("success");
        setSuccess(true);
        updateState({ user: { ...(appState?.user || {}), premium: true } });
        startSuccessAnimation();
        setTimeout(() => {
          onSuscribir(plan, true);
          setSuccess(false);
          onClose();
        }, 4500);
      }
    } catch (error) {
      console.error("Error en handleSubscribe:", error);
      alert(lang === 'en' ? "There was a problem processing the purchase." : "Hubo un problema al procesar la compra.");
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
        }
      ]}>
        <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: "#000000",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1.5, borderColor: C.gold + "50",
        maxHeight: "92%",
        height: "92%",
      }}>
        {success ? (
          // ── PANTALLA DE BIENVENIDA ELITE ──────────────────────────────────
          <View style={{ flex: 1, backgroundColor: "#000", overflow: "hidden" }}>

            {/* Partículas flotantes */}
            {[{x:"10%",d:0,s:6},{x:"25%",d:300,s:4},{x:"45%",d:150,s:8},{x:"65%",d:500,s:5},{x:"80%",d:200,s:6},{x:"55%",d:700,s:4}].map((p,i) =>
              <GoldParticle key={i} delay={p.d} x={p.x} size={p.s} />
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 }}
            >
              {/* Anillo + Diamante */}
              <Animated.View style={{
                opacity: ringAnim,
                transform: [{ scale: ringAnim.interpolate({ inputRange: [0,1], outputRange: [0.5, 1] }) }],
                width: 140, height: 140, borderRadius: 70,
                borderWidth: 2, borderColor: C.gold + "60",
                backgroundColor: C.gold + "10",
                alignItems: "center", justifyContent: "center",
                marginBottom: 24,
                shadowColor: C.gold, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
              }}>
                <Animated.View style={{
                  transform: [{
                    scale: diamondAnim.interpolate({ inputRange: [0,0.6,1], outputRange: [0, 1.3, 1] })
                  }],
                  opacity: diamondAnim,
                }}>
                  <Ionicons name="diamond" size={64} color={C.gold} />
                </Animated.View>
              </Animated.View>

              <Text style={{ fontSize: 11, color: C.gold, fontWeight: "700", letterSpacing: 3, marginBottom: 8 }}>
                {lang === 'en' ? "WELCOME TO" : "BIENVENIDO A"}
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFF", letterSpacing: -1, marginBottom: 6 }}>
                FYNX <Text style={{ color: C.gold }}>ELITE</Text>
              </Text>
              <Text style={{ fontSize: 13, color: C.t3, textAlign: "center", lineHeight: 20, marginBottom: 36 }}>
                {lang === 'en' ? "Your financial advisor now operates at maximum capacity." : "Tu asesor financiero ahora opera a máxima capacidad."}
              </Text>

              {/* Separador */}
              <Text style={{ fontSize: 9, fontWeight: "800", color: C.t4, letterSpacing: 3, marginBottom: 18 }}>
                {lang === 'en' ? "WHAT YOU JUST UNLOCKED" : "LO QUE ACABAS DE DESBLOQUEAR"}
              </Text>

              {/* Lista de features desbloqueados */}
              {features.map((f, i) => (
                <Animated.View key={i} style={{
                  width: "100%",
                  opacity: featureAnims[i],
                  transform: [{ translateX: featureAnims[i].interpolate({ inputRange: [0,1], outputRange: [-30, 0] }) }],
                  flexDirection: "row", alignItems: "center", gap: 14,
                  backgroundColor: "#111", borderRadius: 14,
                  borderWidth: 1, borderColor: C.gold + "25",
                  padding: 14, marginBottom: 10,
                }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 11,
                    backgroundColor: C.gold + "20", borderWidth: 1, borderColor: C.gold + "40",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name={f.icon} size={18} color={C.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: C.gold }}>{f.label}</Text>
                    <Text style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{f.desc}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={C.gold} />
                </Animated.View>
              ))}

              {/* Barra de progreso de cierre automático */}
              <View style={{ width: "100%", height: 3, backgroundColor: "#222", borderRadius: 2, marginTop: 28, overflow: "hidden" }}>
                <Animated.View style={{
                  height: 3, borderRadius: 2, backgroundColor: C.gold,
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }} />
              </View>
              <Text style={{ fontSize: 10, color: C.t4, marginTop: 8 }}>
                {lang === 'en' ? "Closing automatically..." : "Cerrando automáticamente..."}
              </Text>
            </ScrollView>
          </View>
        ) : (
          <>
            {/* Barra de arrastre visual */}
            <View {...panResponder.panHandlers} style={{ alignItems: "center", paddingTop: 14, paddingBottom: 14, zIndex: 10 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border2 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 220 }}>

              {/* Encabezado */}
              <View style={{
                backgroundColor: C.goldBg2,
                borderRadius: 20, borderWidth: 1.5, borderColor: C.gold + "50",
                padding: 20, marginBottom: 24, alignItems: "center",
              }}>
                <View style={{
                  backgroundColor: C.gold + "22", borderRadius: 14, borderWidth: 1,
                  borderColor: C.gold + "40", paddingHorizontal: 14, paddingVertical: 5,
                  marginBottom: 14,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: C.gold, letterSpacing: 2 }}>
                    {t.premium?.badge || "PLAN PREMIUM"}
                  </Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: "900", color: C.t1, letterSpacing: -0.8, textAlign: "center" }}>
                  {t.premium?.titulo || "Fynx Elite"}
                </Text>
                <Text style={{ fontSize: 13, color: C.t2, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                  {t.premium?.subtitulo || "Herramientas avanzadas para finanzas de élite."}
                </Text>
              </View>



              {/* Beneficios */}
              <Text style={{
                fontSize: 9, color: C.t3, fontWeight: "700", letterSpacing: 2.5,
                marginBottom: 14,
              }}>
                {lang === 'en' ? "INCLUDED IN FYNX ELITE" : "INCLUIDO EN FYNX ELITE"}
              </Text>
              {benefs.map((b, i) => (
                <Animated.View key={i} style={{
                  opacity: benefitAnims[i],
                  transform: [{ translateY: benefitAnims[i].interpolate({ inputRange:[0,1], outputRange:[14,0] }) }],
                }}>
                  <View style={{
                    flexDirection: "row", alignItems: "flex-start", gap: 14,
                    backgroundColor: C.card2, borderRadius: 14, borderWidth: 1,
                    borderColor: C.border, padding: 14, marginBottom: 10,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: C.gold + "18", borderWidth: 1, borderColor: C.gold + "30",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Ionicons name={b.icono} size={20} color={C.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: C.gold, marginBottom: 2 }}>
                        {b.titulo}
                      </Text>
                      <Text style={{ fontSize: 11, color: C.t2, lineHeight: 17 }}>
                        {b.desc}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}

              {/* Selección de Plan */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 16 }}>
                {/* Mensual */}
                <TouchableOpacity onPress={() => { const { haptic } = require("./base"); haptic("light"); setPlan("mensual"); }}
                  style={{
                    flex: 1, padding: 16, borderRadius: 16,
                    borderWidth: plan === "mensual" ? 2 : 1.5,
                    borderColor: plan === "mensual" ? C.gold : C.t3+"60",
                    backgroundColor: plan === "mensual" ? C.goldBg : "rgba(255,255,255,0.04)",
                    alignItems: "center", position: "relative"
                  }}>
                  <View style={{ position: "absolute", top: -10, backgroundColor: plan === "mensual" ? C.gold : "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: plan === "mensual" ? "#000" : C.t2 }}>
                      {lang === 'en' ? "MOST FLEXIBLE" : "MÁS FLEXIBLE"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: plan === "mensual" ? C.gold : C.t2, fontWeight: "700", marginBottom: 4 }}>
                    {lang === 'en' ? "MONTHLY" : "MENSUAL"}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: plan === "mensual" ? C.gold : C.t1 }}>$2.99</Text>
                  <Text style={{ fontSize: 9, color: plan === "mensual" ? C.gold+"90" : C.t3, marginTop: 2 }}>
                    {lang === 'en' ? "/ month" : "/ mes"}
                  </Text>
                </TouchableOpacity>

                {/* Anual */}
                <TouchableOpacity onPress={() => { const { haptic } = require("./base"); haptic("light"); setPlan("anual"); }}
                  style={{
                    flex: 1, padding: 16, borderRadius: 16,
                    borderWidth: plan === "anual" ? 2 : 1.5,
                    borderColor: plan === "anual" ? C.gold : C.border,
                    backgroundColor: plan === "anual" ? C.goldBg : C.card2,
                    alignItems: "center", position: "relative"
                  }}>
                  <View style={{ position: "absolute", top: -10, backgroundColor: C.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#000" }}>
                      {lang === 'en' ? "SAVE 45%" : "AHORRA 45%"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: plan === "anual" ? C.gold : C.t3, fontWeight: "700", marginBottom: 4 }}>
                    {lang === 'en' ? "ANNUAL" : "ANUAL"}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: plan === "anual" ? C.gold : C.t2 }}>$19.99</Text>
                  <Text style={{ fontSize: 9, color: plan === "anual" ? C.gold+"90" : C.t3, marginTop: 2 }}>
                    {lang === 'en' ? "Equivalent to $1.67 / mo" : "Equivale a $1.67 / mes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Contenedor Flotante Absoluto para Botones */}
            <View style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16,
              backgroundColor: "#000000",
              borderTopWidth: 1, borderTopColor: "#111111"
            }}>
              {/* CTA */}
              <TouchableOpacity
                onPress={handleSubscribe}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16,
                  alignItems: "center", width: "100%",
                  shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#000", letterSpacing: -0.3 }}>
                  {t.premium?.cta || "Suscribirse ahora"}
                </Text>
              </TouchableOpacity>

              {/* Opción de Prueba Gratis con Anuncio */}
              {adLoaded ? (
                <TouchableOpacity
                  onPress={() => {
                    try { rewardedAd.show(); } catch (e) { console.warn(e); }
                  }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: 14, backgroundColor: C.gold + "15", borderRadius: 14, paddingVertical: 14,
                    borderWidth: 1, borderColor: C.gold + "40"
                  }}
                >
                  <Ionicons name="play-circle" size={18} color={C.gold} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: C.gold, letterSpacing: 0.5 }}>
                    {lang === 'en' ? "Try 4 hours for free (Watch Ad)" : "Probar 4 horas gratis (Ver Anuncio)"}
                  </Text>
                </TouchableOpacity>
              ) : __DEV__ ? (
                <TouchableOpacity
                  onPress={() => {
                    const unlockTime = Date.now() + 4 * 60 * 60 * 1000;
                    updateState({ user: { ...appState?.user, tempUnlock: unlockTime } });
                    onClose();
                    Alert.alert(lang === 'en' ? "Fynx Elite Unlocked" : "Fynx Elite Desbloqueado", lang === 'en' ? "You simulated an ad. Enjoy 4 hours of premium features." : "Has simulado un anuncio. Disfruta de 4 horas de funciones premium.");
                  }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: 14, backgroundColor: C.gold + "15", borderRadius: 14, paddingVertical: 14,
                    borderWidth: 1, borderColor: C.gold + "40", borderStyle: "dashed"
                  }}
                >
                  <Ionicons name="construct" size={18} color={C.gold} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: C.gold, letterSpacing: 0.5 }}>
                    {lang === 'en' ? "SIMULATE AD (DEV)" : "SIMULAR ANUNCIO (DEV)"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 14, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, paddingVertical: 14,
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.08)"
                }}>
                  <Ionicons name="alert-circle-outline" size={18} color={C.t3} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: C.t3, letterSpacing: 0.5 }}>
                    {lang === 'en' ? "No ads available right now" : "No hay anuncios disponibles en este momento"}
                  </Text>
                </View>
              )}

              {/* Cerrar / No por ahora */}
              <TouchableOpacity
                onPress={onClose}
                style={{ alignItems: "center", marginTop: adLoaded ? 14 : 16, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, color: C.t3, fontWeight: "600" }}>
                  {t.premium?.noAhora || "No por ahora"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}
