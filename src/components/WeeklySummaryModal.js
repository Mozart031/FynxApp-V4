import React, { useMemo } from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";
import { score } from "../utils/finance";

function getWeekRange(weeksAgo) {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() - weeksAgo * 7);
  endOfWeek.setHours(23, 59, 59, 999);
  const startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(endOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);
  return { start: startOfWeek, end: endOfWeek };
}

function formatWeekLabel(start, end, lang) {
  const opts = { day: "numeric", month: "short" };
  const locale = lang === "en" ? "en-US" : "es-DO";
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`;
}

export function WeeklySummaryModal({ visible, onClose, appState, lang, cur }) {
  const expenses = appState?.expenses || [];
  const income = appState?.income || [];
  const budgets = appState?.budgets || {};
  const streakDays = appState?.streakDays || [];

  const weeks = useMemo(() => {
    return [0, 1, 2, 3].map(weeksAgo => {
      const { start, end } = getWeekRange(weeksAgo);
      const weekExp = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
      const weekInc = income.filter(i => {
        const d = new Date(i.date || "");
        return d >= start && d <= end;
      });
      const totalExp = weekExp.reduce((a, b) => a + (b.amount || 0), 0);
      const totalInc = weekInc.reduce((a, b) => a + (b.amount || 0), 0);

      // Top category
      const catMap = {};
      weekExp.forEach(e => { catMap[e.cat] = (catMap[e.cat] || 0) + e.amount; });
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

      // Score
      const sc = score(weekExp, totalInc || appState?.user?.monthlyInc || 0, budgets, streakDays, []);

      return {
        label: weeksAgo === 0
          ? (lang === "en" ? "This Week" : "Esta Semana")
          : weeksAgo === 1
            ? (lang === "en" ? "Last Week" : "Semana Pasada")
            : formatWeekLabel(start, end, lang),
        totalExp,
        totalInc,
        balance: totalInc - totalExp,
        topCat: topCat ? topCat[0] : null,
        topCatAmt: topCat ? topCat[1] : 0,
        score: sc.total,
        txCount: weekExp.length,
        isThisWeek: weeksAgo === 0,
      };
    });
  }, [expenses, income, budgets, streakDays, appState?.user?.monthlyInc, lang]);

  const scoreColor = (s) => s >= 80 ? C.mint : s >= 60 ? C.gold : s >= 40 ? C.orange : C.rose;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" }}>
        <BlurView intensity={20} tint="dark" style={{ backgroundColor: "#0A0A0A", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: C.mint + "30", maxHeight: "88%", overflow: "hidden" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: C.border2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.mint + "15", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="bar-chart" size={18} color={C.mint} />
              </View>
              <View>
                <Text style={{ fontSize: 10, color: C.mint, fontWeight: "800", letterSpacing: 2, fontFamily: F.mono }}>TARS ANALYTICS</Text>
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#FFF", marginTop: 1 }}>
                  {lang === "en" ? "Weekly Summary" : "Resumen Semanal"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.card2, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={18} color={C.t3} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
            {weeks.map((week, i) => (
              <View key={i} style={{
                backgroundColor: week.isThisWeek ? C.mint + "08" : "#111",
                borderRadius: 20, padding: 18,
                borderWidth: 1, borderColor: week.isThisWeek ? C.mint + "30" : "rgba(255,255,255,0.06)"
              }}>
                {/* Week label */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: week.isThisWeek ? C.mint : C.t2, letterSpacing: 0.5 }}>
                    {week.label}
                  </Text>
                  {/* Score badge */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: scoreColor(week.score) + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: scoreColor(week.score) + "40" }}>
                    <Text style={{ fontSize: 9, fontWeight: "900", color: scoreColor(week.score), fontFamily: F.mono }}>
                      {Math.round(week.score)} pts
                    </Text>
                  </View>
                </View>

                {/* Metrics row */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 9, color: C.t4, fontWeight: "700", letterSpacing: 1, marginBottom: 4 }}>
                      {lang === "en" ? "SPENT" : "GASTADO"}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: C.rose }}>
                      {money(week.totalExp, cur)}
                    </Text>
                    <Text style={{ fontSize: 9, color: C.t4, marginTop: 3 }}>
                      {week.txCount} {lang === "en" ? "transactions" : "movimientos"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 9, color: C.t4, fontWeight: "700", letterSpacing: 1, marginBottom: 4 }}>
                      {lang === "en" ? "BALANCE" : "BALANCE"}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: week.balance >= 0 ? C.mint : C.rose }}>
                      {money(week.balance, cur)}
                    </Text>
                    <Text style={{ fontSize: 9, color: C.t4, marginTop: 3 }}>
                      {week.balance >= 0 ? (lang === "en" ? "surplus" : "superávit") : (lang === "en" ? "deficit" : "déficit")}
                    </Text>
                  </View>
                </View>

                {/* Top category */}
                {week.topCat && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="trending-up" size={13} color={C.t4} />
                    <Text style={{ fontSize: 11, color: C.t3 }}>
                      {lang === "en" ? "Top category: " : "Mayor categoría: "}
                      <Text style={{ color: C.gold, fontWeight: "800" }}>{week.topCat}</Text>
                      {" · "}{money(week.topCatAmt, cur)}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* TARS message */}
            <View style={{ backgroundColor: "#0D1A1A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.mint + "20", flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <Ionicons name="hardware-chip-outline" size={16} color={C.mint} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 12, color: C.t2, lineHeight: 19, fontFamily: F.mono }}>
                {lang === "en"
                  ? "> Tracking 4 weeks of activity. Patterns form habits. Habits form wealth."
                  : "> Monitoreando 4 semanas de actividad. Los patrones forman hábitos. Los hábitos generan riqueza."}
              </Text>
            </View>
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}
