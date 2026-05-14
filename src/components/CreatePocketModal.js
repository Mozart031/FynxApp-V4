import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";

const COLORS = [
  C.gold,
  C.mint,
  C.rose,
  "#5A8DFF", // Blue
  "#B15AFF", // Purple
];

const ICONS = [
  "wallet",
  "airplane",
  "home",
  "car",
  "game-controller",
  "school",
  "medical",
  "fitness",
  "person",
  "people",
];

export function CreatePocketModal({ visible, onClose, onCreate, lang }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setTarget("");
      setColor(COLORS[0]);
      setIcon(ICONS[0]);
      setError("");
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(lang === 'en' ? "Name is required" : "El nombre es obligatorio");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await onCreate({
        name: name.trim(),
        target: target ? parseFloat(target.replace(/[^0-9.]/g, '')) : 0,
        color,
        icon,
      });
      setLoading(false);
      onClose();
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
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.gold, letterSpacing: 2, fontWeight: "800" }}>
                {lang === 'en' ? "NEW POCKET" : "NUEVO BOLSILLO"}
              </Text>
              <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={20} color={C.t3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>
                {lang === 'en' ? "POCKET NAME" : "NOMBRE DEL BOLSILLO"}
              </Text>
              <View style={{ backgroundColor: "#1A1A1A", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 16 }}>
                <TextInput
                  style={{ fontFamily: F.sans, fontSize: 16, color: "#FFF", fontWeight: "600" }}
                  placeholder={lang === 'en' ? "e.g. Vacation" : "ej. Vacaciones"}
                  placeholderTextColor={C.t4}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>
                {lang === 'en' ? "SAVINGS GOAL (OPTIONAL)" : "META DE AHORRO (OPCIONAL)"}
              </Text>
              <View style={{ backgroundColor: "#1A1A1A", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontFamily: F.serif, fontSize: 20, color: C.t3, marginRight: 8 }}>RD$</Text>
                <TextInput
                  style={{ flex: 1, fontFamily: F.serif, fontSize: 20, color: "#FFF" }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.t4}
                  value={target}
                  onChangeText={setTarget}
                />
              </View>

              <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>COLOR</Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                {COLORS.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    onPress={() => setColor(c)}
                    style={{ 
                      width: 40, height: 40, borderRadius: 20, backgroundColor: c, 
                      borderWidth: 3, borderColor: color === c ? "#FFF" : "transparent"
                    }} 
                  />
                ))}
              </View>

              <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.mono, marginBottom: 8, marginLeft: 4 }}>
                {lang === 'en' ? "ICON" : "ÍCONO"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10, marginBottom: 10 }}>
                {ICONS.map(i => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => setIcon(i)}
                    style={{ 
                      width: 48, height: 48, borderRadius: 16, 
                      backgroundColor: icon === i ? color + "20" : "#1A1A1A",
                      borderWidth: 1.5, borderColor: icon === i ? color : "rgba(255,255,255,0.05)",
                      alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Ionicons name={i} size={24} color={icon === i ? color : C.t3} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {!!error && (
                <Text style={{ color: C.rose, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</Text>
              )}

              <TouchableOpacity 
                onPress={handleCreate}
                disabled={loading}
                style={{ 
                  backgroundColor: C.gold, borderRadius: 16, paddingVertical: 16, alignItems: "center", 
                  opacity: loading ? 0.7 : 1, marginTop: 10
                }}
              >
                <Text style={{ fontFamily: F.mono, fontSize: 14, color: "#000", fontWeight: "900", letterSpacing: 1 }}>
                  {loading ? (lang === 'en' ? "CREATING..." : "CREANDO...") : (lang === 'en' ? "CREATE POCKET" : "CREAR BOLSILLO")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
