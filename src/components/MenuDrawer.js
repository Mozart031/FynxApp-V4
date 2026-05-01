import React, { useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, Alert, Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, F } from "../constants/themes";
import { useFinance } from "../context/FinanceContext";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.78;
const GOLD = "#D4AF37";

// ─────────────────────────────────────────────────────────────
// MENU DRAWER — Fynx Elite Deep Space
// Fase 2: Auth/Login en cola. Rutas de navegación reales.
// ─────────────────────────────────────────────────────────────

export function MenuDrawer({ visible, onClose, navigation, openSettings, setTab }) {
  const { appState } = useFinance();
  const { user = {} } = appState || {};

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, friction: 9, tension: 45, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && fadeAnim._value === 0) return null;

  const go = (screen) => {
    onClose();
    setTimeout(() => {
      if (screen === "Settings") {
        openSettings && openSettings();
      } else if (setTab && ["perfil", "estrategia", "chat"].includes(screen.toLowerCase())) {
        setTab(screen.toLowerCase());
      } else if (navigation) {
        navigation.navigate(screen);
      } else {
        Alert.alert("Fynx Elite", `Pantalla en desarrollo: ${screen}`);
      }
    }, 260);
  };

  // Logout handler — Fase 2
  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Seguro que deseas salir de tu cuenta Fynx Elite?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            onClose();
            // Fase 2: firebase.auth().signOut() → navegación a AuthScreen
            Alert.alert("Fynx", "Sesión cerrada. [Fase 2: AuthScreen]");
          },
        },
      ]
    );
  };

  const displayName = user?.displayName || user?.name || "Usuario Elite";
  const displayId   = user?.uid ? `F-${user.uid.slice(0, 6).toUpperCase()}` : "F-ELITE";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* ── Backdrop blur ── */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Drawer Panel ── */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>

          {/* Gold edge line */}
          <View style={styles.goldEdge} />

          {/* ── Header / Profile ── */}
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={28} color={GOLD} />
              </View>
              {/* Status dot */}
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userId}>{displayId}</Text>

            {/* Divider */}
            <View style={styles.headerDivider} />
          </View>

          {/* ── Navigation Links ── */}
          <View style={styles.links}>

            <Text style={styles.sectionLabel}>CUENTA</Text>
            <DrawerItem
              icon="person-circle-outline"
              label="Mi Perfil"
              sub="Datos personales y plan"
              onPress={() => go("Perfil")}
            />
            <DrawerItem
              icon="shield-checkmark-outline"
              label="Seguridad"
              sub="Biometría y contraseña"
              onPress={() => go("Settings")}
            />

            <Text style={styles.sectionLabel}>FINANZAS</Text>
            <DrawerItem
              icon="analytics-outline"
              label="Estrategia"
              sub="IA financiera personalizada"
              onPress={() => go("Estrategia")}
            />
            <DrawerItem
              icon="chatbubble-ellipses-outline"
              label="Chat Fynx"
              sub="Consulta con tu asistente"
              onPress={() => go("Chat")}
            />

            <Text style={styles.sectionLabel}>SOPORTE</Text>
            <DrawerItem
              icon="notifications-outline"
              label="Notificaciones"
              sub="Alertas y recordatorios"
              onPress={() => go("Settings")}
            />
            <DrawerItem
              icon="headset-outline"
              label="Soporte Técnico"
              sub="Centro de ayuda Fynx"
              onPress={() => Linking.openURL("mailto:soporte@fynx.app?subject=Soporte Fynx Elite")}
            />
            <DrawerItem
              icon="bulb-outline"
              label="Enviar Sugerencia"
              sub="Ayúdanos a mejorar"
              onPress={() => Linking.openURL("mailto:soporte@fynx.app?subject=Sugerencia Fynx Elite")}
            />
            <DrawerItem
              icon="document-text-outline"
              label="Legal & Privacidad"
              sub="Términos y condiciones"
              onPress={() => go("Legal")}
            />
            <DrawerItem
              icon="settings-outline"
              label="Configuración"
              sub="Preferencias de la app"
              onPress={() => {
                onClose();
                setTimeout(() => openSettings && openSettings(), 260);
              }}
            />
          </View>

          {/* ── Footer: Logout ── */}
          <TouchableOpacity style={styles.footer} activeOpacity={0.75} onPress={handleLogout}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out-outline" size={18} color={C.rose} />
            </View>
            <View>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
              <Text style={styles.logoutSub}>FASE 2 · Auth Queue</Text>
            </View>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

// ── DrawerItem ──────────────────────────────────────────────
function DrawerItem({ icon, label, sub, onPress }) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 0.97, duration: 80, useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 1, duration: 150, useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.item, { transform: [{ scale: pressAnim }] }]}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={GOLD} />
        </View>
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemText}>{label}</Text>
          {sub && <Text style={styles.itemSub}>{sub}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={13} color={C.t4} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#080808",
    borderRightWidth: 0,
    paddingTop: 56,
    shadowColor: GOLD,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  goldEdge: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GOLD + "35",
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  avatarWrapper: {
    position: "relative",
    width: 56,
    height: 56,
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: GOLD + "12",
    borderWidth: 1,
    borderColor: GOLD + "40",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
    borderWidth: 2,
    borderColor: "#080808",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  userName: {
    fontFamily: F.sansB,
    fontSize: 17,
    color: C.t1,
    marginBottom: 3,
  },
  userId: {
    fontFamily: F.mono,
    fontSize: 10,
    color: GOLD + "60",
    letterSpacing: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: GOLD + "15",
    marginTop: 16,
  },
  links: {
    flex: 1,
    paddingHorizontal: 14,
  },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    color: GOLD + "50",
    letterSpacing: 3,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 2,
    backgroundColor: "transparent",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: GOLD + "0E",
    borderWidth: 1,
    borderColor: GOLD + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemText: {
    fontFamily: F.sansM,
    fontSize: 13,
    color: C.t2,
  },
  itemSub: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.t3,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: GOLD + "15",
    gap: 12,
  },
  logoutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.roseBg,
    borderWidth: 1,
    borderColor: C.rose + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontFamily: F.sansB,
    fontSize: 13,
    color: C.rose,
  },
  logoutSub: {
    fontFamily: F.mono,
    fontSize: 8,
    color: C.t4,
    letterSpacing: 1,
    marginTop: 2,
  },
});
