import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { C, F } from "../../constants/themes";
import { useFinance } from "../../context/FinanceContext";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../utils/formatters";
import { calculateRank, RANKS } from "../../utils/nudges";

const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";

export function CashFlowWidget({ hidden, slideDelay = 0, onPressIncome }) {
  const { derived, appState } = useFinance();
  const { lang } = useLanguage();
  const { totalInc = 0, totalExp = 0 } = derived || {};
  const { user = {} } = appState || {};
  const cur = user.currency || "RD$";
  
  const rank = useMemo(() => calculateRank(appState, derived), [appState, derived]);

  // ── Animaciones — TODAS native driver (opacity + transform) ──
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  // Glow overlay — native driver opacity
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada stagger
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 480, delay: slideDelay,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 480, delay: slideDelay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Animated border — fluid, depends on rank
    if (rank !== RANKS.BRONZE) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(1000), // Wait a bit
          Animated.timing(glowAnim, {
            toValue: 1, duration: rank === RANKS.GOLD ? 2000 : 1500,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0, duration: rank === RANKS.GOLD ? 2000 : 1500,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.delay(rank === RANKS.GOLD ? 3000 : 5000), // Pausa
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [rank]);

  const ratio = totalInc + totalExp > 0
    ? (totalInc / (totalInc + totalExp)) * 100
    : 0;

  const borderColor = rank === RANKS.GOLD ? GOLD : rank === RANKS.SILVER ? SILVER : C.border2;
  const pulseOpacity = rank === RANKS.GOLD ? 0.8 : rank === RANKS.SILVER ? 0.5 : 0;

  return (
    // Contenedor ESTÁTICO — sin animaciones mixtas
    <View style={styles.cardContainer}>
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Animated Border — solo opacity, native driver ✓ */}
      <Animated.View
        style={[styles.animatedBorder, {
          borderColor: borderColor,
          opacity: rank === RANKS.BRONZE ? 1 : glowAnim.interpolate({
            inputRange: [0, 1], outputRange: [rank === RANKS.BRONZE ? 1 : 0.2, pulseOpacity],
          }),
        }]}
        pointerEvents="none"
      />

      {/* Contenido — fade + slide, native driver ✓ */}
      <Animated.View style={[
        styles.cardInner,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleDot} />
            <Text style={styles.title}>{lang === 'en' ? "CASH FLOW" : "FLUJO DE CAJA"}</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <TouchableOpacity style={styles.metric} onPress={onPressIncome} activeOpacity={0.7}>
            <Text style={styles.metricLabel}>{lang === 'en' ? "INCOME" : "ENTRADAS"}</Text>
            <Text style={styles.metricValue}>
              {hidden ? "••••••" : money(totalInc, cur)}
            </Text>
          </TouchableOpacity>
          <View style={styles.metricSep} />
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{lang === 'en' ? "OUTFLOWS" : "SALIDAS"}</Text>
            <Text style={[styles.metricValue, { color: GOLD + "70" }]}>
              {hidden ? "••••••" : money(totalExp, cur)}
            </Text>
          </View>
          <View style={styles.metricSep} />
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>RATIO</Text>
            <Text style={[styles.metricValue, { fontSize: 15 }]}>
              {ratio.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Barra de ratio — estática (width calculado, no animado) */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${ratio}%` }]} />
        </View>
        <Text style={styles.barCaption}>
          {ratio >= 50 
            ? (lang === 'en' ? "▲ INCOME DOMINANT" : "▲ INGRESOS DOMINAN")
            : totalInc > 0 
              ? (lang === 'en' ? "▼ EXPENSES DOMINANT" : "▼ GASTOS DOMINAN")
              : (lang === 'en' ? "NO DATA YET" : "SIN DATOS AÚN")}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    backgroundColor: "rgba(0,0,0,0.5)", // Sin sombras doradas estáticas
    elevation: 4, // elevation sutil
  },
  animatedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 20,
  },
  cardInner: { padding: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD },
  title: { fontFamily: F.mono, fontSize: 10, color: C.t3, letterSpacing: 2 },
  liveBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    backgroundColor: GOLD + "15", borderWidth: 1, borderColor: GOLD + "30",
  },
  liveBadgeText: { fontFamily: F.monoB, fontSize: 7, color: GOLD, letterSpacing: 2 },
  metricsRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  metric: { flex: 1 },
  metricLabel: { fontFamily: F.mono, fontSize: 8, color: C.t3, letterSpacing: 1.5, marginBottom: 5 },
  metricValue: { fontFamily: F.monoB, fontSize: 14, color: GOLD },
  metricSep: { width: 1, height: 32, backgroundColor: GOLD + "18", marginHorizontal: 12 },
  barTrack: {
    height: 3, backgroundColor: GOLD + "15", borderRadius: 2,
    overflow: "hidden", marginBottom: 6,
  },
  barFill: { height: "100%", backgroundColor: GOLD, borderRadius: 2, opacity: 0.75 },
  barCaption: { fontFamily: F.mono, fontSize: 8, color: C.t3, letterSpacing: 1.5, textAlign: "right" },
});
