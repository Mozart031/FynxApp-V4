/**
 * FYNX — WelcomeCarousel
 * 3 slides: Control de gastos, Metas de ahorro, Seguridad Firebase
 * Se muestra solo la primera vez. AsyncStorage guarda que ya fue visto.
 */
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Dimensions,
} from "react-native";
import { DARK_THEME as TH } from "../constants/themes";
import { S } from "../constants/strings";

const { width: W } = Dimensions.get("window");

const SLIDES = [
  {
    icono:    "◈",
    titulo:   "Control total de tus gastos",
    cuerpo:   "Registra cada transacción en segundos. Visualiza hacia dónde va tu dinero con gráficas claras y un score financiero en tiempo real.",
    color:    "#00E5B0",
    fondo:    "#00E5B008",
  },
  {
    icono:    "▲",
    titulo:   "Metas de ahorro inteligentes",
    cuerpo:   "Define objetivos con fecha límite y monto. Fynx te muestra cuánto falta y ajusta sus sugerencias según tus hábitos de gasto.",
    color:    "#D4AF37",
    fondo:    "#D4AF3708",
  },
  {
    icono:    "◆",
    titulo:   "Seguridad con Firebase",
    cuerpo:   "Tus datos están cifrados y sincronizados en la nube. Si cambias de dispositivo, todo tu historial financiero te espera al iniciar sesión.",
    color:    "#D4AF37",
    fondo:    "#D4AF3708",
  },
];

export function WelcomeCarousel({ onDone }) {
  const [idx,     setIdx]     = useState(0);
  const scrollRef             = useRef(null);
  const fadeAnim              = useRef(new Animated.Value(1)).current;

  function goTo(next) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue:0, duration:120, useNativeDriver:true }),
    ]).start(() => {
      setIdx(next);
      scrollRef.current?.scrollTo({ x: next * W, animated: false });
      Animated.timing(fadeAnim, { toValue:1, duration:200, useNativeDriver:true }).start();
    });
  }

  function siguiente() {
    if (idx < SLIDES.length - 1) goTo(idx + 1);
    else onDone();
  }

  const slide = SLIDES[idx];
  const esUltimo = idx === SLIDES.length - 1;

  return (
    <View style={{ flex:1, backgroundColor:"#000000" }}>

      <Animated.View style={{ flex:1, opacity:fadeAnim }}>
        {/* Fondo de color sutil */}
        <View style={{
          position:"absolute", top:0, left:0, right:0, bottom:0,
          backgroundColor: slide.fondo,
        }} />

        {/* Contenido centrado */}
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:36 }}>

          {/* Ícono */}
          <View style={{
            width:100, height:100, borderRadius:30,
            backgroundColor: slide.color + "15",
            borderWidth:1.5, borderColor: slide.color + "40",
            alignItems:"center", justifyContent:"center", marginBottom:36,
          }}>
            <Text style={{ fontSize:42, color:slide.color, fontWeight:"700" }}>
              {slide.icono}
            </Text>
          </View>

          {/* Texto */}
          <Text style={{
            fontSize:24, fontWeight:"700", color:"#E0E0E0",
            textAlign:"center", letterSpacing:-0.5, marginBottom:16, lineHeight:32,
          }}>
            {slide.titulo}
          </Text>
          <Text style={{
            fontSize:15, color:"#888888", textAlign:"center",
            lineHeight:24, fontWeight:"400",
          }}>
            {slide.cuerpo}
          </Text>
        </View>

        {/* Puntos de progreso */}
        <View style={{ flexDirection:"row", justifyContent:"center", marginBottom:28, gap:8 }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === idx ? 22 : 7, height:7, borderRadius:4,
                backgroundColor: i === idx ? slide.color : TH.border,
              }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botones */}
        <View style={{
          flexDirection:"row", paddingHorizontal:28, paddingBottom:48, gap:12,
        }}>
          {/* Omitir */}
          <TouchableOpacity onPress={onDone}
            style={{
              flex:1, paddingVertical:16, borderRadius:14, borderWidth:1,
              borderColor:TH.border, alignItems:"center",
            }}>
            <Text style={{ fontSize:15, fontWeight:"600", color:TH.t3 }}>
              Omitir
            </Text>
          </TouchableOpacity>

          {/* Siguiente / Comenzar */}
          <TouchableOpacity onPress={siguiente}
            style={{
              flex:2, paddingVertical:16, borderRadius:14,
              backgroundColor: slide.color,
              alignItems:"center",
              shadowColor: slide.color,
              shadowOffset:{ width:0, height:6 },
              shadowOpacity:0.35, shadowRadius:12, elevation:8,
            }}>
            <Text style={{ fontSize:15, fontWeight:"700", color:"#000" }}>
              {esUltimo ? "Comenzar" : "Siguiente"}
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* Logo mínimo arriba */}
      <View style={{
        position:"absolute", top:52, left:0, right:0, alignItems:"center",
      }}>
        <Text style={{ fontSize:13, fontWeight:"700", color:TH.t3, letterSpacing:3 }}>
          FYNX
        </Text>
      </View>

    </View>
  );
}
