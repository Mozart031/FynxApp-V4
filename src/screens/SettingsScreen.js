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

import { useLanguage } from "../context/LanguageContext";

export function SettingsScreen({ onClose }) {
  const { appState, updateState, setAppState, isDark, toggleTheme, frenoState, toggleFreno } = useFinance();
  const { lang, changeLanguage, t } = useLanguage();
  const { showAlert } = useEliteAlert();
  const user = appState?.user || {};
  const [showLegal, setShowLegal] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    setCerrando(true);
    try {
      const { sincronizarDatos } = require("../services/firebase");
      if (appState?.user?.uid) {
        // Sincronizar ANTES de cerrar sesión para no perder datos
        await sincronizarDatos(appState.user.uid, appState);
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

  function Cell({ icon, title, value, onPress, rightContent, isLast, danger }) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={!onPress}
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
          />
          <Cell 
            icon="log-out-outline" 
            title={cerrando ? (lang === 'en' ? "Logging out..." : "Cerrando sesión...") : (lang === 'en' ? "Log Out" : "Cerrar Sesión")} 
            onPress={handleLogout}
            isLast={true}
            danger={true}
          />
        </Section>

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

    </View>
  );
}
