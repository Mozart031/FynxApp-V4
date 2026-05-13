import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "../context/FinanceContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { LegalScreen } from "./LegalScreen";
import { cerrarSesion } from "../services/firebase";
import { PremiumModal } from "../components/PremiumModal";
import { CURRENCIES } from "../constants/currencies";
import { Input } from "../components/base";

import { useLanguage } from "../context/LanguageContext";

export function SettingsScreen({ onClose }) {
  const { appState, updateState, setAppState, isDark, toggleTheme, frenoState, toggleFreno, isDemoMode, toggleDemoMode } = useFinance();
  const { lang, changeLanguage, t } = useLanguage();
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
        // Sincronizar ANTES de cerrar sesión para no perder datos
        try {
          await sincronizarDatos(appState.user.uid, appState);
        } catch (e) {
          console.warn("[Logout] Sync failed, logging out anyway", e);
        }
      }
      await cerrarSesion();
      // Borrar SOLO los datos de sesión y app, NO las preferencias del usuario
      const keysToDelete = [
        "mifinanzas_v7",      // estado de la app
        "@fynx_session",      // token de sesión
        "mifinanzas_freno_v1" // freno de emergencia
      ];
      await Promise.all(keysToDelete.map(k => AsyncStorage.removeItem(k)));
      setAppState({ onboarded: false, setupCompleted: false });
    } catch(e) { console.warn(e); }
    setCerrando(false);
  }

  function Section({ title, children }) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: C.t3, marginLeft: 16, marginBottom: 8, textTransform: "uppercase" }}>{title}</Text>
        <View style={{ backgroundColor: C.card2, borderRadius: 12, overflow: "hidden" }}>
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
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          padding: 16, 
          borderBottomWidth: isLast ? 0 : 1, 
          borderBottomColor: C.border 
        }}>
        {icon && (
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: danger ? C.roseBg : C.mintBg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <Ionicons name={icon} size={18} color={danger ? C.rose : C.mint} />
          </View>
        )}
        <Text style={{ flex: 1, fontSize: 15, color: danger ? C.rose : C.t1, fontWeight: "500" }} numberOfLines={1}>{title}</Text>
        {value && <Text style={{ fontSize: 14, color: C.t3, marginRight: onPress ? 8 : 0 }} numberOfLines={1}>{value}</Text>}
        {rightContent}
        {onPress && !rightContent && <Ionicons name="chevron-forward" size={20} color={C.t3} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={onClose} style={{ flexDirection: "row", alignItems: "center", padding: 8, marginLeft: -8 }}>
          <Ionicons name="chevron-back" size={24} color={C.mint} />
          <Text style={{ fontSize: 16, color: C.mint, fontWeight: "600" }}>{lang === 'en' ? 'Back' : 'Atrás'}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.t1 }}>{lang === 'en' ? 'Settings' : 'Ajustes'}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                
        {!user.premium && (
          <Section title="Fynx Elite">
            <TouchableOpacity onPress={() => setShowPremium(true)}
              style={{ 
                flexDirection: "row", alignItems: "center", padding: 16, 
                backgroundColor: C.gold + "10", borderRadius: 12, 
                borderWidth: 1, borderColor: C.gold + "30" 
              }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <Ionicons name="diamond" size={20} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: C.gold }}>FYNX ELITE</Text>
                <Text style={{ fontSize: 12, color: C.t2, marginTop: 1 }}>{lang === 'en' ? 'Unlock AI and remove ads' : 'Desbloquea IA y quita anuncios'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.gold} />
            </TouchableOpacity>
          </Section>
        )}

        <Section title={lang === 'en' ? "Appearance" : "Apariencia"}>
          <Cell 
            icon="language-outline" 
            title={lang === 'en' ? "Language" : "Idioma"} 
            value={lang === "es" ? "Español" : "English"}
            isLast={true}
            onPress={() => {
              showAlert(lang === 'en' ? "Language" : "Idioma", lang === 'en' ? "Select app language" : "Selecciona el idioma de la app", [
                { text: "Español", onPress: () => changeLanguage("es") },
                { text: "English", onPress: () => changeLanguage("en") },
                { text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" }
              ], "info");
            }}
          />
          <Cell 
            icon="cash-outline" 
            title={lang === 'en' ? "Currency" : "Moneda"} 
            value={`${user.currencyCode || "DOP"} (${user.currency || "RD$"})`}
            isLast={true}
            onPress={() => setShowCurrencyModal(true)}
          />
        </Section>

        <Section title={lang === 'en' ? "Preferences" : "Preferencias"}>
          <Cell 
            icon="notifications-outline" 
            title={lang === 'en' ? "Smart Notifications" : "Notificaciones Inteligentes"} 
            rightContent={
              <Switch 
                value={user.notificationsEnabled !== false} 
                onValueChange={v => updateState({ user: { ...user, notificationsEnabled: v }})} 
                trackColor={{ false: C.card3, true: C.mint }} 
                thumbColor="#fff"
              />
            }
          />
          {user.notificationsEnabled !== false && (
            <>
              <Cell 
                icon="sunny-outline" 
                title={lang === 'en' ? "Morning Intelligence" : "Resumen Matutino"} 
                value={!user.premium ? (lang === 'en' ? "Default (9:00 AM)" : "Por defecto (9:00 AM)") : `${user.morningHour !== undefined ? user.morningHour : 9}:00 AM`}
                rightContent={!user.premium ? <Ionicons name={ICON.lock} size={16} color={C.gold} style={{ marginRight: 8 }} /> : null}
                onPress={() => {
                  if (!user.premium) {
                    setShowPremium(true);
                    return;
                  }
                  const options = [7, 8, 9, 10, 11].map(h => ({
                    text: `${h}:00 AM`, 
                    onPress: () => updateState({ user: { ...user, morningHour: h }})
                  }));
                  options.push({ text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" });
                  showAlert(lang === 'en' ? "Time" : "Hora", lang === 'en' ? "Select time for morning intelligence" : "Elige la hora para tu resumen", options, "info");
                }}
              />
              <Cell 
                icon="moon-outline" 
                title={lang === 'en' ? "Evening Check-in" : "Check-in Nocturno"} 
                value={!user.premium ? (lang === 'en' ? "Default (8:00 PM)" : "Por defecto (8:00 PM)") : `${(user.eveningHour !== undefined ? user.eveningHour : 20) - 12}:00 PM`}
                rightContent={!user.premium ? <Ionicons name={ICON.lock} size={16} color={C.gold} style={{ marginRight: 8 }} /> : null}
                onPress={() => {
                  if (!user.premium) {
                    setShowPremium(true);
                    return;
                  }
                  const options = [18, 19, 20, 21, 22].map(h => ({
                    text: `${h - 12}:00 PM`, 
                    onPress: () => updateState({ user: { ...user, eveningHour: h }})
                  }));
                  options.push({ text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" });
                  showAlert(lang === 'en' ? "Time" : "Hora", lang === 'en' ? "Select time for evening check-in" : "Elige la hora para el check-in", options, "info");
                }}
              />
            </>
          )}
          <Cell 
            icon="hardware-chip-outline" 
            title={lang === 'en' ? "Haptic Feedback" : "Vibración Sutil"} 
            isLast={true}
            rightContent={
              <Switch 
                value={user.hapticsEnabled !== false} 
                onValueChange={v => updateState({ user: { ...user, hapticsEnabled: v }})} 
                trackColor={{ false: C.card3, true: C.mint }} 
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title={lang === 'en' ? "Security" : "Seguridad"}>
          <Cell 
            icon={ICON.lock} 
            title={lang === 'en' ? "48-Hour Lock" : "Bloqueo de 48 horas"} 
            value={frenoState.active ? (lang === 'en' ? "Active" : "Activo") : (lang === 'en' ? "Inactive" : "Inactivo")}
            onPress={toggleFreno}
          />
          <Cell 
            icon={ICON.lock} 
            title={lang === 'en' ? "Biometric Lock" : "Bloqueo Biométrico"} 
            isLast={true}
            rightContent={
              <Switch 
                value={user.appLockEnabled} 
                onValueChange={v => updateState({ user: { ...user, appLockEnabled: v }})} 
                trackColor={{ false: C.card3, true: C.mint }} 
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title={lang === 'en' ? "Legal and Account" : "Legal y Cuenta"}>
          <Cell 
            icon="document-text-outline" 
            title={lang === 'en' ? "Terms & Privacy" : "Términos y Privacidad"} 
            onPress={() => setShowLegal(true)}
          />
          <Cell 
            icon="information-circle-outline" 
            title={lang === 'en' ? "About Fynx" : "Acerca de Fynx"} 
            value="v1.0.0"
            onPress={() => {}} // Necesario para que sea interactivo
            onLongPress={() => {
               if (user.email === "ericksonp032102@gmail.com") {
                 const { haptic } = require("../components/base");
                 haptic("heavy");
                 onOpenAdmin && onOpenAdmin();
               }
            }}
          />
          <Cell 
            icon="log-out-outline" 
            title={cerrando ? (lang === 'en' ? "Logging out..." : "Cerrando sesión...") : (lang === 'en' ? "Log Out" : "Cerrar Sesión")} 
            onPress={handleLogout}
            isLast={true}
            danger={true}
          />
        </Section>

        {/* ── MODO PRUEBA — solo visible para cuenta desarrollador ────── */}
        {user.email === "ericksonp032102@gmail.com" && (
          <Section title={lang === 'en' ? "Developer" : "Desarrollador"}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: isDemoMode ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="camera-outline" size={18} color={C.gold} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, color: C.t1, fontWeight: "600" }}>
                      {lang === 'en' ? 'Screenshot Mode' : 'Modo Prueba'}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.t3, marginTop: 1 }}>
                      {lang === 'en' ? 'Fake data, real app' : 'Datos ficticios, app real'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDemoMode}
                  onValueChange={toggleDemoMode}
                  trackColor={{ false: C.card3, true: C.gold }}
                  thumbColor="#fff"
                />
              </View>
              {isDemoMode && (
                <View style={{ marginTop: 10, backgroundColor: "rgba(201,168,76,0.08)", borderRadius: 8, borderWidth: 1, borderColor: C.gold + "40", padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={C.gold} style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 12, color: C.gold, flex: 1, lineHeight: 18 }}>
                    {lang === 'en'
                      ? 'Screenshot mode is ON. Your real data is safe and will be restored when you disable this.'
                      : 'Modo prueba activo. Tus datos reales están seguros y se restaurarán al desactivarlo.'}
                  </Text>
                </View>
              )}
            </View>
          </Section>
        )}

        <View style={{ alignItems: "center", marginTop: 20 }}>
           <TouchableOpacity onPress={() => {
              showAlert(lang === 'en' ? "Danger Zone" : "Zona de Peligro", lang === 'en' ? "Are you sure you want to reset all your local data?" : "¿Estás seguro que deseas reiniciar todos los datos de tu cuenta localmente?", [
                { text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" },
                { text: lang === 'en' ? "Delete all" : "Borrar todo", style: "destructive", onPress: async () => {
                    await AsyncStorage.removeItem("@fynx_appstate");
                    handleLogout();
                }}
              ], "error");
            }} style={{ padding: 10 }}>
             <Text style={{ fontSize: 13, color: C.rose, fontWeight: "600" }}>{lang === 'en' ? "Clear local data" : "Borrar datos locales"}</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>

      <PremiumModal 
        visible={showPremium} 
        onClose={() => setShowPremium(false)}
        onSuscribir={() => {}} 
      />

      {showCurrencyModal && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 100, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.t1 }}>{lang === 'en' ? 'Select your currency' : 'Selecciona tu moneda'}</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={C.t3} />
              </TouchableOpacity>
            </View>
            <Input 
              placeholder={lang === 'en' ? 'Search by code (USD) or country...' : 'Buscar por código (USD) o país...'} 
              value={searchCurrency} 
              onChange={setSearchCurrency} 
              style={{ marginBottom: 16 }} 
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.filter(c => 
                c.iso.toLowerCase().includes(searchCurrency.toLowerCase()) || 
                c.name.toLowerCase().includes(searchCurrency.toLowerCase()) ||
                c.symbol.toLowerCase().includes(searchCurrency.toLowerCase())
              ).map(c => (
                <TouchableOpacity key={c.iso} onPress={() => { 
                    updateState({ user: { ...user, currencyCode: c.iso, currency: c.symbol } });
                    setShowCurrencyModal(false); 
                    setSearchCurrency(""); 
                  }}
                  style={{ flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border2, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: C.mint, width: 50 }}>{c.iso}</Text>
                  <Text style={{ fontSize: 14, color: C.t1, flex: 1 }}>{c.name}</Text>
                  <Text style={{ fontSize: 16, color: C.t3, fontWeight: "800" }}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

    </View>
  );
}
