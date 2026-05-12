import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../../constants/themes";
import { useFinance } from "../../context/FinanceContext";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../utils/formatters";

const GOLD = "#D4AF37";

export function GoalWidget({ hidden, slideDelay = 0 }) {
  const { appState } = useFinance();
  const { t } = useLanguage();
  const { goals = [], user = {} } = appState || {};
  const cur = user.currency || "RD$";
  const displayGoals = goals.slice(0, 2);

  // ── Solo native driver ───────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
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
        Animated.delay(800),
        Animated.timing(glowAnim, {
          toValue: 1, duration: 2000,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0, duration: 2000,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.delay(4000),
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

      {/* Contenido — native fade+slide ✓ */}
      <Animated.View style={[
        styles.cardInner,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleDot} />
            <Text style={styles.title}>{t.widgets?.metasAhorro || "METAS DE AHORRO"}</Text>
          </View>
          <Ionicons name="flag-outline" size={14} color={GOLD + "50"} />
        </View>

        {displayGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={24} color={GOLD + "25"} />
            <Text style={styles.emptyText}>{t.widgets?.sinMetas || "Sin metas configuradas"}</Text>
          </View>
        ) : (
          <View style={styles.goalsRow}>
            {displayGoals.map((goal, i) => {
              const target  = goal.target  || goal.amount || 0;
              const current = goal.current || goal.saved  || 0;
              const pct     = target > 0 ? Math.min(1, current / target) : 0;
              const name    = (goal.name || goal.label || `Meta ${i + 1}`)
                .slice(0, 12).toUpperCase();

              return (
                <View key={goal.id || i} style={styles.goalCard}>
                  {/* Indicador % */}
                  <View style={styles.ringWrapper}>
                    <View style={styles.ringCenter}>
                      <Text style={styles.ringPct}>{Math.round(pct * 100)}</Text>
                      <Text style={styles.ringUnit}>%</Text>
                    </View>
                  </View>

                  {/* Barra estática — sin JS driver ✓ */}
                  <View style={styles.goalBarTrack}>
                    <View style={[styles.goalBarFill, { width: `${pct * 100}%` }]} />
                    {pct > 0.04 && (
                      <View style={[styles.barTip, { left: `${Math.min(pct * 100 - 3, 92)}%` }]} />
                    )}
                  </View>

                  <Text style={styles.goalName}>{name}</Text>
                  <Text style={styles.goalAmount}>
                    {hidden ? "••••••" : money(current, cur)}
                  </Text>
                  <Text style={styles.goalTarget}>
                    {hidden ? "/ ••••••" : `/ ${money(target, cur)}`}
                  </Text>
                </View>
              );
            })}

            {displayGoals.length === 1 && (
              <View style={[styles.goalCard, styles.goalCardEmpty]}>
                <Ionicons name="add-circle-outline" size={26} color={GOLD + "25"} />
                <Text style={styles.addGoalText}>{t.metas?.nueva?.toUpperCase() || "NUEVA META"}</Text>
              </View>
            )}
          </View>
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
  goalsRow: { flexDirection: "row", gap: 12 },
  goalCard: {
    flex: 1, backgroundColor: GOLD + "07",
    borderRadius: 14, borderWidth: 1, borderColor: GOLD + "20",
    padding: 14, alignItems: "center",
  },
  goalCardEmpty: {
    borderStyle: "dashed", borderColor: GOLD + "18",
    justifyContent: "center", gap: 8,
  },
  ringWrapper: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10, borderWidth: 2, borderColor: GOLD + "30",
    backgroundColor: GOLD + "08",
  },
  ringCenter: { flexDirection: "row", alignItems: "flex-end" },
  ringPct: { fontFamily: F.monoB, fontSize: 20, color: GOLD, lineHeight: 22 },
  ringUnit: { fontFamily: F.mono, fontSize: 10, color: GOLD + "80", marginBottom: 2 },
  goalBarTrack: {
    width: "100%", height: 3,
    backgroundColor: GOLD + "15", borderRadius: 2,
    overflow: "visible", position: "relative", marginBottom: 10,
  },
  goalBarFill: { height: "100%", backgroundColor: GOLD, borderRadius: 2, opacity: 0.8 },
  barTip: {
    position: "absolute", top: -3,
    width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 3,
  },
  goalName: {
    fontFamily: F.mono, fontSize: 8, color: C.t3,
    letterSpacing: 1.5, marginBottom: 4, textAlign: "center",
  },
  goalAmount: { fontFamily: F.monoB, fontSize: 13, color: C.t1, textAlign: "center" },
  goalTarget: { fontFamily: F.mono, fontSize: 9, color: C.t3, textAlign: "center", marginTop: 2 },
  addGoalText: { fontFamily: F.mono, fontSize: 8, color: GOLD + "40", letterSpacing: 1.5 },
  emptyState: { alignItems: "center", paddingVertical: 16, gap: 8 },
  emptyText: { fontFamily: F.mono, fontSize: 10, color: C.t3, letterSpacing: 1 },
});
