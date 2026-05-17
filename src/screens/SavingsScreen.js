/**
 * FYNX ELITE — SavingsScreen v3
 * Diseño orgánico: hero radial, tarjetas tipo "bolsillos de tela", animaciones suaves.
 */
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions, Animated, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { CircleProgress } from "../components/CircleProgress";
import { TransferModal } from "../components/TransferModal";
import { CreatePocketModal } from "../components/CreatePocketModal";
import { PocketDetail } from "../components/PocketDetail";
import { useSavings } from "../hooks/useSavings";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { money } from "../utils/formatters";

const { width } = Dimensions.get("window");
const GOLD = "#D4AF37";

// ── Tarjeta de bolsillo orgánica ─────────────────────────────────────────────
const PocketCard = React.memo(function PocketCard({ pocket, onPress, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const color = pocket.color || GOLD;
  const pct = pocket.target > 0
    ? Math.min(100, Math.round((pocket.amount / pocket.target) * 100))
    : 100;
  const isComplete = pct >= 100;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 16 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {/* Folder tab */}
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <View style={{
            width: 48, height: 14, borderTopLeftRadius: 10, borderTopRightRadius: 10,
            backgroundColor: color + "30",
          }} />
        </View>

        {/* Card body */}
        <View style={{
          backgroundColor: "rgba(15,15,15,0.9)",
          borderRadius: 20, borderTopLeftRadius: 0,
          borderWidth: 1, borderColor: color + "35",
          padding: 18, overflow: "hidden",
        }}>
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Top row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: color + "18", alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: color + "40",
            }}>
              <Ionicons name={pocket.icon || "wallet"} size={18} color={color} />
            </View>

            <View style={{ alignItems: "flex-end" }}>
              {isComplete ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: color + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Ionicons name="checkmark-circle" size={12} color={color} />
                  <Text style={{ fontFamily: F.monoB, fontSize: 9, color }}>DONE</Text>
                </View>
              ) : (
                <Text style={{ fontFamily: F.monoB, fontSize: 15, color }}>{pct}%</Text>
              )}
            </View>
          </View>

          {/* Name */}
          <Text style={{ fontFamily: F.monoB, fontSize: 13, color: "#FFF", marginBottom: 4 }} numberOfLines={2}>
            {pocket.name}
          </Text>

          {/* Amount */}
          <Text style={{ fontFamily: F.mono, fontSize: 22, color, marginBottom: 14, letterSpacing: -0.5 }}>
            {money(pocket.amount, "RD$")}
          </Text>

          {/* Progress track */}
          <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <View style={{
              width: `${pct}%`, height: "100%",
              backgroundColor: color, borderRadius: 3,
              shadowColor: color, shadowOpacity: 0.7, shadowRadius: 4,
            }} />
          </View>

          {pocket.target > 0 && (
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
              {money(pocket.target, "RD$")} {pocket.currency || "META"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = React.memo(function StatPill({ icon, label, value, color = GOLD }) {
  return (
    <View style={{
      flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)",
      borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    }}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 6 }} />
      <Text style={{ fontFamily: F.monoB, fontSize: 15, color: "#FFF" }}>{value}</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3, textAlign: "center" }}>{label}</Text>
    </View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export function SavingsScreen({ navigation, onBack, isSubTab }) {
  const { lang } = useLanguage();
  const { appState, derived } = useFinance();
  const uid = appState?.user?.uid;
  const cur = appState?.user?.currency || "RD$";
  const { pockets, loading, transfer, createPocket, deletePocket, totalSaved } = useSavings(uid);

  const [filter, setFilter] = useState("all");
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const totalIncome = derived?.totalInc || 0;
  const savingsPct = totalIncome > 0 ? Math.min(100, Math.round((totalSaved / totalIncome) * 100)) : 0;
  const completedCount = pockets.filter(p => p.target > 0 && p.amount >= p.target).length;
  const activeCount = pockets.filter(p => p.target > 0 && p.amount < p.target).length;

  const categories = useMemo(() => {
    const cats = Array.from(new Set(pockets.map(p => p.category || "General")));
    return ["all", ...cats];
  }, [pockets]);

  const filteredPockets = useMemo(() =>
    filter === "all" ? pockets : pockets.filter(p => (p.category || "General") === filter),
    [pockets, filter]
  );

  // Split into 2-col grid
  const { leftCol, rightCol } = useMemo(() => {
    return {
      leftCol: filteredPockets.filter((_, i) => i % 2 === 0),
      rightCol: filteredPockets.filter((_, i) => i % 2 !== 0)
    };
  }, [filteredPockets]);

  const Container = isSubTab ? View : SafeAreaView;

  return (
    <Container style={{ flex: 1, backgroundColor: isSubTab ? "transparent" : "#000" }} edges={isSubTab ? undefined : ["top", "left", "right"]}>

      {/* ── HEADER ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: isSubTab ? 0 : 8, paddingBottom: 16 }}>
        {!isSubTab ? (
          <TouchableOpacity onPress={() => onBack ? onBack() : navigation?.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: F.monoB, fontSize: 14, color: "#FFF", letterSpacing: 3 }}>
            {lang === "en" ? "SAVINGS" : "AHORROS"}
          </Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            {pockets.length} {lang === "en" ? "POCKETS" : "BOLSILLOS"}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowCreate(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HERO: Círculo + stats ── */}
        <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 }}>
          <CircleProgress
            percentage={savingsPct}
            size={180}
            strokeWidth={10}
            color={GOLD}
            label={lang === "en" ? "SAVED" : "AHORRADO"}
            subLabel={money(totalSaved, cur)}
          />

          <Text style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 12 }}>
            {lang === "en" ? "OF" : "DE"} {money(totalIncome, cur)} {lang === "en" ? "INCOME" : "EN INGRESOS"}
          </Text>
        </View>

        {/* ── STATS ROW ── */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 28 }}>
          <StatPill icon="folder-open-outline" label={lang === "en" ? "ACTIVE" : "ACTIVOS"} value={activeCount} color={GOLD} />
          <StatPill icon="checkmark-circle-outline" label={lang === "en" ? "COMPLETED" : "COMPLETOS"} value={completedCount} color={C.mint} />
          <StatPill icon="swap-horizontal-outline" label={lang === "en" ? "TRANSFER" : "MOVER"} value="→"
            color={C.sky}
          />
        </View>

        {/* Transfer button on stats row tap */}
        <TouchableOpacity onPress={() => setShowTransfer(true)} style={{ marginHorizontal: 20, marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }} activeOpacity={0.7}>
          <Ionicons name="swap-horizontal" size={18} color={GOLD} />
          <Text style={{ fontFamily: F.monoB, fontSize: 12, color: GOLD, letterSpacing: 1 }}>
            {lang === "en" ? "TRANSFER BETWEEN POCKETS" : "TRANSFERIR ENTRE BOLSILLOS"}
          </Text>
        </TouchableOpacity>

        {/* ── FILTER CHIPS ── */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 20 }}>
            {categories.map(f => {
              const active = filter === f;
              const label = f === "all" ? (lang === "en" ? "All" : "Todo") : f;
              return (
                <TouchableOpacity key={f} onPress={() => setFilter(f)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: active ? GOLD : "rgba(255,255,255,0.1)", backgroundColor: active ? GOLD + "18" : "transparent" }}
                >
                  <Text style={{ fontFamily: F.sansM, fontSize: 12, color: active ? GOLD : "rgba(255,255,255,0.45)" }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── POCKETS GRID (2 columnas orgánicas) ── */}
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 40 }} />
        ) : filteredPockets.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40, paddingHorizontal: 40 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
              <Ionicons name="folder-open-outline" size={36} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={{ fontFamily: F.monoB, fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", letterSpacing: 1 }}>
              {lang === "en" ? "NO POCKETS YET" : "SIN BOLSILLOS AÚN"}
            </Text>
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8, lineHeight: 18 }}>
              {lang === "en" ? "Create your first savings pocket to start tracking your goals." : "Crea tu primer bolsillo de ahorro para comenzar a rastrear tus metas."}
            </Text>
            <TouchableOpacity onPress={() => setShowCreate(true)} style={{ marginTop: 20, backgroundColor: GOLD, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
              <Text style={{ fontFamily: F.monoB, fontSize: 12, color: "#000", letterSpacing: 1 }}>
                {lang === "en" ? "+ CREATE POCKET" : "+ CREAR BOLSILLO"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}>
            {/* Left column */}
            <View style={{ flex: 1 }}>
              {leftCol.map((p, i) => (
                <PocketCard key={p.id} pocket={p} index={i * 2} onPress={() => setSelectedPocket(p)} />
              ))}
            </View>
            {/* Right column — offset visual */}
            <View style={{ flex: 1, marginTop: 30 }}>
              {rightCol.map((p, i) => (
                <PocketCard key={p.id} pocket={p} index={i * 2 + 1} onPress={() => setSelectedPocket(p)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── MODALES ── */}
      <PocketDetail visible={!!selectedPocket} pocket={selectedPocket} onClose={() => setSelectedPocket(null)} onDelete={deletePocket} uid={uid} lang={lang} />
      <TransferModal visible={showTransfer} onClose={() => setShowTransfer(false)} pockets={pockets} userBalance={derived?.balance || 0} onTransfer={transfer} lang={lang} />
      <CreatePocketModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={createPocket} lang={lang} />
    </Container>
  );
}
