/**
 * FYNX — WelcomeCarousel
 * 3 slides premium: Inteligencia Artificial, Bolsillos, y Reportes.
 * Usa Glassmorphism (BlurView) y animaciones fluidas.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Dimensions, Image
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { DARK_THEME as TH, C } from "../constants/themes";
import { useLanguage } from "../context/LanguageContext";

const { width: W, height: H } = Dimensions.get("window");

const getSlides = (lang) => [
  {
    icono: "planet-outline",
    titulo: lang === 'en' ? "Meet TARS" : "Conoce a TARS",
    cuerpo: lang === 'en' ? "Your AI Financial Assistant. Talk to him naturally to record expenses, transfer to pockets, or ask for advice." : "Tu Asistente Financiero de Inteligencia Artificial. Háblale naturalmente para registrar gastos o pedirle consejos.",
    color: TH.gold,
  },
  {
    icono: "wallet-outline",
    titulo: lang === 'en' ? "Smart Pockets" : "Bolsillos Inteligentes",
    cuerpo: lang === 'en' ? "Divide your money securely. Create unlimited saving pockets and transfer funds instantly." : "Divide tu dinero de forma segura. Crea bolsillos de ahorro ilimitados y transfiere fondos al instante.",
    color: "#00E5B0", // Mint
  },
  {
    icono: "document-text-outline",
    titulo: lang === 'en' ? "Executive Reports" : "Reportes Ejecutivos",
    cuerpo: lang === 'en' ? "Generate beautiful PDF reports of your finances in seconds. Ready for your accountant or your peace of mind." : "Genera hermosos reportes PDF de tus finanzas en segundos. Listos para tu contador o tu paz mental.",
    color: "#8B5CF6", // Purple
  },
];

export function WelcomeCarousel({ onDone }) {
  const { lang } = useLanguage();
  const SLIDES = getSlides(lang);
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [idx]);

  function goTo(next) {
    if (next === idx) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIdx(next);
      scrollRef.current?.scrollTo({ x: next * W, animated: false });
      slideAnim.setValue(30);
    });
  }

  function siguiente() {
    if (idx < SLIDES.length - 1) goTo(idx + 1);
    else onDone();
  }

  const slide = SLIDES[idx];
  const esUltimo = idx === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      
      {/* Background ambient light */}
      <View style={{
        position: "absolute", top: -H*0.1, left: -W*0.2, width: W*1.4, height: W*1.4,
        borderRadius: W, backgroundColor: slide.color, opacity: 0.08,
        transform: [{ scale: 1.5 }]
      }} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Contenido centrado */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          
          <View style={{ 
            borderRadius: 36, overflow: 'hidden', marginBottom: 40,
            borderWidth: 1, borderColor: slide.color + "40",
            shadowColor: slide.color, shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3, shadowRadius: 20, elevation: 15
          }}>
            <BlurView intensity={30} tint="dark" style={{
              width: 140, height: 140, alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(20,20,20,0.5)"
            }}>
              <Ionicons name={slide.icono} size={64} color={slide.color} />
            </BlurView>
          </View>

          <Text style={{
            fontSize: 32, fontWeight: "900", color: "#F0F0F0",
            textAlign: "center", letterSpacing: -1, marginBottom: 16,
          }}>
            {slide.titulo}
          </Text>
          <Text style={{
            fontSize: 16, color: "#999999", textAlign: "center",
            lineHeight: 26, fontWeight: "500",
          }}>
            {slide.cuerpo}
          </Text>
        </View>

        {/* Puntos de progreso */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 10 }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === idx ? 32 : 10, height: 10, borderRadius: 5,
                backgroundColor: i === idx ? slide.color : TH.border,
              }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botones */}
        <View style={{
          flexDirection: "row", paddingHorizontal: 32, paddingBottom: 50, gap: 16,
        }}>
          {/* Omitir */}
          <TouchableOpacity onPress={onDone}
            style={{
              flex: 1, paddingVertical: 18, borderRadius: 16,
              borderWidth: 1.5, borderColor: TH.border, alignItems: "center",
              justifyContent: "center"
            }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: TH.t3 }}>
              {lang === 'en' ? "Skip" : "Omitir"}
            </Text>
          </TouchableOpacity>

          {/* Siguiente / Comenzar */}
          <TouchableOpacity onPress={siguiente}
            style={{
              flex: 2, paddingVertical: 18, borderRadius: 16,
              backgroundColor: slide.color,
              alignItems: "center", justifyContent: "center",
              shadowColor: slide.color, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
            }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#000", letterSpacing: 0.5 }}>
              {esUltimo ? (lang === 'en' ? "Get Started" : "Comenzar") : (lang === 'en' ? "Next" : "Siguiente")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logo mínimo arriba */}
      <View style={{ position: "absolute", top: 60, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "900", color: TH.t3, letterSpacing: 6 }}>
          FYNX
        </Text>
      </View>
    </View>
  );
}
