import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";

export function DebtDetailScreen({ visible, debt, onClose, onDeleteTx, lang, cur }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const prevDebtRef = useRef(debt);
  if (visible && debt && debt !== prevDebtRef.current) {
    setTransactions(debt.transactions || []);
  }
  prevDebtRef.current = debt;

  if (!debt) return null;

  const debtColor = debt.color || C.rose;
  const pctPaid = debt.limit > 0 ? Math.round(((debt.limit - debt.balance) / debt.limit) * 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={{ backgroundColor: "#111", borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "85%", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 24, paddingBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: debtColor + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: debtColor + "30" }}>
                <Ionicons name="card-outline" size={22} color={debtColor} />
              </View>
              <Text style={{ fontFamily: F.serif, fontSize: 24, color: "#FFF", flex: 1, flexWrap: "wrap", lineHeight: 28 }}>{debt.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={20} color={C.t3} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            {/* Monto Actual */}
            <Text style={{ fontFamily: F.serif, fontSize: 44, color: debtColor, letterSpacing: -1 }}>
              {money(debt.balance || 0, cur)}
            </Text>
            
            <View style={{ flexDirection: "row", marginTop: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.t4, marginBottom: 2 }}>{lang === 'en' ? "MIN PAYMENT" : "PAGO MÍNIMO"}</Text>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: C.t1 }}>{money(debt.minPay || 0, cur)}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.t4, marginBottom: 2 }}>{lang === 'en' ? "INTEREST RATE" : "TASA DE INTERÉS"}</Text>
                <Text style={{ fontFamily: F.sansB, fontSize: 14, color: C.gold }}>{debt.rate}%</Text>
              </View>
            </View>

            {debt.limit > 0 && (
              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.t3 }}>{lang === 'en' ? "PROGRESS" : "PROGRESO"}</Text>
                  <Text style={{ fontFamily: F.mono, fontSize: 10, color: debtColor }}>{pctPaid}% {lang === 'en' ? "paid" : "pagado"}</Text>
                </View>
                <View style={{ width: "100%", height: 6, backgroundColor: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${pctPaid}%`, height: "100%", backgroundColor: debtColor, borderRadius: 3 }} />
                </View>
              </View>
            )}

            {/* Historial de Movimientos */}
            <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, marginTop: 32 }}>
              {lang === 'en' ? "TRANSACTIONS" : "HISTORIAL DE ABONOS"}
            </Text>

            {loading ? (
              <ActivityIndicator size="small" color={debtColor} style={{ marginTop: 20 }} />
            ) : transactions.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: C.t4, fontSize: 13, textAlign: "center" }}>
                  {lang === 'en' ? "No transactions recorded yet." : "Aún no hay abonos registrados para esta deuda."}
                </Text>
                <Text style={{ color: C.t4, fontSize: 11, textAlign: "center", marginTop: 4 }}>
                  {lang === 'en' ? "Use the + button on the main screen to register payments." : "Usa el botón central + para registrar pagos."}
                </Text>
              </View>
            ) : (
              transactions.map((tx, idx) => {
                const isPositive = tx.amount >= 0;
                return (
                  <TouchableOpacity 
                    key={tx.id || idx} 
                    activeOpacity={0.7}
                    onLongPress={() => onDeleteTx && onDeleteTx(debt.id, tx.id)}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isPositive ? C.mint + "20" : C.rose + "20", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={isPositive ? "arrow-down-outline" : "arrow-up-outline"} size={16} color={isPositive ? C.mint : C.rose} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: C.t1 }}>{tx.desc || (lang === 'en' ? "Payment" : "Abono")}</Text>
                        <Text style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{tx.date}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", flexDirection: "row", gap: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: isPositive ? C.mint : C.rose, fontFamily: F.monoB }}>
                        {isPositive ? "+" : ""}{money(tx.amount, cur)}
                      </Text>
                      {onDeleteTx && (
                        <TouchableOpacity onPress={() => onDeleteTx(debt.id, tx.id)} style={{ padding: 4, backgroundColor: C.rose + "15", borderRadius: 4 }}>
                          <Ionicons name="trash-outline" size={14} color={C.rose} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
