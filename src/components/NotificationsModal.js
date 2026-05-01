import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal, StyleSheet, PanResponder } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { money } from "../utils/formatters";

export function NotificationsModal({ visible, onClose, reminders, cur, onNavigate }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 45, friction: 12 }),
        Animated.timing(bgAnim,    { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 0,   duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (e, gs) => { if (gs.dy > 0) slideAnim.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 12, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const today2 = new Date().getDate();
  const currentMonth = new Date().toISOString().slice(0,7);
  // Solo los pagos pendientes de este mes
  const upcomingReminders = reminders.filter(r => r.active && r.paidMonth !== currentMonth).sort((a,b) => a.day - b.day);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
        }
      ]}>
        <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: "#000000",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1.5, borderColor: C.border2,
        maxHeight: "75%",
      }}>
        {/* Barra de arrastre visual */}
        <View {...panResponder.panHandlers} style={{ alignItems: "center", paddingTop: 14, paddingBottom: 14, zIndex: 10 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border2 }} />
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Ionicons name="notifications" size={24} color={C.gold} />
            <Text style={{ fontSize: 20, fontWeight: "900", color: C.t1, letterSpacing: -0.5 }}>Notificaciones</Text>
          </View>
          <Text style={{ fontSize: 13, color: C.t3, marginBottom: 20 }}>Tus recordatorios y alertas pendientes.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {upcomingReminders.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={C.mint} style={{ opacity: 0.8, marginBottom: 16 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: C.t1, marginBottom: 4 }}>Todo al día</Text>
                <Text style={{ fontSize: 12, color: C.t3, textAlign: "center" }}>No tienes pagos pendientes próximos.</Text>
              </View>
            ) : (
              upcomingReminders.map((r, i) => {
                const isDue = r.day <= today2;
                const isClose = (r.day - today2) <= 5 && !isDue;
                
                // Si no está vencido ni cercano (faltan más de 5 días), lo mostramos en gris suave.
                // Si está cerca, amarillo/naranja. Si está vencido, rojo.
                let alertColor = C.t3;
                let alertText = `Vence el día ${r.day}`;
                
                if (isDue) {
                  alertColor = C.rose;
                  alertText = r.day === today2 ? "Vence hoy" : `Venció hace ${today2 - r.day} días`;
                } else if (isClose) {
                  alertColor = C.gold;
                  alertText = `Vence en ${r.day - today2} días`;
                }

                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      onClose();
                      setTimeout(() => {
                        if (onNavigate) onNavigate();
                      }, 300); // Dar tiempo a que baje el modal
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      backgroundColor: C.card2, borderRadius: 16, borderWidth: 1, borderColor: alertColor + "40",
                      padding: 16, marginBottom: 10
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: alertColor + "15", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="calendar-outline" size={20} color={alertColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: C.t1, marginBottom: 2 }}>{r.name}</Text>
                      <Text style={{ fontSize: 11, color: alertColor, fontWeight: "700" }}>{alertText}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: C.t1 }}>{money(r.amount, cur)}</Text>
                      <Ionicons name="chevron-forward" size={14} color={C.t4} style={{ marginTop: 2 }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}
