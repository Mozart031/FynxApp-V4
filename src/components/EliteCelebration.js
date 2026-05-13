import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";

const { width, height } = Dimensions.get("window");

const Confetti = ({ color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500 + Math.random() * 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: "absolute",
      left: startX,
      top: -20,
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, endX - startX] }) },
        { rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }
      ]
    }} />
  );
};

export function EliteCelebration({ visible, lang, onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.timing(textAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ]).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          onFinish();
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const colors = [C.gold, "#FFD700", "#FFF", "#B8860B", C.mint];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, alignItems: "center", justifyContent: "center" }]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        {Array.from({ length: 40 }).map((_, i) => (
          <Confetti key={i} color={colors[i % colors.length]} delay={i * 100} />
        ))}

        <Animated.View style={{ 
          alignItems: "center", 
          transform: [{ scale: scaleAnim }, { translateY: textAnim }],
          paddingHorizontal: 40
        }}>
          <View style={{ 
            width: 100, height: 100, borderRadius: 50, 
            backgroundColor: C.gold + "20", borderWidth: 2, borderColor: C.gold,
            alignItems: "center", justifyContent: "center", marginBottom: 30,
            shadowColor: C.gold, shadowRadius: 30, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 }
          }}>
            <Ionicons name="diamond" size={50} color={C.gold} />
          </View>

          <Text style={{ 
            fontSize: 12, color: C.gold, fontWeight: "800", letterSpacing: 4, 
            textTransform: "uppercase", marginBottom: 10 
          }}>
            {lang === 'en' ? "UNLOCKED" : "DESBLOQUEADO"}
          </Text>
          
          <Text style={{ 
            fontSize: 42, fontWeight: "900", color: "#FFF", textAlign: "center", 
            letterSpacing: -1, marginBottom: 12 
          }}>
            FYNX <Text style={{ color: C.gold }}>ELITE</Text>
          </Text>

          <View style={{ height: 2, width: 60, backgroundColor: C.gold, marginBottom: 20 }} />

          <Text style={{ 
            fontSize: 15, color: C.t2, textAlign: "center", lineHeight: 24, 
            fontFamily: F.mono, opacity: 0.8 
          }}>
            {lang === 'en' 
              ? "Access to professional financial intelligence tools is now active." 
              : "El acceso a herramientas de inteligencia financiera profesional está activo."}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
