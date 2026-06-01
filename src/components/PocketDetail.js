import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator, Alert, TextInput, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";
import { useEliteAlert } from "../context/AlertContext";

export function PocketDetail({ visible, pocket, onClose, onDelete, onDeposit, onWithdraw, uid, lang }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null); // 'deposit' | 'withdraw'
  const [actionAmount, setActionAmount] = useState("");
  const [isRegistered, setIsRegistered] = useState(true);
  const { showAlert } = useEliteAlert();

  const prevPocketRef = useRef(pocket);
  if (visible && pocket && pocket !== prevPocketRef.current) {
    setTransactions(pocket.transactions || []);
    setLoading(false);
  }
  prevPocketRef.current = pocket;

  if (!pocket) return null;

  const pocketColor = pocket.color || C.gold;

  const handleDelete = () => {
    showAlert(
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

  const handleAction = () => {
    const amt = parseFloat(actionAmount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) return;
    
    if (actionType === "deposit") {
      onDeposit(pocket.id, amt, isRegistered);
    } else {
      onWithdraw(pocket.id, amt, isRegistered);
    }
    
    setActionType(null);
    setActionAmount("");
    setIsRegistered(true);
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

            {/* Botones de Acción */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 32 }}>
              <TouchableOpacity onPress={() => setActionType("deposit")} style={{ flex: 1, backgroundColor: pocketColor, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: "#000" }}>{lang === 'en' ? "DEPOSIT" : "ABONAR"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActionType("withdraw")} style={{ flex: 1, backgroundColor: "transparent", borderWidth: 1, borderColor: pocketColor, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: pocketColor }}>{lang === 'en' ? "WITHDRAW" : "RETIRAR"}</Text>
              </TouchableOpacity>
            </View>

            {/* Historial de Movimientos */}
            <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
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

      {/* Modal de Acción (Abonar/Retirar) */}
      <Modal visible={!!actionType} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.8)", padding: 24 }}>
          <View style={{ backgroundColor: "#1A1A1A", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <Text style={{ fontFamily: F.monoB, fontSize: 16, color: "#FFF", marginBottom: 16 }}>
              {actionType === "deposit" ? (lang === 'en' ? "DEPOSIT FUNDS" : "ABONAR FONDOS") : (lang === 'en' ? "WITHDRAW FUNDS" : "RETIRAR FONDOS")}
            </Text>

            <View style={{ backgroundColor: "#111", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: F.serif, fontSize: 24, color: C.t3, marginRight: 8 }}>RD$</Text>
              <TextInput
                style={{ flex: 1, fontFamily: F.serif, fontSize: 24, color: "#FFF" }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.t4}
                value={actionAmount}
                onChangeText={setActionAmount}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingHorizontal: 4 }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: "#FFF", marginBottom: 4 }}>
                  {lang === 'en' ? "Registered Action" : "Acción Registrada"}
                </Text>
                <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.t4, lineHeight: 16 }}>
                  {actionType === "deposit"
                    ? (lang === 'en' ? "Deducts from global balance." : "Descuenta el monto del balance general como gasto.")
                    : (lang === 'en' ? "Adds to global balance." : "Añade el monto al balance general como ingreso.")}
                </Text>
              </View>
              <Switch
                value={isRegistered}
                onValueChange={setIsRegistered}
                trackColor={{ false: "#333", true: pocketColor + "80" }}
                thumbColor={isRegistered ? pocketColor : "#f4f3f4"}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setActionType(null)} style={{ flex: 1, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: C.t3 }}>{lang === 'en' ? "CANCEL" : "CANCELAR"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAction} style={{ flex: 1, backgroundColor: pocketColor, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: "#000" }}>{lang === 'en' ? "CONFIRM" : "CONFIRMAR"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
