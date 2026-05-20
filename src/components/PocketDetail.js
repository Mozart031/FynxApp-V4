import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";

export function PocketDetail({ visible, pocket, onClose, onDelete, uid, lang }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !pocket) return;
    setLoading(true);
    setTransactions(pocket.transactions || []);
    setLoading(false);
  }, [visible, pocket]);

  if (!pocket) return null;

  const pct = pocket.target > 0 ? Math.min(100, Math.round((pocket.amount / pocket.target) * 100)) : 100;
  const pocketColor = pocket.color || C.gold;

  const handleDelete = () => {
    Alert.alert(
      lang === 'en' ? "Delete Pocket" : "Eliminar Bolsillo",
      lang === 'en' ? "Are you sure you want to delete this pocket? All its funds will be returned to your main balance." : "¿Estás seguro de que quieres eliminar este bolsillo? Sus fondos volverán a tu balance principal.",
      [
        { text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" },
        { 
          text: lang === 'en' ? "Delete" : "Eliminar", 
          style: "destructive", 
          onPress: () => {
            onDelete(pocket.id);
            onClose();
          } 
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={{ backgroundColor: "#111", borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "85%", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 24, paddingBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: pocketColor + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: pocketColor + "30" }}>
                <Ionicons name={pocket.icon || "wallet"} size={22} color={pocketColor} />
              </View>
              <Text style={{ fontFamily: F.serif, fontSize: 24, color: "#FFF", flex: 1, flexWrap: "wrap", lineHeight: 28 }}>{pocket.name}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
              <TouchableOpacity onPress={handleDelete} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239, 68, 68, 0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="trash" size={16} color={C.rose} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={20} color={C.t3} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            {/* Monto y Meta */}
            <Text style={{ fontFamily: F.serif, fontSize: 44, color: pocketColor, letterSpacing: -1 }}>
              {money(pocket.amount || 0, "RD$")}
            </Text>
            {pocket.target > 0 && (
              <Text style={{ fontFamily: F.mono, fontSize: 12, color: C.t3, textTransform: "uppercase", tracking: 1, marginTop: 4 }}>
                {lang === 'en' ? "TARGET:" : "META:"} {money(pocket.target, "RD$")}
              </Text>
            )}

            {/* Barra de progreso */}
            {pocket.target > 0 && (
              <View style={{ marginTop: 24, marginBottom: 32 }}>
                <View style={{ width: "100%", height: 6, backgroundColor: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: pocketColor, borderRadius: 3 }} />
                </View>
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: pocketColor, marginTop: 8 }}>
                  {pct}% {lang === 'en' ? "of target" : "de la meta"}
                </Text>
              </View>
            )}

            {/* Historial de Movimientos */}
            <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, marginTop: pocket.target > 0 ? 0 : 32 }}>
              {lang === 'en' ? "TRANSACTIONS" : "MOVIMIENTOS"}
            </Text>

            {loading ? (
              <ActivityIndicator size="small" color={pocketColor} style={{ marginTop: 20 }} />
            ) : transactions.length === 0 ? (
              <Text style={{ color: C.t4, fontSize: 13, textAlign: "center", marginTop: 20 }}>
                {lang === 'en' ? "No transactions yet." : "Aún no hay movimientos."}
              </Text>
            ) : (
              transactions.map((tx, idx) => {
                const isPositive = tx.amount >= 0;
                return (
                  <View key={tx.id || idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" }}>
                    <View>
                      <Text style={{ fontSize: 14, color: "#FFF", fontWeight: "600", marginBottom: 4 }}>{tx.desc}</Text>
                      <Text style={{ fontSize: 11, color: C.t4 }}>{tx.date}</Text>
                    </View>
                    <Text style={{ fontFamily: F.mono, fontSize: 14, color: isPositive ? C.mint : C.rose, fontWeight: "800" }}>
                      {isPositive ? "+" : ""}{money(tx.amount, "RD$")}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
