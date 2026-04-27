/**
 * TARS — Banner publicitario no intrusivo (plan gratuito)
 * Se oculta automáticamente en cuentas Premium.
 * Posición recomendada: al final del ScrollView en HomeScreen.
 */
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { C } from "../constants/themes";

// Mensajes financieros rotativos — informativos, no invasivos
const MENSAJES = [
  {
    titulo: "Tip financiero",
    cuerpo: "Destina el 20 % de tu ingreso al ahorro antes de gastar.",
  },
  {
    titulo: "Regla del 50-30-20",
    cuerpo: "50 % necesidades, 30 % deseos, 20 % ahorro e inversión.",
  },
  {
    titulo: "Fondo de emergencia",
    cuerpo: "Tener tres meses de gastos cubiertos es el primer objetivo financiero.",
  },
  {
    titulo: "El costo real",
    cuerpo: "Cada gasto equivale a horas de trabajo. Calcula antes de comprar.",
  },
];

export function AdBanner({ esPremium, onUpgrade }) {
  const [idx,     setIdx]     = useState(0);
  const fadeAnim              = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % MENSAJES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // En cuentas premium no se muestra nada
  if (esPremium) return null;

  const msg = MENSAJES[idx];

  return (
    <View style={{
      marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
      backgroundColor: C.card2, borderWidth: 1, borderColor: C.border,
      overflow: "hidden",
    }}>
      {/* Indicador sutil de patrocinio */}
      <View style={{
        paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ fontSize: 8, color: C.t3, letterSpacing: 1.5, fontWeight: "600" }}>
          CONTENIDO INFORMATIVO
        </Text>
        <TouchableOpacity onPress={onUpgrade}>
          <Text style={{ fontSize: 8, color: C.mint, letterSpacing: 1, fontWeight: "700" }}>
            ELIMINAR
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 14 }} />

      <Animated.View style={{ opacity: fadeAnim, padding: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: C.t2, marginBottom: 4, letterSpacing: 0.3 }}>
          {msg.titulo}
        </Text>
        <Text style={{ fontSize: 12, color: C.t1, lineHeight: 18 }}>
          {msg.cuerpo}
        </Text>
      </Animated.View>

      {/* CTA de upgrade */}
      <TouchableOpacity
        onPress={onUpgrade}
        style={{
          marginHorizontal: 14, marginBottom: 14, paddingVertical: 10,
          borderRadius: 10, backgroundColor: C.goldBg,
          borderWidth: 1, borderColor: C.gold + "40", alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "800", color: C.gold }}>
          Actualizar a Premium — Sin publicidad
        </Text>
      </TouchableOpacity>
    </View>
  );
}
