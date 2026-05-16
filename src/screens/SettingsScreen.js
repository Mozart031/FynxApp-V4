import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "../context/FinanceContext";
import { useEliteAlert } from "../context/AlertContext";
import { C, F } from "../constants/themes";
import { LegalScreen } from "./LegalScreen";
import { cerrarSesion } from "../services/firebase";
import { PremiumModal } from "../components/PremiumModal";
import { CURRENCIES } from "../constants/currencies";
import { Input } from "../components/base";
import { useLanguage } from "../context/LanguageContext";
import { BlurView } from "expo-blur";

const GOLD = "#D4AF37";

export function SettingsScreen({ onClose }) {
  const { appState, updateState, setAppState, frenoState, toggleFreno, isDemoMode, toggleDemoMode } = useFinance();
  const { lang, changeLanguage } = useLanguage();
  const { showAlert } = useEliteAlert();
  const user = appState?.user || {};
  const [showLegal, setShowLegal] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [searchCurrency, setSearchCurrency] = useState("");
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    setCerrando(true);
    try {
      const { sincronizarDatos } = require("../services/firebase");
      if (appState?.user?.uid) {
        try {
          await sincronizarDatos(appState.user.uid, appState);
        } catch (e) {
          console.warn("[Logout] Sync failed, logging out anyway", e);
        }
      }
      await cerrarSesion();
      const keysToDelete = ["mifinanzas_v7", "@fynx_session", "mifinanzas_freno_v1"];
      await Promise.all(keysToDelete.map(k => AsyncStorage.removeItem(k)));
      setAppState({ onboarded: false, setupCompleted: false });
    } catch(e) { console.warn(e); }
    setCerrando(false);
  }

  function Section({ title, children }) {
    return (
      <View style={{ marginBottom: 28 }}>
        <Text style={{ 
          fontSize: 10, 
          fontFamily: F.monoB, 
          color: "rgba(255,255,255,0.3)", 
          marginLeft: 12, 
          marginBottom: 10, 
          letterSpacing: 2 
        }}>
          {title.toUpperCase()}
        </Text>
        <View style={{ 
          backgroundColor: "rgba(255,255,255,0.02)", 
          borderRadius: 20, 
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)"
        }}>
          {children}
        </View>
      </View>
    );
  }

  function Cell({ icon, title, value, onPress, onLongPress, rightContent, isLast, danger }) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        onLongPress={onLongPress}
        disabled={!onPress && !onLongPress}
        activeOpacity={0.7}
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          padding: 18, 
          borderBottomWidth: isLast ? 0 : 1, 
          borderBottomColor: "rgba(255,255,255,0.03)" 
        }}>
        {icon && (
          <View style={{ 
            width: 32, height: 32, borderRadius: 10, 
            backgroundColor: danger ? "rgba(239,68,68,0.1)" : "rgba(212, 175, 55, 0.08)", 
            alignItems: "center", justifyContent: "center", marginRight: 14,
            borderWidth: 1, borderColor: danger ? "rgba(239,68,68,0.2)" : "rgba(212, 175, 55, 0.15)"
          }}>
            <Ionicons name={icon} size={16} color={danger ? C.rose : GOLD} />
          </View>
        )}
        <Text style={{ 
          flex: 1, fontSize: 14, color: danger ? C.rose : "#FFF", 
          fontFamily: F.sansM, letterSpacing: 0.2
        }} numberOfLines={1}>{title}</Text>
        
        {value && (
          <Text style={{ 
            fontSize: 12, color: "rgba(255,255,255,0.4)", 
            marginRight: onPress ? 8 : 0, fontFamily: F.mono 
          }} numberOfLines={1}>
            {value}
          </Text>
        )}
        {rightContent}
        {onPress && !rightContent && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={{ 
        flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
        paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 20,
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)"
      }}>
        <TouchableOpacity onPress={onClose} style={{ 
          width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)",
          alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)"
        }}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontFamily: F.monoB, color: "#FFF", letterSpacing: 2 }}>SYSTEM_CONFIG</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                
        {!user.premium && (
          <TouchableOpacity onPress={() => setShowPremium(true)}
            style={{ 
              flexDirection: "row", alignItems: "center", padding: 20, 
              backgroundColor: "rgba(212,175,55,0.05)", borderRadius: 24, 
              borderWidth: 1, borderColor: "rgba(212,175,55,0.2)",
              marginBottom: 32, overflow: "hidden"
            }}>
            <View style={{ 
              width: 44, height: 44, borderRadius: 14, backgroundColor: GOLD, 
              alignItems: "center", justifyContent: "center", marginRight: 16,
              shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10
            }}>
              <Ionicons name="diamond" size={24} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: F.monoB, color: GOLD, letterSpacing: 1 }}>UPGRADE_TO_ELITE</Text>
              <Text style={{ fontSize: 11, color: "rgba(212,175,55,0.6)", marginTop: 2, fontFamily: F.sans }}>Initialize premium neural features</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </TouchableOpacity>
        )}

        <Section title={lang === 'en' ? "Identity" : "Identidad"}>
          <Cell 
            icon="language-outline" 
            title={lang === 'en' ? "Interface Language" : "Idioma de Interfaz"} 
            value={lang === "es" ? "ESPAÑOL" : "ENGLISH"}
            onPress={() => {
              showAlert(lang === 'en' ? "Language" : "Idioma", lang === 'en' ? "Select system language" : "Selecciona el idioma del sistema", [
                { text: "Español", onPress: () => changeLanguage("es") },
                { text: "English", onPress: () => changeLanguage("en") },
                { text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" }
              ], "info");
            }}
          />
          <Cell 
            icon="cash-outline" 
            title={lang === 'en' ? "Currency Unit" : "Unidad Monetaria"} 
            value={`${user.currencyCode || "DOP"} (${user.currency || "RD$"})`}
            isLast={true}
            onPress={() => setShowCurrencyModal(true)}
          />
        </Section>

        <Section title={lang === 'en' ? "Neural Alerts" : "Alertas Neuronales"}>
          <Cell 
            icon="notifications-outline" 
            title={lang === 'en' ? "Push Protocol" : "Protocolo de Notificaciones"} 
            rightContent={
              <Switch 
                value={user.notificationsEnabled !== false} 
                onValueChange={v => updateState({ user: { ...user, notificationsEnabled: v }})} 
                trackColor={{ false: "#1A1A1A", true: GOLD }} 
                thumbColor="#fff"
              />
            }
          />
          <Cell 
            icon="bar-chart-outline" 
            title={lang === 'en' ? "Weekly Performance Report" : "Reporte de Desempeño Semanal"} 
            rightContent={
              <Switch 
                value={user.weeklySummaryEnabled !== false} 
                onValueChange={v => updateState({ user: { ...user, weeklySummaryEnabled: v }})} 
                trackColor={{ false: "#1A1A1A", true: GOLD }} 
                thumbColor="#fff"
              />
            }
          />
          <Cell 
            icon="hardware-chip-outline" 
            title={lang === 'en' ? "Haptic Interface" : "Interfaz Háptica"} 
            isLast={true}
            rightContent={
              <Switch 
                value={user.hapticsEnabled !== false} 
                onValueChange={v => updateState({ user: { ...user, hapticsEnabled: v }})} 
                trackColor={{ false: "#1A1A1A", true: GOLD }} 
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title={lang === 'en' ? "Security Layer" : "Capa de Seguridad"}>
          <Cell 
            icon="lock-closed-outline" 
            title={lang === 'en' ? "Emergency Lock (48h)" : "Bloqueo Emergencia (48h)"} 
            value={frenoState.active ? "ENABLED" : "DISABLED"}
            onPress={toggleFreno}
          />
          <Cell 
            icon="finger-print-outline" 
            title={lang === 'en' ? "Biometric Access" : "Acceso Biométrico"} 
            isLast={true}
            rightContent={
              <Switch 
                value={user.appLockEnabled} 
                onValueChange={v => updateState({ user: { ...user, appLockEnabled: v }})} 
                trackColor={{ false: "#1A1A1A", true: GOLD }} 
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title={lang === 'en' ? "Data & Legal" : "Datos y Legal"}>
          <Cell 
            icon="document-text-outline" 
            title={lang === 'en' ? "Terms of Service" : "Términos de Servicio"} 
            onPress={() => setShowLegal(true)}
          />
          <Cell 
            icon="information-circle-outline" 
            title={lang === 'en' ? "Build Version" : "Versión de Compilación"} 
            value="4.0.2-ELITE"
            onLongPress={() => {
               if (user.email === "ericksonp032102@gmail.com") {
                 const { haptic } = require("../components/base");
                 haptic("heavy");
                 const { onOpenAdmin } = this.props || {}; // Fallback safe
                 onOpenAdmin && onOpenAdmin();
               }
            }}
          />
          <Cell 
            icon="log-out-outline" 
            title={cerrando ? "TERMINATING..." : (lang === 'en' ? "Terminate Session" : "Terminar Sesión")} 
            onPress={handleLogout}
            isLast={true}
            danger={true}
          />
        </Section>

        {user.email === "ericksonp032102@gmail.com" && (
          <Section title="Debug Console">
            <Cell 
              icon="terminal-outline" 
              title="Screenshot Mode"
              isLast={true}
              rightContent={
                <Switch
                  value={isDemoMode}
                  onValueChange={toggleDemoMode}
                  trackColor={{ false: "#1A1A1A", true: "#00FF00" }}
                  thumbColor="#fff"
                />
              }
            />
          </Section>
        )}

        <View style={{ alignItems: "center", marginTop: 20 }}>
           <TouchableOpacity onPress={() => {
              showAlert(lang === 'en' ? "Purge Data" : "Purga de Datos", lang === 'en' ? "Are you sure? This will wipe all local data clusters." : "¿Estás seguro? Esto borrará todos los clústeres de datos locales.", [
                { text: lang === 'en' ? "Abort" : "Abortar", style: "cancel" },
                { text: lang === 'en' ? "Execute" : "Ejecutar", style: "destructive", onPress: async () => {
                    await AsyncStorage.removeItem("@fynx_appstate");
                    handleLogout();
                }}
              ], "error");
            }} style={{ padding: 10 }}>
             <Text style={{ fontSize: 11, color: "rgba(239,68,68,0.5)", fontFamily: F.monoB, letterSpacing: 1 }}>SYSTEM_PURGE_LOCAL</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} onSuscribir={() => {}} />

      {showCurrencyModal && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 100, justifyContent: "flex-end" }}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={{ backgroundColor: "#0F0F0F", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: "85%", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontFamily: F.monoB, color: "#FFF", letterSpacing: 1 }}>CURRENCY_SELECTOR</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Input 
              placeholder="SEARCH_ISO_OR_NAME..." 
              value={searchCurrency} 
              onChange={setSearchCurrency} 
              style={{ marginBottom: 20, backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)" }} 
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.filter(c => 
                c.iso.toLowerCase().includes(searchCurrency.toLowerCase()) || 
                c.name.toLowerCase().includes(searchCurrency.toLowerCase())
              ).map(c => (
                <TouchableOpacity key={c.iso} onPress={() => { 
                    updateState({ user: { ...user, currencyCode: c.iso, currency: c.symbol } });
                    setShowCurrencyModal(false); 
                    setSearchCurrency(""); 
                  }}
                  style={{ flexDirection: "row", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontFamily: F.monoB, color: GOLD, width: 60 }}>{c.iso}</Text>
                  <Text style={{ fontSize: 14, color: "#FFF", flex: 1, fontFamily: F.sansM }}>{c.name}</Text>
                  <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontFamily: F.mono }}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
