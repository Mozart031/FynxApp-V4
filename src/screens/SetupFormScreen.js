/**
 * FYNX — SetupFormScreen
 * PRD v4: Formulario obligatorio para usuarios nuevos.
 * No se puede saltar. Al completar: setupCompleted: true en Firestore + AsyncStorage.
 * Fix v4.1: Usa saveApp() para guardar con la key correcta cifrada.
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { S } from "../constants/strings";
import { Btn, Input, CatIcon } from "../components/base";
import { DEF_BUDGETS } from "../constants";
import { sincronizarDatos } from "../services/firebase";
import { saveApp } from "../utils/security";
import { usePostHog } from 'posthog-react-native';

import { CURRENCIES } from "../constants/currencies";

const CATS_PRINCIPALES = [
  "Alimentacion","Transporte","Suscripciones","Salud",
  "Educacion","Ocio","Hogar","Otro",
];

export function SetupFormScreen({ uid, email, onComplete }) {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const { t, lang } = useLanguage();
  const { showAlert } = useEliteAlert();
  const [paso,     setPaso]     = useState(1); // 1: moneda, 2: presupuesto, 3: categorías
  const [moneda,   setMoneda]   = useState(CURRENCIES[0]);
  const [ingreso,  setIngreso]  = useState("");
  const [metaAhorro, setMeta]   = useState("20");
  const [budgets,  setBudgets]  = useState({ ...DEF_BUDGETS });
  const [catsSelec,setCats]     = useState(["Comida","Transporte","Servicios"]);
  const [cargando, setCargando] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [searchCurrency, setSearchCurrency] = useState("");

  const TOTAL_PASOS = 3;

  function toggleCat(cat) {
    setCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function finalizar() {
    setCargando(true);
    try {
      const userData = {
        onboarded:       true,
        setupCompleted:  true,
        user: {
          uid,
          email,
          currency:      moneda.symbol,
          currencyCode:  moneda.iso,
          savingGoalPct: parseInt(metaAhorro) || 20,
          darkMode:      true,
          premium:       false,
        },
        income:     ingreso ? [{ id: Date.now(), source:"Ingreso principal", amount: parseFloat(ingreso), type:"fijo", date: new Date().toISOString().split("T")[0] }] : [],
        budgets,
        customCategories: catsSelec, // Guardar categorías seleccionadas
        expenses:   [],
        goals:      [],
        debts:      [],
        reminders:  [],
        streakDays: [],
        weeklyHistory: [],
      };

      // [FIX v4.1] Guardar localmente primero (crítico)
      await saveApp(userData);

      // Sincronizar con Firestore en SEGUNDO PLANO (no bloquear el inicio de la app)
      if (uid && uid !== "local") {
        sincronizarDatos(uid, userData).catch(err => {
          console.warn("[Setup] Background sync failed:", err.message);
        });
      }

      posthog?.capture('onboarding_completado', {
        moneda: moneda.iso,
        catsCount: catsSelec.length
      });

      // Pasar a la app inmediatamente
      onComplete(userData);
    } catch (e) {
      console.warn("[Setup Error]", e.message);
      setCargando(false);
      showAlert(
        lang === 'en' ? "Error" : "Error de Guardado",
        lang === 'en' ? "Could not save your settings. Try again." : "No pudimos guardar tu configuración localmente. Revisa el espacio en tu dispositivo.",
        [], "error"
      );
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header con progreso */}
      <View style={{ paddingTop: Math.max(insets.top, 24) + 12, paddingHorizontal:24, paddingBottom:20 }}>
        <Text style={{ fontSize:11, color:C.t3, letterSpacing:2.5, fontWeight:"600", marginBottom:8 }}>
          CONFIGURACIÓN INICIAL — PASO {paso} DE {TOTAL_PASOS}
        </Text>
        <View style={{ flexDirection:"row", gap:6 }}>
          {[1,2,3].map(i => (
            <View key={i} style={{
              flex:1, height:4, borderRadius:2,
              backgroundColor: i <= paso ? C.mint : C.border2,
            }} />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── PASO 1: Moneda e ingreso ── */}
        {paso === 1 && (
          <View>
            <Text style={{ fontSize:22, fontWeight:"700", color:C.t1, marginBottom:6 }}>
              {lang === 'en' ? "Your currency & profile" : "Tu moneda y perfil"}
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:28, lineHeight:20 }}>
              {lang === 'en' ? "This data personalizes your Fynx experience." : "Estos datos personalizan tu experiencia en Fynx."}
            </Text>

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:10 }}>
              MONEDA PRINCIPAL
            </Text>
            <TouchableOpacity onPress={() => setShowCurrencyModal(true)}
              style={{
                flexDirection:"row", alignItems:"center", padding:16,
                borderRadius:14, borderWidth:1.5, borderColor: C.mint,
                backgroundColor: C.mintBg, marginBottom: 24
              }}>
              <View style={{
                width:40, height:40, borderRadius:12, backgroundColor: C.mint+"20",
                alignItems:"center", justifyContent:"center", marginRight:14,
              }}>
                <Text style={{ fontSize:16, fontWeight:"800", color: C.mint }}>{moneda.symbol}</Text>
              </View>
              <View>
                <Text style={{ fontSize:14, fontWeight:"700", color: C.mint }}>{moneda.iso} - {moneda.name}</Text>
                <Text style={{ fontSize:11, color:C.t3 }}>Toca para cambiar</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={C.mint} style={{ marginLeft:"auto" }} />
            </TouchableOpacity>

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:8 }}>
              {lang === 'en' ? "MONTHLY INCOME" : "INGRESO MENSUAL"} ({moneda.symbol}) — {lang === 'en' ? "OPTIONAL" : "OPCIONAL"}
            </Text>
            <Input value={ingreso} onChange={setIngreso} placeholder="Ej.: 45 000" numeric />

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:10, marginTop:20 }}>
              {lang === 'en' ? "MONTHLY SAVING GOAL" : "META DE AHORRO MENSUAL"}
            </Text>
            <View style={{ flexDirection:"row", gap:8 }}>
              {["10","20","30","40","50"].map(p => (
                <TouchableOpacity key={p} onPress={() => setMeta(p)}
                  style={{
                    flex:1, paddingVertical:12, borderRadius:12, borderWidth:1.5,
                    alignItems:"center",
                    borderColor: metaAhorro === p ? C.mint : C.border,
                    backgroundColor: metaAhorro === p ? C.mintBg : C.card2,
                  }}>
                  <Text style={{ fontSize:13, fontWeight:"700",
                    color: metaAhorro === p ? C.mint : C.t3 }}>{p}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── PASO 2: Presupuestos ── */}
        {paso === 2 && (
          <View>
            <Text style={{ fontSize:22, fontWeight:"700", color:C.t1, marginBottom:6 }}>
              {lang === 'en' ? "Budget Limits" : "Límites de presupuesto"}
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:24, lineHeight:20 }}>
              {lang === 'en' ? "Set your spending limits. Type 0 for unlimited." : "Define cuánto quieres gastar por categoría. Escribe 0 para sin límite."}
            </Text>
            {Object.entries(budgets).map(([cat, val]) => (
              <View key={cat} style={{
                flexDirection:"row", alignItems:"center", gap:12,
                backgroundColor:C.card2, borderRadius:14, borderWidth:1,
                borderColor:C.border, padding:12, marginBottom:10,
              }}>
                <CatIcon cat={cat} size={38} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, fontWeight:"600", color:C.t2, marginBottom:6 }}>
                    {cat}
                  </Text>
                  <Input
                    value={String(val)}
                    onChange={v => setBudgets(b => ({ ...b, [cat]: parseFloat(v) || 0 }))}
                    placeholder={lang === 'en' ? "0 = unlimited" : "0 = sin límite"}
                    numeric
                    style={{ marginBottom:0 }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── PASO 3: Categorías favoritas ── */}
        {paso === 3 && (
          <View>
            <Text style={{ fontSize:22, fontWeight:"700", color:C.t1, marginBottom:6 }}>
              {lang === 'en' ? "Spending Categories" : "Categorías de gasto"}
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:24, lineHeight:20 }}>
              {lang === 'en' ? "Select the ones you'll use most frequently." : "Selecciona las que usarás con más frecuencia."}
            </Text>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
              {CATS_PRINCIPALES.map(catKey => {
                const sel = catsSelec.includes(catKey);
                // Traducir dinámicamente para la UI
                const label = catKey === "Alimentacion" ? (lang === 'en' ? "Food" : "Comida")
                            : catKey === "Suscripciones" ? (lang === 'en' ? "Subscriptions" : "Suscripciones")
                            : catKey === "Educacion" ? (lang === 'en' ? "Education" : "Educación")
                            : catKey === "Otro" ? (lang === 'en' ? "Other" : "Otro")
                            : catKey; // El resto coincide o se traduce similar

                return (
                  <TouchableOpacity key={catKey} onPress={() => toggleCat(catKey)}
                    style={{
                      paddingHorizontal:16, paddingVertical:10, borderRadius:12,
                      borderWidth:1.5,
                      borderColor: sel ? C.mint : C.border,
                      backgroundColor: sel ? C.mintBg : C.card2,
                      flexDirection:"row", alignItems:"center", gap:6,
                    }}>
                    <CatIcon cat={catKey} size={20} />
                    <Text style={{ fontSize:13, fontWeight:"600",
                      color: sel ? C.mint : C.t2 }}>{label}</Text>
                    {sel && <Ionicons name="checkmark" size={16} color={C.mint} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Resumen antes de finalizar */}
            <View style={{
              backgroundColor:C.card2, borderRadius:14, borderWidth:1,
              borderColor:C.border, padding:16, marginTop:28,
            }}>
              <Text style={{ fontSize:12, fontWeight:"700", color:C.t2, marginBottom:12 }}>
                {lang === 'en' ? "SUMMARY" : "RESUMEN"}
              </Text>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                <Text style={{ fontSize:12, color:C.t3 }}>{lang === 'en' ? "Currency" : "Moneda"}</Text>
                <Text style={{ fontSize:12, fontWeight:"700", color:C.mint }}>{moneda.iso} ({moneda.symbol})</Text>
              </View>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                <Text style={{ fontSize:12, color:C.t3 }}>{lang === 'en' ? "Saving goal" : "Meta de ahorro"}</Text>
                <Text style={{ fontSize:12, fontWeight:"700", color:C.mint }}>{metaAhorro}%</Text>
              </View>
              <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ fontSize:12, color:C.t3 }}>Categorías</Text>
                <Text style={{ fontSize:12, fontWeight:"700", color:C.mint }}>{catsSelec.length} seleccionadas</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Navegación — paddingBottom usa insets para gesture bar */}
      <View style={{ flexDirection:"row", gap:12, paddingHorizontal:24,
        paddingBottom: Math.max(insets.bottom, 16) + 12, paddingTop:12,
        borderTopWidth:1, borderTopColor:C.border }}>
        {paso > 1 && (
          <Btn label={lang === 'en' ? "Back" : "Atrás"} ghost onPress={() => setPaso(p => p - 1)} style={{ flex:1 }} />
        )}
        <Btn
          label={paso === TOTAL_PASOS ? (cargando ? (lang === 'en' ? "Saving..." : "Guardando...") : (lang === 'en' ? "Start" : "Comenzar")) : (lang === 'en' ? "Next" : "Siguiente")}
          onPress={paso === TOTAL_PASOS ? finalizar : () => setPaso(p => p + 1)}
          disabled={cargando}
          style={{ flex: paso > 1 ? 2 : 1 }}
        />
      </View>

      {showCurrencyModal && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 100, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.t1 }}>Selecciona tu moneda</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={C.t3} />
              </TouchableOpacity>
            </View>
            <Input 
              placeholder="Buscar por código (USD) o país..." 
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
                <TouchableOpacity key={c.iso} onPress={() => { setMoneda(c); setShowCurrencyModal(false); setSearchCurrency(""); }}
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
    </KeyboardAvoidingView>
  );
}
