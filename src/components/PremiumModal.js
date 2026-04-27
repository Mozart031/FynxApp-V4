/**
 * TARS — Modal de suscripción Premium
 * Muestra beneficios, precio y botón de conversión.
 * Posición: llamar desde PerfilScreen o Dashboard.
 */
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal } from "react-native";
import { C } from "../constants/themes";
import { PREMIUM } from "../constants/texts";

export function PremiumModal({ visible, onClose, onSuscribir }) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim,  { toValue: 0,   useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(bgAnim,     { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 600, duration: 260, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 0,   duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={{
        flex: 1, backgroundColor: "#000",
        opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] }),
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      }} />

      <Animated.View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: C.card,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1.5, borderColor: C.gold + "40",
        maxHeight: "92%",
      }}>
        {/* Barra de arrastre visual */}
        <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border2 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 36 }}>

          {/* Encabezado */}
          <View style={{
            backgroundColor: C.goldBg2,
            borderRadius: 20, borderWidth: 1.5, borderColor: C.gold + "50",
            padding: 20, marginBottom: 24, alignItems: "center",
          }}>
            <View style={{
              backgroundColor: C.gold + "22", borderRadius: 14, borderWidth: 1,
              borderColor: C.gold + "40", paddingHorizontal: 14, paddingVertical: 5,
              marginBottom: 14,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.gold, letterSpacing: 2 }}>
                {PREMIUM.badgePremium}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: "900", color: C.t1, letterSpacing: -0.8, textAlign: "center" }}>
              {PREMIUM.modal.titulo}
            </Text>
            <Text style={{ fontSize: 13, color: C.t2, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              {PREMIUM.modal.subtitulo}
            </Text>
          </View>

          {/* Beneficios */}
          <Text style={{
            fontSize: 9, color: C.t3, fontWeight: "700", letterSpacing: 2.5,
            marginBottom: 14,
          }}>
            INCLUIDO EN PREMIUM
          </Text>
          {PREMIUM.modal.beneficios.map((b, i) => (
            <View key={i} style={{
              flexDirection: "row", alignItems: "flex-start", gap: 14,
              backgroundColor: C.card2, borderRadius: 14, borderWidth: 1,
              borderColor: C.border, padding: 14, marginBottom: 10,
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: C.gold + "18", borderWidth: 1, borderColor: C.gold + "30",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 16, color: C.gold, fontWeight: "900" }}>{b.icono}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: C.t1, marginBottom: 2 }}>
                  {b.titulo}
                </Text>
                <Text style={{ fontSize: 11, color: C.t3, lineHeight: 17 }}>
                  {b.desc}
                </Text>
              </View>
            </View>
          ))}

          {/* Precio y CTA */}
          <View style={{
            backgroundColor: C.goldBg, borderRadius: 18, borderWidth: 1.5,
            borderColor: C.gold + "50", padding: 20, marginTop: 8, alignItems: "center",
          }}>
            <Text style={{ fontSize: 11, color: C.t3, letterSpacing: 1.5, marginBottom: 4 }}>
              PRECIO MENSUAL
            </Text>
            <Text style={{ fontSize: 32, fontWeight: "900", color: C.gold, letterSpacing: -1, marginBottom: 16 }}>
              {PREMIUM.modal.precio}
            </Text>
            <TouchableOpacity
              onPress={onSuscribir}
              activeOpacity={0.85}
              style={{
                backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16,
                paddingHorizontal: 40, width: "100%", alignItems: "center",
                shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#000", letterSpacing: -0.3 }}>
                {PREMIUM.modal.cta}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cerrar */}
          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", marginTop: 20 }}
          >
            <Text style={{ fontSize: 13, color: C.t3 }}>
              {PREMIUM.modal.cerrar}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
