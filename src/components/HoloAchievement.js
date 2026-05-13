import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

export function HoloAchievement() {
  const { newAchievements, clearNewAchievements } = useFinance();
  const { lang } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      // Animate In
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 600,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, friction: 8, tension: 40, useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1, friction: 8, tension: 40, useNativeDriver: true,
        })
      ]).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0, duration: 500, useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50, duration: 500, useNativeDriver: true,
          })
        ]).start(() => {
          clearNewAchievements();
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newAchievements]);

  if (!newAchievements || newAchievements.length === 0) return null;

  const current = newAchievements[0]; // Mostrar el primero

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[
        styles.holoCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        {/* Glow de fondo */}
        <View style={styles.glow} />
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={current.icon || "star"} size={24} color={C.gold} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{lang === 'en' ? "NEW MILESTONE REACHED" : "NUEVO HITO ALCANZADO"}</Text>
            <Text style={styles.name}>{current.title[lang] || current.title}</Text>
            <Text style={styles.desc}>{current.desc[lang] || current.desc}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Debajo del header
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  holoCard: {
    width: width * 0.9,
    backgroundColor: "rgba(10, 15, 25, 0.85)", // Fondo oscuro semitransparente
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.gold + "50",
    overflow: "hidden",
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.gold,
    opacity: 0.05,
  },
  content: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.gold + "20",
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: F.monoB,
    fontSize: 9,
    color: C.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  name: {
    fontFamily: F.sansB,
    fontSize: 16,
    color: C.t1,
    marginBottom: 2,
  },
  desc: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.t3,
  }
});
