import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { LegalScreen } from "./LegalScreen";
import { cerrarSesion } from "../services/firebase";

import { useLanguage } from "../context/LanguageContext";

export function SettingsScreen({ onClose }) {
  const { appState, updateState, isDark, toggleTheme, frenoState, toggleFreno } = useFinance();
  const { lang, changeLanguage, t } = useLanguage();
  const user = appState?.user || {};
  const [showLegal, setShowLegal] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    setCerrando(true);
    try {
      await cerrarSesion();
      await AsyncStorage.multiRemove(["@fynx_session", "@fynx_appstate"]);
      await AsyncStorage.removeItem("@fynx_carousel_visto");
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
        <Text style={{ flex: 1, fontSize: 16, color: danger ? C.rose : C.t1, fontWeight: "500" }}>{title}</Text>
        {value && <Text style={{ fontSize: 16, color: C.t3, marginRight: onPress ? 8 : 0 }}>{value}</Text>}
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
          <Text style={{ fontSize: 16, color: C.mint, fontWeight: "600" }}>Atrás</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.t1 }}>Ajustes</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        <Section title="Apariencia">
          <Cell 
            icon="language-outline" 
            title="Idioma" 
            value={lang === "es" ? "Español" : "English"}
            onPress={() => {
              Alert.alert("Idioma", "Selecciona el idioma de la app", [
                { text: "Español", onPress: () => changeLanguage("es") },
                { text: "English", onPress: () => changeLanguage("en") },
                { text: "Cancelar", style: "cancel" }
              ]);
            }}
          />
          <Cell 
            icon={ICON.star} 
            title="Tema Oscuro" 
            isLast={true}
            rightContent={
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme} 
                trackColor={{ false: C.card3, true: C.mint }} 
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title="Seguridad">
          <Cell 
            icon={ICON.lock} 
            title="Bloqueo de 48 horas" 
            value={frenoState.active ? "Activo" : "Inactivo"}
            onPress={toggleFreno}
          />
          <Cell 
            icon={ICON.lock} 
            title="Bloqueo de App (Biometría)" 
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

        <Section title="Legal y Cuenta">
          <Cell 
            icon="document-text-outline" 
            title="Términos y Privacidad" 
            onPress={() => setShowLegal(true)}
          />
          <Cell 
            icon="information-circle-outline" 
            title="Acerca de Fynx" 
            value="v1.0.0"
          />
          <Cell 
            icon="log-out-outline" 
            title={cerrando ? "Cerrando sesión..." : "Cerrar Sesión"} 
            onPress={handleLogout}
            isLast={true}
            danger={true}
          />
        </Section>

        <View style={{ alignItems: "center", marginTop: 20 }}>
           <TouchableOpacity onPress={() => {
              Alert.alert("Zona de Peligro", "¿Estás seguro que deseas reiniciar todos los datos de tu cuenta localmente?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Borrar todo", style: "destructive", onPress: async () => {
                    await AsyncStorage.removeItem("@fynx_appstate");
                    handleLogout();
                }}
              ]);
            }} style={{ padding: 10 }}>
             <Text style={{ fontSize: 13, color: C.rose, fontWeight: "600" }}>Borrar datos locales</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>

    </View>
  );
}
