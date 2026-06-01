import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";

export function TransferModal({ visible, onClose, pockets, userBalance, onTransfer, lang }) {
  const [amount, setAmount] = useState("");
  const [targetPocketId, setTargetPocketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const prevVisibleRef = useRef(visible);
  if (visible && !prevVisibleRef.current) {
    setAmount("");
    setTargetPocketId(pockets.length > 0 ? pockets[0].id : null);
    setError("");
    setSuccess(false);
  }
  prevVisibleRef.current = visible;

  const handleConfirm = async () => {
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!num || num <= 0) {
      setError(lang === 'en' ? "Enter a valid amount" : "Ingresa un monto válido");
      return;
    }
    if (num > userBalance) {
      setError(lang === 'en' ? "Insufficient balance" : "Balance insuficiente");
      return;
    }
    if (!targetPocketId) {
      setError(lang === 'en' ? "Select a destination pocket" : "Selecciona un bolsillo destino");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onTransfer(targetPocketId, num, userBalance);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setLoading(false);
      }, 1500);
    } catch (e) {
      setError(e.message || "Error");
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={{ backgroundColor: "#111", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.gold, letterSpacing: 2, fontWeight: "800" }}>
                {lang === 'en' ? "TRANSFER TO SAVINGS" : "TRANSFERIR A AHORROS"}
              </Text>
              <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={20} color={C.t3} />
              </TouchableOpacity>
            </View>

            {success ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="checkmark-circle" size={80} color={C.mint} />
                <Text style={{ fontFamily: F.serif, fontSize: 24, color: "#FFF", marginTop: 16 }}>
                  {lang === 'en' ? "Transfer Successful" : "Transferencia Exitosa"}
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>MONTO</Text>
                <View style={{ backgroundColor: "#1A1A1A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 32, color: C.t2, marginRight: 8 }}>RD$</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: F.serif, fontSize: 32, color: "#FFF" }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={C.t4}
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>DESDE</Text>
                <View style={{ backgroundColor: "#151515", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", marginBottom: 12 }}>
                  <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Balance Total</Text>
                  <Text style={{ color: C.gold, fontSize: 13, fontFamily: F.mono, marginTop: 4 }}>{money(userBalance, "RD$")}</Text>
                </View>

                <View style={{ alignItems: "center", marginBottom: 12 }}>
                  <Ionicons name="arrow-down" size={20} color={C.t4} />
                </View>

                <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>HACIA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10, marginBottom: 14 }}>
                  {pockets.length === 0 ? (
                    <View style={{ backgroundColor: "#1A1A1A", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
                      <Text style={{ color: C.t4, fontSize: 12 }}>{lang === 'en' ? "No pockets available to receive funds." : "No hay bolsillos creados para recibir fondos."}</Text>
                    </View>
                  ) : pockets.map(p => (
                    <TouchableOpacity 
                      key={p.id} 
                      onPress={() => setTargetPocketId(p.id)}
                      style={{ 
                        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, 
                        borderWidth: 1.5, borderColor: targetPocketId === p.id ? p.color || C.gold : "rgba(255,255,255,0.05)",
                        backgroundColor: targetPocketId === p.id ? (p.color || C.gold) + "15" : "#1A1A1A",
                        alignItems: "center", flexDirection: "row", gap: 8
                      }}
                    >
                      <Ionicons name={p.icon || "wallet"} size={18} color={targetPocketId === p.id ? (p.color || C.gold) : C.t3} />
                      <View>
                        <Text style={{ color: targetPocketId === p.id ? "#FFF" : C.t2, fontSize: 13, fontWeight: "700" }}>{p.name}</Text>
                        <Text style={{ color: C.t4, fontSize: 10, fontFamily: F.mono }}>{money(p.amount, "RD$")}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {!!error && (
                  <Text style={{ color: C.rose, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</Text>
                )}

                <TouchableOpacity 
                  onPress={handleConfirm}
                  disabled={loading || pockets.length === 0}
                  style={{ 
                    backgroundColor: pockets.length === 0 ? "#333" : C.gold, borderRadius: 16, paddingVertical: 16, alignItems: "center", 
                    opacity: (loading || pockets.length === 0) ? 0.7 : 1, marginTop: 10
                  }}
                >
                  <Text style={{ fontFamily: F.mono, fontSize: 14, color: pockets.length === 0 ? "#888" : "#000", fontWeight: "900", letterSpacing: 1 }}>
                    {loading ? (lang === 'en' ? "PROCESSING..." : "PROCESANDO...") : (lang === 'en' ? "CONFIRM TRANSFER" : "CONFIRMAR TRANSFERENCIA")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
