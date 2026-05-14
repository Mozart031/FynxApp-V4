import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, TouchableWithoutFeedback, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { ICON } from "../constants";
import { useLanguage } from "../context/LanguageContext";

const { height } = Dimensions.get("window");

export function SharedTabPopup({ visible, onClose, onSelectAI, onSelectSavings }) {
  const { lang } = useLanguage();

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
      </TouchableWithoutFeedback>
      
      {/* Container posicionado un poco arriba del TabBar */}
      <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 100 }} pointerEvents="box-none">
        <Animated.View 
          style={{ 
            flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 24,
            opacity: fadeAnim, transform: [{ translateY: slideAnim }]
          }}
        >
          {/* AI Option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={onSelectAI}
            style={{ 
              width: 140, height: 140, backgroundColor: "#151515", borderRadius: 24, 
              alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
              <Ionicons name={ICON.ai} size={28} color="#FFF" />
            </View>
            <Text style={{ fontFamily: F.serif, fontSize: 18, color: "#FFF" }}>{lang === 'en' ? "TARS AI" : "IA TARS"}</Text>
          </TouchableOpacity>

          {/* Savings Option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={onSelectSavings}
            style={{ 
              width: 140, height: 140, backgroundColor: "#151515", borderRadius: 24, 
              alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: C.gold + "15", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: C.gold + "30" }}>
              <Ionicons name="wallet-outline" size={28} color={C.gold} />
            </View>
            <Text style={{ fontFamily: F.serif, fontSize: 18, color: C.gold }}>{lang === 'en' ? "Savings" : "Ahorros"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
