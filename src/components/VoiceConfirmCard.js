/**
 * VoiceConfirmCard — Card inline en el chat que muestra lo que TARS
 * entendió del audio y permite confirmar o editar antes de guardar.
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";

const CATS = ["Comida", "Transporte", "Servicios", "Salud", "Educación", "Entretenimiento", "Ropa", "Ocio", "Otros"];

export function VoiceConfirmCard({ parsed, cur, lang, onConfirm, onCancel }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    type:        parsed.type        || "gasto",      // "gasto" | "ingreso"
    desc:        parsed.desc        || "",
    amount:      String(parsed.amount || ""),
    category:    parsed.category    || "Otros",
    transcription: parsed.transcription || "",
  });

  const isExpense = form.type === "gasto";
  const accentColor = isExpense ? C.rose : C.mint;

  const handleConfirm = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0 || !form.desc) return;
    onConfirm({
      type:     form.type,
      desc:     form.desc,
      amount:   amt,
      category: form.category,
    });
  };

  return (
    <View style={{
      marginVertical: 8, borderLeftWidth: 2, borderLeftColor: accentColor,
      paddingLeft: 12, width: "92%",
    }}>
      {/* Header TARS */}
      <Text style={{
        fontSize: 9, color: accentColor, marginBottom: 6, fontWeight: "700",
        letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      }}>
        {`TARS // ${isExpense ? (lang === "en" ? "EXPENSE DETECTED" : "GASTO DETECTADO") : (lang === "en" ? "INCOME DETECTED" : "INGRESO DETECTADO")}`}
      </Text>

      {/* Transcripción */}
      {!!form.transcription && (
        <Text style={{
          fontSize: 11, color: C.t4, marginBottom: 10, fontStyle: "italic",
          fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        }}>
          {`"${form.transcription}"`}
        </Text>
      )}

      {/* Campos */}
      <View style={{
        backgroundColor: "#111", borderRadius: 12, borderWidth: 1,
        borderColor: accentColor + "40", padding: 14, gap: 10,
      }}>

        {/* Tipo */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 28, alignItems: "center" }}>
            <Ionicons name={isExpense ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} size={18} color={accentColor} />
          </View>
          {editing ? (
            <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
              {["gasto", "ingreso"].map(t => (
                <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                  style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: "center",
                    backgroundColor: form.type === t ? accentColor + "20" : "transparent",
                    borderWidth: 1, borderColor: form.type === t ? accentColor : C.border2,
                  }}>
                  <Text style={{ fontSize: 12, color: form.type === t ? accentColor : C.t3, fontWeight: "700" }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: C.t1, fontWeight: "700" }}>
              {isExpense ? (lang === "en" ? "Expense" : "Gasto") : (lang === "en" ? "Income" : "Ingreso")}
            </Text>
          )}
        </View>

        {/* Descripción */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 28, alignItems: "center" }}>
            <Ionicons name="document-text-outline" size={18} color={C.t3} />
          </View>
          {editing ? (
            <TextInput
              style={{ flex: 1, color: C.t1, fontSize: 13, borderBottomWidth: 1, borderBottomColor: C.border2, paddingBottom: 4 }}
              value={form.desc}
              onChangeText={v => setForm({ ...form, desc: v })}
              placeholder={lang === "en" ? "Description" : "Descripción"}
              placeholderTextColor={C.t4}
            />
          ) : (
            <Text style={{ fontSize: 13, color: C.t1 }}>{form.desc || "—"}</Text>
          )}
        </View>

        {/* Monto */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 28, alignItems: "center" }}>
            <Ionicons name="cash-outline" size={18} color={accentColor} />
          </View>
          {editing ? (
            <TextInput
              style={{ flex: 1, color: accentColor, fontSize: 16, fontWeight: "800", borderBottomWidth: 1, borderBottomColor: accentColor + "60", paddingBottom: 4 }}
              value={form.amount}
              onChangeText={v => setForm({ ...form, amount: v })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={C.t4}
            />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: "900", color: accentColor }}>
              {cur}{parseFloat(form.amount || 0).toLocaleString("en-US")}
            </Text>
          )}
        </View>

        {/* Categoría (solo para gastos) */}
        {isExpense && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ width: 28, alignItems: "center", paddingTop: 2 }}>
              <Ionicons name="pricetag-outline" size={18} color={C.t3} />
            </View>
            {editing ? (
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {CATS.map(cat => (
                  <TouchableOpacity key={cat} onPress={() => setForm({ ...form, category: cat })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
                      borderColor: form.category === cat ? C.mint : C.border2,
                      backgroundColor: form.category === cat ? C.mint + "20" : "transparent",
                    }}>
                    <Text style={{ fontSize: 11, color: form.category === cat ? C.mint : C.t3, fontWeight: "600" }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 13, color: C.t2 }}>{form.category}</Text>
            )}
          </View>
        )}
      </View>

      {/* Acciones */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <TouchableOpacity onPress={onCancel}
          style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: C.border2 }}>
          <Text style={{ fontSize: 12, color: C.t3, fontWeight: "600" }}>
            {lang === "en" ? "Cancel" : "Cancelar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEditing(!editing)}
          style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: C.t3 + "60", flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={editing ? "checkmark-outline" : "create-outline"} size={14} color={C.t2} />
          <Text style={{ fontSize: 12, color: C.t2, fontWeight: "600" }}>
            {editing ? (lang === "en" ? "Done" : "Listo") : (lang === "en" ? "Edit" : "Editar")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleConfirm}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
            backgroundColor: accentColor, flexDirection: "row", justifyContent: "center", gap: 6,
          }}>
          <Ionicons name="checkmark-circle" size={16} color="#000" />
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#000" }}>
            {lang === "en" ? "Save" : "Guardar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
