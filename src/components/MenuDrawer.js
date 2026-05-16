import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView, Switch, TextInput
} from "react-native";
import { CURRENCIES } from "../constants/currencies";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, F } from "../constants/themes";
import { useLanguage } from "../context/LanguageContext";
import { useFinance } from "../context/FinanceContext";
import { useEliteAlert } from "../context/AlertContext";
import { cerrarSesion } from "../services/firebase";
import { calcStreak } from "../utils/finance";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

// ── Sub-panel header shared component ─────────────────────────
function PanelHeader({ title, onBack }) {
  return (
    <View style={sh.panelHeader}>
      <TouchableOpacity onPress={onBack} style={sh.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
      </TouchableOpacity>
      <Text style={sh.panelTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

// ── Currency Picker Panel ──────────────────────────────────────
function CurrencyPickerPanel({ onBack, onConfirm, currentIso, lang }) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter(c =>
    c.iso.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="CURRENCY_SELECTOR" onBack={onBack} />
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14, marginBottom: 14 }}>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.3)" />
        <TextInput
          value={search} onChangeText={setSearch}
          placeholder={lang === "en" ? "Search ISO or name..." : "Buscar ISO o nombre..."}
          placeholderTextColor="rgba(255,255,255,0.25)"
          style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: "#FFF", paddingVertical: 12, marginLeft: 10 }}
          autoCorrect={false} autoCapitalize="characters"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {filtered.map(c => {
          const sel = c.iso === currentIso;
          return (
            <TouchableOpacity key={c.iso} onPress={() => onConfirm(c)}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}>
              <Text style={{ fontFamily: F.monoB, fontSize: 14, color: sel ? GOLD : "#FFF", width: 62 }}>{c.iso}</Text>
              <Text style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: sel ? GOLD : "rgba(255,255,255,0.6)" }}>{c.name}</Text>
              <Text style={{ fontFamily: F.mono, fontSize: 14, color: sel ? GOLD : "rgba(255,255,255,0.3)", marginRight: 10 }}>{c.symbol}</Text>
              {sel && <Ionicons name="checkmark-circle" size={18} color={GOLD} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Settings Panel ─────────────────────────────────────────────
function SettingsPanel({ onBack, onClose, onOpenCurrencyPicker }) {
  const { appState, updateState, setAppState, frenoState, toggleFreno, isDemoMode, toggleDemoMode } = useFinance();
  const { lang, changeLanguage } = useLanguage();
  const { showAlert } = useEliteAlert();
  const user = appState?.user || {};
  const [cerrando, setCerrando] = useState(false);

  async function handleLogout() {
    setCerrando(true);
    try {
      const { sincronizarDatos } = require("../services/firebase");
      if (appState?.user?.uid) await sincronizarDatos(appState.user.uid, appState).catch(() => {});
      await cerrarSesion();
      await Promise.all(["mifinanzas_v7", "@fynx_session", "mifinanzas_freno_v1"].map(k => AsyncStorage.removeItem(k)));
      setAppState({ onboarded: false, setupCompleted: false });
      onClose();
    } catch (e) { console.warn(e); }
    setCerrando(false);
  }

  const Cell = ({ icon, title, value, onPress, rightContent, isLast, danger }) => (
    <TouchableOpacity
      onPress={onPress} disabled={!onPress && !rightContent}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.04)" }}
    >
      {icon && (
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: danger ? "rgba(239,68,68,0.1)" : "rgba(212,175,55,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14, borderWidth: 1, borderColor: danger ? "rgba(239,68,68,0.2)" : "rgba(212,175,55,0.15)" }}>
          <Ionicons name={icon} size={16} color={danger ? C.rose : GOLD} />
        </View>
      )}
      <Text style={{ flex: 1, fontSize: 14, color: danger ? C.rose : "#FFF", fontFamily: F.sansM }}>{title}</Text>
      {value && <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginRight: 8, fontFamily: F.mono }}>{value}</Text>}
      {rightContent}
      {onPress && !rightContent && <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.2)" />}
    </TouchableOpacity>
  );

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 9, fontFamily: F.monoB, color: "rgba(255,255,255,0.3)", marginLeft: 4, marginBottom: 10, letterSpacing: 2 }}>{title.toUpperCase()}</Text>
      <View style={{ backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="SYSTEM_CONFIG" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <Section title={lang === "en" ? "Identity" : "Identidad"}>
          <Cell icon="language-outline" title={lang === "en" ? "Interface Language" : "Idioma de Interfaz"} value={lang === "es" ? "ESPAÑOL" : "ENGLISH"}
            onPress={() => showAlert(lang === "en" ? "Language" : "Idioma", lang === "en" ? "Select language" : "Selecciona idioma", [
              { text: "Español", onPress: () => changeLanguage("es") },
              { text: "English", onPress: () => changeLanguage("en") },
              { text: lang === "en" ? "Cancel" : "Cancelar", style: "cancel" },
            ], "info")}
          />
          <Cell
            icon="cash-outline"
            title={lang === "en" ? "Currency Unit" : "Unidad Monetaria"}
            value={`${user.currencyCode || "DOP"} (${user.currency || "RD$"})`}
            isLast
            onPress={onOpenCurrencyPicker}
          />
        </Section>

        <Section title={lang === "en" ? "Neural Alerts" : "Alertas Neuronales"}>
          <Cell icon="notifications-outline" title={lang === "en" ? "Push Notifications" : "Notificaciones Push"}
            rightContent={<Switch value={user.notificationsEnabled !== false} onValueChange={v => updateState({ user: { ...user, notificationsEnabled: v } })} trackColor={{ false: "#1A1A1A", true: GOLD }} thumbColor="#fff" />}
          />
          <Cell icon="hardware-chip-outline" title={lang === "en" ? "Haptic Interface" : "Interfaz Háptica"} isLast
            rightContent={<Switch value={user.hapticsEnabled !== false} onValueChange={v => updateState({ user: { ...user, hapticsEnabled: v } })} trackColor={{ false: "#1A1A1A", true: GOLD }} thumbColor="#fff" />}
          />
        </Section>

        <Section title={lang === "en" ? "Security" : "Seguridad"}>
          <Cell icon="lock-closed-outline" title={lang === "en" ? "Emergency Lock (48h)" : "Bloqueo Emergencia (48h)"} value={frenoState?.active ? "ON" : "OFF"} onPress={toggleFreno} />
          <Cell icon="finger-print-outline" title={lang === "en" ? "Biometric Lock" : "Bloqueo Biométrico"} isLast
            rightContent={<Switch value={!!user.appLockEnabled} onValueChange={v => updateState({ user: { ...user, appLockEnabled: v } })} trackColor={{ false: "#1A1A1A", true: GOLD }} thumbColor="#fff" />}
          />
        </Section>

        <Section title={lang === "en" ? "Data & Legal" : "Datos y Legal"}>
          <Cell icon="information-circle-outline" title={lang === "en" ? "Build Version" : "Versión"} value="4.0.2-ELITE" />
          <Cell icon="log-out-outline" title={cerrando ? "TERMINATING..." : (lang === "en" ? "Terminate Session" : "Cerrar Sesión")} onPress={handleLogout} isLast danger />
        </Section>

        {user.email === "ericksonp032102@gmail.com" && (
          <Section title="Debug Console">
            <Cell icon="terminal-outline" title="Screenshot Mode" isLast
              rightContent={<Switch value={isDemoMode} onValueChange={toggleDemoMode} trackColor={{ false: "#1A1A1A", true: "#00FF00" }} thumbColor="#fff" />}
            />
          </Section>
        )}

        <TouchableOpacity onPress={() => showAlert(
          lang === "en" ? "Purge Data" : "Purga de Datos",
          lang === "en" ? "Wipe all local clusters?" : "¿Borrar todos los datos locales?",
          [{ text: lang === "en" ? "Abort" : "Abortar", style: "cancel" },
           { text: lang === "en" ? "Execute" : "Ejecutar", style: "destructive", onPress: async () => { await AsyncStorage.removeItem("@fynx_appstate"); handleLogout(); } }],
          "error"
        )} style={{ alignItems: "center", marginTop: 10, padding: 10 }}>
          <Text style={{ fontSize: 10, color: "rgba(239,68,68,0.45)", fontFamily: F.monoB, letterSpacing: 1 }}>SYSTEM_PURGE_LOCAL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Main MenuDrawer ────────────────────────────────────────────
export function MenuDrawer({ visible, onClose, navigation, openSettings, setTab }) {
  const { t, lang } = useLanguage();
  const { updateState, appState, derived } = useFinance();
  const { showAlert } = useEliteAlert();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [activePanel, setActivePanel] = useState(null); // null = main menu

  const streak = calcStreak(appState?.streakDays || []);
  const userLevel = Math.max(1, Math.floor(streak / 7) + 1);

  useEffect(() => {
    if (visible) {
      setActivePanel(null); // always reset to main menu on open
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 30, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Navigation: tabs switch the app tab and close drawer
  const goTab = (screen) => {
    onClose();
    setTimeout(() => {
      if (setTab) setTab(screen);
      else navigation?.navigate(screen);
    }, 300);
  };

  const MenuItem = ({ icon, label, sub, onPress, color = GOLD, badge }) => (
    <TouchableOpacity onPress={onPress} style={sh.menuItem} activeOpacity={0.7}>
      <View style={[sh.iconBox, { borderColor: color + "45" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sh.menuLabel}>{label}</Text>
        <Text style={sh.menuSub}>{sub}</Text>
      </View>
      {badge && (
        <View style={{ backgroundColor: color + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
          <Text style={{ fontFamily: F.monoB, fontSize: 8, color }}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activePanel === "currency") {
      const user = appState?.user || {};
      return (
        <CurrencyPickerPanel
          onBack={() => setActivePanel("settings")}
          currentIso={user.currencyCode || "DOP"}
          lang={lang}
          onConfirm={(c) => {
            showAlert(
              lang === "en" ? "Change Currency" : "Cambiar Moneda",
              lang === "en"
                ? `Switch to ${c.name} (${c.symbol})?\nThis affects all displayed amounts.`
                : `¿Cambiar a ${c.name} (${c.symbol})?\nEsto afecta todos los montos mostrados.`,
              [
                { text: lang === "en" ? "Cancel" : "Cancelar", style: "cancel" },
                {
                  text: lang === "en" ? "Confirm" : "Confirmar",
                  onPress: () => {
                    updateState({ user: { ...user, currencyCode: c.iso, currency: c.symbol } });
                    setActivePanel("settings");
                  }
                },
              ],
              "info"
            );
          }}
        />
      );
    }
    if (activePanel === "settings") {
      return <SettingsPanel onBack={() => setActivePanel(null)} onClose={onClose} onOpenCurrencyPicker={() => setActivePanel("currency")} />;
    }

    // Main menu
    return (
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={sh.header}>
          <View>
            <Text style={sh.brand}>FYNX ELITE</Text>
            <Text style={sh.versionLine}>{lang === "en" ? "SECURE_SESSION ◆ ACTIVE" : "SESIÓN_SEGURA ◆ ACTIVA"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sh.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Profile card */}
          <View style={sh.profileCard}>
            <View style={sh.avatar}>
              <Ionicons name="person" size={28} color={GOLD} />
              <View style={sh.eliteDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sh.userName}>{appState?.user?.name || (lang === "en" ? "ELITE USER" : "USUARIO ELITE")}</Text>
              <Text style={sh.userEmail} numberOfLines={1}>{appState?.user?.email || "fynx@elite.app"}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <View style={sh.accessBadge}>
                  <Text style={sh.accessText}>{lang === "en" ? `LVL ${userLevel}` : `NIV. ${userLevel}`}</Text>
                </View>
                {appState?.user?.premium && (
                  <View style={[sh.accessBadge, { backgroundColor: GOLD + "20", borderColor: GOLD + "50" }]}>
                    <Ionicons name="diamond" size={9} color={GOLD} />
                    <Text style={[sh.accessText, { color: GOLD }]}>ELITE</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* NAVIGATION section */}
          <View style={sh.sectionLabel}>
            <View style={sh.sectionLine} />
            <Text style={sh.sectionText}>{lang === "en" ? "NAVIGATION" : "NAVEGACIÓN"}</Text>
            <View style={sh.sectionLine} />
          </View>

          <MenuItem icon="home-outline" label={t?.dash?.titulo || (lang === "en" ? "Dashboard" : "Inicio")}
            sub={lang === "en" ? "Overview & live metrics" : "Vista general y métricas"} onPress={() => goTab("home")} />
          <MenuItem icon="chatbubbles-outline" label={t?.drawer?.chatFynx || (lang === "en" ? "TARS AI" : "Chat TARS")}
            sub={lang === "en" ? "Your financial intelligence" : "Tu inteligencia financiera"} onPress={() => goTab("chat")} color={C.mint} />
          <MenuItem icon="person-outline" label={t?.drawer?.miPerfil || (lang === "en" ? "My Profile" : "Mi Perfil")}
            sub={lang === "en" ? "Score & achievements" : "Score y logros"} onPress={() => goTab("perfil")} color={C.sky} />
          <MenuItem icon="analytics-outline" label={t?.drawer?.estrategia || (lang === "en" ? "Strategy" : "Estrategia")}
            sub={lang === "en" ? "Custom AI plan" : "Plan IA personalizado"} onPress={() => goTab("estrategia")} color="#A78BFA" />

          {/* SYSTEM section — opens INSIDE drawer */}
          <View style={sh.sectionLabel}>
            <View style={sh.sectionLine} />
            <Text style={sh.sectionText}>{lang === "en" ? "SYSTEM" : "SISTEMA"}</Text>
            <View style={sh.sectionLine} />
          </View>

          <MenuItem icon="settings-outline" label={t?.drawer?.configuracion || (lang === "en" ? "Settings" : "Configuración")}
            sub={lang === "en" ? "Language, security & data" : "Idioma, seguridad y datos"}
            onPress={() => setActivePanel("settings")} color="rgba(255,255,255,0.6)" badge={lang === "en" ? "INLINE" : "INTERNO"} />
          {(appState?.user?.role === "admin" || appState?.user?.email === "ericksonp032102@gmail.com") && (
            <MenuItem icon="shield-checkmark-outline" label={t?.drawer?.admin || (lang === "en" ? "Admin Console" : "Consola Admin")}
              sub={lang === "en" ? "Root infrastructure" : "Infraestructura raíz"}
              onPress={() => goTab("admin")} color={C.rose} />
          )}

          {/* ── LOGOUT — siempre visible ── */}
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => showAlert(
                lang === "en" ? "Terminate Session" : "Cerrar Sesión",
                lang === "en"
                  ? "Are you sure you want to log out of Fynx Elite?"
                  : "¿Estás seguro que deseas salir de tu cuenta Fynx Elite?",
                [
                  { text: lang === "en" ? "Cancel" : "Cancelar", style: "cancel" },
                  {
                    text: lang === "en" ? "Log Out" : "Salir",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const { sincronizarDatos, cerrarSesion } = require("../services/firebase");
                        if (appState?.user?.uid) await sincronizarDatos(appState.user.uid, appState).catch(() => {});
                        await cerrarSesion();
                        const keys = ["mifinanzas_v7", "@fynx_session", "mifinanzas_freno_v1"];
                        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
                        await Promise.all(keys.map(k => AsyncStorage.removeItem(k)));
                        onClose();
                      } catch (e) { console.warn(e); }
                    }
                  },
                ],
                "error"
              )}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}
              activeOpacity={0.75}
            >
              <Ionicons name="log-out-outline" size={20} color={C.rose} />
              <Text style={{ fontFamily: F.monoB, fontSize: 13, color: C.rose, letterSpacing: 1 }}>
                {lang === "en" ? "TERMINATE SESSION" : "CERRAR SESIÓN"}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={sh.footer}>
          <Text style={sh.footerText}>FYNX_OS v4.0.0</Text>
          <View style={sh.footerDot} />
          <Text style={sh.footerText}>{lang === "en" ? "END-TO-END ENCRYPTED" : "CIFRADO EXTREMO A EXTREMO"}</Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[sh.masterContainer, { opacity: fadeAnim }]}
    >
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.88)" }]} />

      <Animated.View style={[sh.contentContainer, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {renderContent()}
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
}

const sh = StyleSheet.create({
  masterContainer: {
    position: "absolute", top: 0, left: 0,
    width, height, zIndex: 9999, elevation: 99,
  },
  contentContainer: { flex: 1, paddingHorizontal: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 30 },
  brand: { fontFamily: F.monoB, fontSize: 20, color: GOLD, letterSpacing: 5 },
  versionLine: { fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: 1 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: GOLD + "20", marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: GOLD + "15", borderWidth: 1.5, borderColor: GOLD + "50", alignItems: "center", justifyContent: "center" },
  eliteDot: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: GOLD, borderWidth: 2, borderColor: "#000" },
  userName: { fontFamily: F.monoB, fontSize: 17, color: "#FFF", letterSpacing: 0.3 },
  userEmail: { fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 },
  accessBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  accessText: { fontFamily: F.monoB, fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: 1 },
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, marginTop: 16 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  sectionText: { fontFamily: F.monoB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: F.monoB, fontSize: 15, color: "#FFF", marginBottom: 2 },
  menuSub: { fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.35)" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  footerText: { fontFamily: F.mono, fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: 1 },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: GOLD, opacity: 0.5 },
  // Panel styles
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  panelTitle: { fontFamily: F.monoB, fontSize: 13, color: "#FFF", letterSpacing: 2 },
});
