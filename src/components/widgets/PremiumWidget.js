import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../../constants/themes";

export function PremiumWidget({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>FYNX ELITE PREMIUM</Text>
          <Text style={styles.subtitle}>DESBLOQUEA TENDENCIAS Y REPORTES</Text>
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
    marginBottom: 32,
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
