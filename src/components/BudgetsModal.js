import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { ICON } from "../constants";
import { money } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";
import { useFinance } from "../context/FinanceContext";

export function BudgetsModal({ visible, onClose }) {
  const { lang, t } = useLanguage();
  const { appState: state, updateState } = useFinance();
  const [editingCat, setEditingCat] = useState(null);
  const [amount, setAmount] = useState("");

  const budgets = state.budgets || {};
  const categories = Object.keys(t.cats).filter(k => k !== "titulo");

  const activeBudgetsCount = Object.keys(budgets).length;
  
  let exceededCount = 0;
  Object.keys(budgets).forEach(cat => {
    const limit = budgets[cat];
    const exp = (state.expenses || [])
      .filter(x => {
        const d = new Date();
        return x.cat === cat && x.date && x.date.startsWith(d.toISOString().slice(0, 7));
      })
      .reduce((acc, val) => acc + val.amount, 0);
    if (exp > limit) exceededCount++;
  });

  const handleSave = () => {
    if (!editingCat) return;
    const limit = parseFloat(amount);
    const newBudgets = { ...budgets };
    if (isNaN(limit) || limit <= 0) {
      delete newBudgets[editingCat];
    } else {
      newBudgets[editingCat] = limit;
    }
    updateState({ budgets: newBudgets });
    setEditingCat(null);
    setAmount("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%", minHeight: "50%" }}>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 22, color: C.t1, fontFamily: F.sansB }}>{t.widgets?.presupuestos || "Presupuestos"}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name={ICON.close} size={28} color={C.t2} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: C.card2, padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <View>
                <Text style={{ color: C.t3, fontSize: 12, fontFamily: F.sans }}>{lang === 'en' ? "Active Budgets" : "Presupuestos Activos"}</Text>
                <Text style={{ color: C.t1, fontSize: 18, fontFamily: F.monoB }}>{activeBudgetsCount}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: exceededCount > 0 ? C.rose : C.t3, fontSize: 12, fontFamily: F.sans }}>{lang === 'en' ? "Exceeded" : "Excedidos"}</Text>
                <Text style={{ color: exceededCount > 0 ? C.rose : C.t1, fontSize: 18, fontFamily: F.monoB }}>{exceededCount}</Text>
              </View>
            </View>

            {editingCat ? (
              <View style={{ backgroundColor: C.card, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <Text style={{ color: C.t2, marginBottom: 8, fontFamily: F.sans }}>
                  {lang === 'en' ? "Budget for" : "Presupuesto para"} <Text style={{ color: C.t1, fontFamily: F.sansB }}>{t.cats[editingCat] || editingCat}</Text>
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={C.t3}
                  style={{ color: C.t1, fontSize: 24, fontFamily: F.monoB, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 8, marginBottom: 16 }}
                  autoFocus
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity onPress={() => setEditingCat(null)} style={{ flex: 1, padding: 14, backgroundColor: C.card2, borderRadius: 12, alignItems: "center" }}>
                    <Text style={{ color: C.t2, fontFamily: F.sansB }}>{t.cancelar}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={{ flex: 1, padding: 14, backgroundColor: C.gold, borderRadius: 12, alignItems: "center" }}>
                    <Text style={{ color: "#000", fontFamily: F.sansB }}>{t.guardar}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat, idx) => {
                const limit = budgets[cat];
                const exp = (state.expenses || [])
                  .filter(x => {
                    const d = new Date();
                    return x.cat === cat && x.date && x.date.startsWith(d.toISOString().slice(0, 7));
                  })
                  .reduce((acc, val) => acc + val.amount, 0);
                
                const pct = limit > 0 ? Math.min(100, (exp / limit) * 100) : 0;
                const isExceeded = limit > 0 && exp > limit;

                return (
                  <TouchableOpacity key={idx} onPress={() => { setEditingCat(cat); setAmount(limit ? String(limit) : ""); }} style={{ marginBottom: 16, backgroundColor: C.card, padding: 16, borderRadius: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: C.t1, fontSize: 16, fontFamily: F.sansB }}>{t.cats[cat] || cat}</Text>
                      <Text style={{ color: isExceeded ? C.rose : C.gold, fontFamily: F.monoB }}>
                        {limit ? money(limit, state.user?.currency || t.moneda) : (lang === 'en' ? "No limit" : "Sin límite")}
                      </Text>
                    </View>
                    {limit > 0 && (
                      <View>
                        <View style={{ height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                          <View style={{ height: "100%", width: `${pct}%`, backgroundColor: isExceeded ? C.rose : C.gold }} />
                        </View>
                        <Text style={{ color: C.t3, fontSize: 12, fontFamily: F.sans }}>
                          {money(exp, state.user?.currency || t.moneda)} {lang === 'en' ? "spent" : "gastado"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
