import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../../constants/themes";
import { useLanguage } from "../../context/LanguageContext";

export function PremiumWidget({ onPress, isTrialActive }) {
  const { t, lang } = useLanguage();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isTrialActive 
              ? (lang === 'en' ? "🌟 ENJOYING ELITE?" : "🌟 ¿DISFRUTANDO ELITE?") 
              : (t.premium?.titulo ? t.premium.titulo.toUpperCase() : "FYNX ELITE")}
          </Text>
          <Text style={styles.subtitle}>
            {isTrialActive 
              ? (lang === 'en' ? "Make it permanent and remove all ads." : "Hazlo permanente y elimina los anuncios.")
              : (t.premium?.widgetSub || "DESBLOQUEA TENDENCIAS Y REPORTES")}
          </Text>
          <View style={{ marginTop: 6, backgroundColor: "rgba(0,0,0,0.1)", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: F.monoB, color: "#000" }}>
              {isTrialActive 
                ? (lang === 'en' ? "Upgrade Now" : "Mejorar Ahora")
                : (t.premium?.desde || "Desde $2.99/mes")}
            </Text>
          </View>
        </View>
        <View style={styles.lockIcon}>
          <Ionicons name="diamond" size={24} color={C.gold} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: C.gold,
    elevation: 4,
  },
  content: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "center",
  },
  title: {
    fontFamily: F.monoB,
    fontSize: 16,
    color: "#000",
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: F.mono,
    fontSize: 10,
    color: "rgba(0,0,0,0.7)",
    letterSpacing: 0.5,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  }
});
