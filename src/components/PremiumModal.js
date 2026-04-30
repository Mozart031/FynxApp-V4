/**
 * TARS — Modal de suscripción Premium
 * Muestra beneficios, precio y botón de conversión.
 * Posición: llamar desde PerfilScreen o Dashboard.
 */
import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { PREMIUM } from "../constants/texts";
import { TypewriterText } from "./TypewriterText";

export function PremiumModal({ visible, onClose, onSuscribir }) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const [plan, setPlan] = useState("anual");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setSuccess(false);
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

  const handleSubscribe = async () => {
    // Evento de intención de compra
    import("posthog-react-native").then(({ usePostHog }) => {
      // Nota: hook usePostHog no se puede usar aquí dentro de async function, lo moveremos al top level.
    });
    
    import("../services/revenuecat").then(async (rc) => {
      const packageId = plan === "anual" ? "$rc_annual" : "$rc_monthly"; // Ajustar si tienes IDs específicos
      // Intentar comprar
      const result = await rc.rcPurchasePackage({ identifier: packageId });
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuscribir(plan, true);
          setSuccess(false);
        }, 4500); // 4.5s para que termine de leer el typewriter
      } else {
        onSuscribir(plan, false);
      }
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
        }
      ]}>
        <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: "#000000", // True Black OLED
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1.5, borderColor: C.gold + "50",
        maxHeight: "92%",
        height: success ? "100%" : "auto", // full height on success
      }}>
        {success ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#0A0A12" }}>
            <Ionicons name="diamond" size={60} color={C.gold} style={{ marginBottom: 30 }} />
            <Text style={{ fontSize: 24, fontWeight: "900", color: C.gold, marginBottom: 20 }}>FYNX ELITE</Text>
            <TypewriterText 
              text="Bienvenido a la élite financiera. TARS ahora está desbloqueado a su máxima capacidad." 
              style={{ textAlign: "center", fontSize: 16, lineHeight: 26, color: C.t1 }} 
            />
          </View>
        ) : (
          <>
            {/* Barra de arrastre visual */}
            <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border2 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>

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
                    <Ionicons name={b.icono} size={20} color={C.gold} />
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

              {/* Selección de Plan */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 16 }}>
                {/* Mensual */}
                <TouchableOpacity onPress={() => setPlan("mensual")}
                  style={{
                    flex: 1, padding: 16, borderRadius: 16, borderWidth: 1.5,
                    borderColor: plan === "mensual" ? C.gold : C.border,
                    backgroundColor: plan === "mensual" ? C.goldBg : C.card2,
                    alignItems: "center"
                  }}>
                  <Text style={{ fontSize: 11, color: plan === "mensual" ? C.gold : C.t3, fontWeight: "700", marginBottom: 4 }}>MENSUAL</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: plan === "mensual" ? C.gold : C.t2 }}>$4.99</Text>
                </TouchableOpacity>

                {/* Anual */}
                <TouchableOpacity onPress={() => setPlan("anual")}
                  style={{
                    flex: 1, padding: 16, borderRadius: 16, borderWidth: 1.5,
                    borderColor: plan === "anual" ? C.gold : C.border,
                    backgroundColor: plan === "anual" ? C.goldBg : C.card2,
                    alignItems: "center", position: "relative"
                  }}>
                  <View style={{ position: "absolute", top: -10, backgroundColor: C.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#000" }}>AHORRA 50%</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: plan === "anual" ? C.gold : C.t3, fontWeight: "700", marginBottom: 4 }}>ANUAL</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: plan === "anual" ? C.gold : C.t2 }}>$29.99</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Contenedor Flotante Absoluto para Botones */}
            <View style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16,
              backgroundColor: "#000000",
              borderTopWidth: 1, borderTopColor: "#111111"
            }}>
              {/* CTA */}
              <TouchableOpacity
                onPress={handleSubscribe}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16,
                  alignItems: "center", width: "100%",
                  shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#000", letterSpacing: -0.3 }}>
                  Suscribirse ahora
                </Text>
              </TouchableOpacity>

              {/* Cerrar / No por ahora */}
              <TouchableOpacity
                onPress={onClose}
                style={{ alignItems: "center", marginTop: 16, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, color: C.t3, fontWeight: "600" }}>
                  No por ahora
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}
