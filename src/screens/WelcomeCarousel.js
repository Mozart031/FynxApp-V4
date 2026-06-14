/**
 * FYNX — WelcomeCarousel
 * 3 slides premium: Inteligencia Artificial, Bolsillos, y Reportes.
 * Usa Glassmorphism (BlurView) y animaciones fluidas.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  Animated, Dimensions, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { DARK_THEME as TH, C } from "../constants/themes";
import { AnimatedBtn } from "../components/base";
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
    color: TH.gold,
  },
  {
    icono: "document-text-outline",
    titulo: lang === 'en' ? "Executive Reports" : "Reportes Ejecutivos",
    cuerpo: lang === 'en' ? "Generate beautiful PDF reports of your finances in seconds. Ready for your accountant or your peace of mind." : "Genera hermosos reportes PDF de tus finanzas en segundos. Listos para tu contador o tu paz mental.",
    color: TH.gold,
  },
];

export function WelcomeCarousel({ onDone }) {
  const { lang } = useLanguage();
  const SLIDES = getSlides(lang);
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef(null);
  
  // Animate ambient color
  const colorAnim = useRef(new Animated.Value(0)).current;
  const globalFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(globalFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: idx,
      duration: 400,
      useNativeDriver: false, // Colors can't use native driver
    }).start();
  }, [idx]);

  function goTo(next) {
    if (next === idx) return;
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
    setIdx(next);
  }

  function handleFinish() {
    Animated.timing(globalFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      onDone();
    });
  }

  function siguiente() {
    if (idx < SLIDES.length - 1) goTo(idx + 1);
    else handleFinish();
  }

  const slide = SLIDES[idx];
  const esUltimo = idx === SLIDES.length - 1;

  // Interpolate ambient color
  const ambientColor = colorAnim.interpolate({
    inputRange: SLIDES.map((_, i) => i),
    outputRange: SLIDES.map(s => s.color),
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <Animated.View style={{ flex: 1, opacity: globalFade }}>
        {/* Background ambient light */}
        <Animated.View style={{
          position: "absolute", top: -H*0.1, left: -W*0.2, width: W*1.4, height: W*1.4,
          borderRadius: W, backgroundColor: ambientColor, opacity: 0.08,
          transform: [{ scale: 1.5 }]
        }} />

        {/* Logo mínimo arriba */}
        <View style={{ position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: TH.t3, letterSpacing: 6 }}>
            FYNX
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={(e) => {
            const newIdx = Math.round(e.nativeEvent.contentOffset.x / W);
            if (newIdx !== idx) setIdx(newIdx);
          }}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: W, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
              <View style={{ marginBottom: 40, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: s.color + "15", position: "absolute", transform: [{ scale: 1.2 }] }} />
                <Ionicons name={s.icono} size={100} color={s.color} />
              </View>

              <Text style={{
                fontSize: 36, fontWeight: "900", color: "#FFFFFF",
                textAlign: "center", letterSpacing: -1.2, marginBottom: 18,
              }}>
                {s.titulo}
              </Text>
              <Text style={{
                fontSize: 16, color: "#A0A0A0", textAlign: "center",
                lineHeight: 26, fontWeight: "500", letterSpacing: -0.2
              }}>
                {s.cuerpo}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Controls (Bottom) */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 50 }}>
          {/* Puntos de progreso */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 10 }}>
            {SLIDES.map((_, i) => (
              <Pressable android_ripple={null} key={i} onPress={() => goTo(i)}>
                <Animated.View style={{
                  width: i === idx ? 32 : 10, height: 10, borderRadius: 5,
                  backgroundColor: i === idx ? slide.color : TH.border,
                }} />
              </Pressable>
            ))}
          </View>

          {/* Botones */}
          <View style={{ flexDirection: "row", gap: 16 }}>
            {/* Omitir */}
            <AnimatedBtn onPress={handleFinish}
              style={{
                flex: 1, paddingVertical: 18, borderRadius: 16,
                borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)",
                alignItems: "center", justifyContent: "center"
              }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: TH.t3 }}>
                {lang === 'en' ? "Skip" : "Omitir"}
              </Text>
            </AnimatedBtn>

            {/* Siguiente / Comenzar */}
            <AnimatedBtn onPress={siguiente}
              style={{
                flex: 2, paddingVertical: 18, borderRadius: 16,
                backgroundColor: slide.color,
                alignItems: "center", justifyContent: "center",
              }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#000", letterSpacing: 0.5 }}>
                {esUltimo ? (lang === 'en' ? "Get Started" : "Comenzar") : (lang === 'en' ? "Next" : "Siguiente")}
              </Text>
            </AnimatedBtn>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
