import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
const POCKET_WIDTH = (width - 48) / 2; // 2 columns, 16px padding on sides + 16px gap = 48

export function SavingsScreen({ navigation, onBack }) {
  const { lang } = useLanguage();
  const { appState, derived } = useFinance();
  const uid = appState?.user?.uid;
  const { pockets, loading, transfer, createPocket, totalSaved } = useSavings(uid);
  
  const [filter, setFilter] = useState("all");
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const totalIncome = derived?.totalInc || 0;
  const savingsPct = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

  const filters = useMemo(() => {
    const categories = Array.from(new Set(pockets.map(p => p.category || "General")));
    return ["all", ...categories];
  }, [pockets]);

  const filteredPockets = useMemo(() => {
    if (filter === "all") return pockets;
    return pockets.filter(p => (p.category || "General") === filter);
  }, [pockets, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => onBack ? onBack() : navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ fontFamily: F.mono, fontSize: 13, color: "#FFF", letterSpacing: 3, fontWeight: "900" }}>
          {lang === 'en' ? "SAVINGS" : "AHORROS"}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity 
            onPress={() => setShowCreate(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
          >
            <Ionicons name="folder-open" size={14} color="#FFF" />
            <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFF" }}>{lang === 'en' ? "NEW" : "NUEVO"}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowTransfer(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
          >
            <Ionicons name="swap-horizontal" size={16} color="#000" />
            <Text style={{ fontSize: 10, fontWeight: "900", color: "#000" }}>{lang === 'en' ? "TRANSFER" : "TRANSFERIR"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Círculo Principal */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 30 }}>
          <CircleProgress 
            percentage={savingsPct} 
            size={190} 
            strokeWidth={10} 
            color={C.gold} 
            label={lang === 'en' ? "SAVED" : "AHORRADO"}
            subLabel={money(totalSaved, "RD$")}
          />
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.t4, marginTop: 16 }}>
            {lang === 'en' ? "OF" : "DE"} {money(totalIncome, "RD$")} {lang === 'en' ? "TOTAL INCOME" : "EN INGRESOS TOTALES"}
          </Text>
        </View>

        {/* Separador Elegante */}
        <View style={{ width: "85%", alignSelf: "center", height: 1, backgroundColor: "#1A1A1A", marginBottom: 24 }} />

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 24 }}>
          {filters.map(f => {
            const isAll = f === "all";
            const active = filter === f;
            const label = isAll ? (lang === 'en' ? "All" : "Todo") : f;
            return (
              <TouchableOpacity 
                key={f} 
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1, borderColor: active ? C.gold : "#1E1E1E",
                  backgroundColor: active ? C.gold + "15" : "transparent"
                }}
              >
                <Text style={{ fontFamily: F.sans, fontSize: 13, fontWeight: active ? "700" : "500", color: active ? C.gold : C.t3 }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bolsillos (Grid de 2x2) */}
        {loading ? (
          <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} />
        ) : filteredPockets.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="folder-open-outline" size={48} color={C.t4} />
            <Text style={{ color: C.t3, fontSize: 14, marginTop: 12, marginBottom: 20 }}>
              {lang === 'en' ? "No pockets found." : "Aún no hay bolsillos."}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 16, justifyContent: "space-between" }}>
            {filteredPockets.map(p => {
              const pocketColor = p.color || C.gold;
              const pct = p.target > 0 ? Math.min(100, Math.round((p.amount / p.target) * 100)) : 100;
              
              return (
                <TouchableOpacity 
                  key={p.id} 
                  onPress={() => setSelectedPocket(p)}
                  style={{ width: POCKET_WIDTH, marginBottom: 8 }}
                >
                  {/* Forma de Carpeta: Tab en la parte superior izquierda */}
                  <View style={{ width: "40%", height: 12, backgroundColor: pocketColor + "25", borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
                  
                  {/* Cuerpo principal de la carpeta */}
                  <View style={{ backgroundColor: "#111", borderRadius: 16, borderTopLeftRadius: 0, borderWidth: 1, borderColor: pocketColor + "40", padding: 14 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: pocketColor + "15", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={p.icon || "wallet"} size={16} color={pocketColor} />
                      </View>
                      <Text style={{ fontFamily: F.mono, fontSize: 9, color: pocketColor, fontWeight: "800" }}>{pct}%</Text>
                    </View>
                    
                    <Text style={{ fontFamily: F.mono, fontSize: 11, color: "#FFF", marginBottom: 4 }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ fontFamily: F.serif, fontSize: 18, color: pocketColor, marginBottom: 8, letterSpacing: -0.5 }}>{money(p.amount, "RD$")}</Text>
                    
                    {/* Progress Bar Mini */}
                    <View style={{ width: "100%", height: 4, backgroundColor: "#1A1A1A", borderRadius: 2, overflow: "hidden", marginTop: "auto" }}>
                      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: pocketColor, borderRadius: 2 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      <PocketDetail 
        visible={!!selectedPocket} 
        pocket={selectedPocket} 
        onClose={() => setSelectedPocket(null)} 
        uid={uid}
        lang={lang}
      />
      <TransferModal 
        visible={showTransfer} 
        onClose={() => setShowTransfer(false)} 
        pockets={pockets} 
        userBalance={derived?.balance || 0}
        onTransfer={transfer}
        lang={lang}
      />
      <CreatePocketModal 
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPocket}
        lang={lang}
      />
    </SafeAreaView>
  );
}
