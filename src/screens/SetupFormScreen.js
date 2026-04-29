/**
 * FYNX — SetupFormScreen
 * PRD v4: Formulario obligatorio para usuarios nuevos.
 * No se puede saltar. Al completar: setupCompleted: true en Firestore + AsyncStorage.
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C } from "../constants/themes";
import { S } from "../constants/strings";
import { Btn, Input, CatIcon } from "../components/base";
import { DEF_BUDGETS } from "../constants";
import { sincronizarDatos } from "../services/firebase";
import { usePostHog } from 'posthog-react-native';

const MONEDAS = [
  { codigo:"RD$", nombre:"Peso dominicano" },
  { codigo:"$",   nombre:"Dólar (USD)" },
  { codigo:"€",   nombre:"Euro" },
];

const CATS_PRINCIPALES = [
  "Comida","Transporte","Servicios","Salud",
  "Educación","Entretenimiento","Ropa","Ocio","Otros",
];

export function SetupFormScreen({ uid, email, onComplete }) {
  const posthog = usePostHog();
  const [paso,     setPaso]     = useState(1); // 1: moneda, 2: presupuesto, 3: categorías
  const [moneda,   setMoneda]   = useState("RD$");
  const [ingreso,  setIngreso]  = useState("");
  const [metaAhorro, setMeta]   = useState("20");
  const [budgets,  setBudgets]  = useState({ ...DEF_BUDGETS });
  const [catsSelec,setCats]     = useState(["Comida","Transporte","Servicios"]);
  const [cargando, setCargando] = useState(false);

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
          email,
          currency:      moneda,
          savingGoalPct: parseInt(metaAhorro) || 20,
          darkMode:      true,
          premium:       false,
        },
        income:     ingreso ? [{ id: Date.now(), source:"Ingreso principal", amount: parseFloat(ingreso), type:"fijo", date: new Date().toISOString().split("T")[0] }] : [],
        budgets,
        expenses:   [],
        goals:      [],
        debts:      [],
        reminders:  [],
        streakDays: [],
        weeklyHistory: [],
      };

      // Guardar local primero (no depende de red)
      await AsyncStorage.setItem("@fynx_appstate", JSON.stringify(userData));

      // Sincronizar con Firestore (si hay conexión)
      await sincronizarDatos(uid, userData);

      posthog?.capture('onboarding_completado');
      onComplete(userData);
    } catch (e) {
      console.warn("[Setup]", e.message);
      Alert.alert("Error de conexión", "No pudimos guardar tu configuración. Por favor verifica tu conexión a internet e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header con progreso */}
      <View style={{ paddingTop:52, paddingHorizontal:24, paddingBottom:20 }}>
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
        contentContainerStyle={{ paddingHorizontal:24, paddingBottom:40 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── PASO 1: Moneda e ingreso ── */}
        {paso === 1 && (
          <View>
            <Text style={{ fontSize:22, fontWeight:"700", color:C.t1, marginBottom:6 }}>
              Tu moneda y perfil
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:28, lineHeight:20 }}>
              Estos datos personalizan tu experiencia en Fynx.
            </Text>

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:10 }}>
              MONEDA PRINCIPAL
            </Text>
            <View style={{ gap:10, marginBottom:24 }}>
              {MONEDAS.map(m => (
                <TouchableOpacity key={m.codigo} onPress={() => setMoneda(m.codigo)}
                  style={{
                    flexDirection:"row", alignItems:"center", padding:16,
                    borderRadius:14, borderWidth:1.5,
                    borderColor: moneda === m.codigo ? C.mint : C.border,
                    backgroundColor: moneda === m.codigo ? C.mintBg : C.card2,
                  }}>
                  <View style={{
                    width:40, height:40, borderRadius:12,
                    backgroundColor: moneda === m.codigo ? C.mint+"20" : C.card3,
                    alignItems:"center", justifyContent:"center", marginRight:14,
                  }}>
                    <Text style={{ fontSize:16, fontWeight:"800", color: moneda === m.codigo ? C.mint : C.t3 }}>
                      {m.codigo}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize:14, fontWeight:"700", color: moneda === m.codigo ? C.mint : C.t1 }}>
                      {m.codigo}
                    </Text>
                    <Text style={{ fontSize:11, color:C.t3 }}>{m.nombre}</Text>
                  </View>
                  {moneda === m.codigo && (
                    <Ionicons name="checkmark" size={20} color={C.mint} style={{ marginLeft:"auto" }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:8 }}>
              INGRESO MENSUAL ({moneda}) — OPCIONAL
            </Text>
            <Input value={ingreso} onChange={setIngreso} placeholder="Ej.: 45 000" numeric />

            <Text style={{ fontSize:10, color:C.t3, fontWeight:"700", letterSpacing:2, marginBottom:10, marginTop:20 }}>
              META DE AHORRO MENSUAL
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
              Límites de presupuesto
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:24, lineHeight:20 }}>
              Define cuánto quieres gastar por categoría. Escribe 0 para sin límite.
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
                    placeholder="0 = sin límite"
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
              Categorías de gasto
            </Text>
            <Text style={{ fontSize:13, color:C.t3, marginBottom:24, lineHeight:20 }}>
              Selecciona las que usarás con más frecuencia.
            </Text>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
              {CATS_PRINCIPALES.map(cat => {
                const sel = catsSelec.includes(cat);
                return (
                  <TouchableOpacity key={cat} onPress={() => toggleCat(cat)}
                    style={{
                      paddingHorizontal:16, paddingVertical:10, borderRadius:12,
                      borderWidth:1.5,
                      borderColor: sel ? C.mint : C.border,
                      backgroundColor: sel ? C.mintBg : C.card2,
                      flexDirection:"row", alignItems:"center", gap:6,
                    }}>
                    <CatIcon cat={cat} size={20} />
                    <Text style={{ fontSize:13, fontWeight:"600",
                      color: sel ? C.mint : C.t2 }}>{cat}</Text>
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
                RESUMEN
              </Text>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                <Text style={{ fontSize:12, color:C.t3 }}>Moneda</Text>
                <Text style={{ fontSize:12, fontWeight:"700", color:C.mint }}>{moneda}</Text>
              </View>
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                <Text style={{ fontSize:12, color:C.t3 }}>Meta de ahorro</Text>
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

      {/* Navegación */}
      <View style={{ flexDirection:"row", gap:12, paddingHorizontal:24, paddingBottom:36, paddingTop:12,
        borderTopWidth:1, borderTopColor:C.border }}>
        {paso > 1 && (
          <Btn label="Atrás" ghost onPress={() => setPaso(p => p - 1)} style={{ flex:1 }} />
        )}
        <Btn
          label={paso === TOTAL_PASOS ? (cargando ? "Guardando..." : "Comenzar") : "Siguiente"}
          onPress={paso === TOTAL_PASOS ? finalizar : () => setPaso(p => p + 1)}
          disabled={cargando}
          style={{ flex: paso > 1 ? 2 : 1 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
