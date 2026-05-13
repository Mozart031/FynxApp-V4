import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../../constants/themes";
import { useFinance } from "../../context/FinanceContext";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../utils/formatters";
import { CATS } from "../../constants";

const GOLD = "#D4AF37";

export function BudgetWidget({ hidden, slideDelay = 0 }) {
  const { appState } = useFinance();
  const { t, lang } = useLanguage();
  const { budgets = {}, expenses = [], user = {} } = appState || {};
  const cur = user.currency || "RD$";

  const budgetItems = Object.keys(budgets).slice(0, 3).map((key) => {
    const limit = budgets[key] || 0;
    const spent = expenses
      .filter((e) => e.cat === key)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const pct = limit > 0 ? Math.min(1, spent / limit) : 0;
    return { key, limit, spent, pct };
  });

  // ── Solo native driver — fade+slide del widget completo ─────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  // Glow overlay — native opacity
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: slideDelay,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay: slideDelay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Animated gold border — fluid, every so often
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(glowAnim, {
          toValue: 1, duration: 2000,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0, duration: 2000,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.delay(3500),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.cardContainer}>
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Animated Border — native opacity ✓ */}
      <Animated.View
        style={[styles.animatedBorder, {
          opacity: glowAnim.interpolate({
            inputRange: [0, 1], outputRange: [0, 0.8],
          }),
        }]}
        pointerEvents="none"
      />

      {/* Todo el contenido — native fade+slide ✓ */}
      <Animated.View style={[
        styles.cardInner,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleDot} />
            <Text style={styles.title}>{t.widgets?.presupuestos || "PRESUPUESTOS"}</Text>
          </View>
          <Ionicons name="pie-chart-outline" size={14} color={GOLD + "50"} />
        </View>

        {budgetItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={24} color={GOLD + "25"} />
            <Text style={styles.emptyText}>{t.widgets?.sinPresupuestos || "Sin presupuestos configurados"}</Text>
          </View>
        ) : (
          budgetItems.map(({ key, limit, spent, pct }) => (
            <View key={key} style={styles.budgetRow}>
              <View style={styles.budgetMeta}>
                <Text style={styles.budgetKey}>
                  {(CATS[key]?.label?.[lang] || key).toUpperCase()}
                </Text>
                <Text style={styles.budgetVal}>
                  {hidden
                    ? "•••• / ••••"
                    : `${money(spent, cur)} / ${money(limit, cur)}`}
                </Text>
              </View>
              {/* Barra estática — sin JS driver, cero conflictos */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                {pct > 0.03 && (
                  <View style={[styles.barTip, { left: `${Math.min(pct * 100 - 2, 95)}%` }]} />
                )}
              </View>
              <Text style={styles.barPct}>{Math.round(pct * 100)}%</Text>
            </View>
          ))
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.03)",
    backgroundColor: "rgba(0,0,0,0.5)",
    elevation: 4,
  },
  animatedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: GOLD,
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
  budgetRow: { marginBottom: 14 },
  budgetMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  budgetKey: { fontFamily: F.mono, fontSize: 9, color: C.t2, letterSpacing: 1.5 },
  budgetVal: { fontFamily: F.mono, fontSize: 9, color: GOLD + "70" },
  barTrack: {
    height: 4, backgroundColor: GOLD + "12", borderRadius: 2,
    overflow: "visible", position: "relative", marginBottom: 4,
  },
  barFill: { height: "100%", backgroundColor: GOLD, borderRadius: 2, opacity: 0.8 },
  barTip: {
    position: "absolute", top: -3,
    width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 5, elevation: 4,
  },
  barPct: { fontFamily: F.mono, fontSize: 8, color: GOLD + "60", textAlign: "right", letterSpacing: 1 },
  emptyState: { alignItems: "center", paddingVertical: 16, gap: 8 },
  emptyText: { fontFamily: F.mono, fontSize: 10, color: C.t3, letterSpacing: 1 },
});
