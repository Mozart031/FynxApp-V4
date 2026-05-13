/**
 * FYNX — Gráfica de tendencias
 * Barras SVG puras (sin librerías) — compatible con Expo Go y EAS Build
 * Muestra ingresos vs gastos por los últimos 6 meses
 */
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, ScrollView } from "react-native";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";

function getNombreMes(offset, lang = 'es') {
  const meses = lang === 'en' 
    ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    : ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return meses[d.getMonth()];
}

function getMesKey(offset) {
  const d = new Date();
  d.setDate(1); // Evitar overflow de mes (ej: 30 abril → 30 feb = 2 mar)
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7); // "2026-04"
}

export function TrendChart({ expenses = [], income = [], cur = "RD$" }) {
  const { lang } = useLanguage();
  const MESES = 6;
  const datos = Array.from({ length: MESES }, (_, i) => {
    const key  = getMesKey(MESES - 1 - i);
    const ing  = income.filter(x => x.date?.startsWith(key)).reduce((a, x) => a + x.amount, 0);
    const gast = expenses.filter(x => x.date?.startsWith(key)).reduce((a, x) => a + x.amount, 0);
    // Si no hay transacciones de ese mes, usar ingreso configurado para el mes actual
    const ingFinal = ing === 0 && i === MESES - 1
      ? income.reduce((a, x) => a + x.amount, 0)
      : ing;
    return { mes: getNombreMes(MESES - 1 - i, lang), ing: ingFinal, gast, key };
  });

  const maxVal = Math.max(...datos.map(d => Math.max(d.ing, d.gast)), 1);
  const BAR_H  = 100;
  const anims  = useRef(datos.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(80, anims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 80, friction: 10, useNativeDriver: false })
    )).start();
  }, []);

  const hayDatos = datos.some(d => d.ing > 0 || d.gast > 0);

  if (!hayDatos) {
    return (
      <View style={{ alignItems:"center", paddingVertical:32 }}>
        <Text style={{ fontSize:28, marginBottom:10, color: C.gold }}>◈</Text>
        <Text style={{ fontSize:13, color:C.t3, textAlign:"center", fontFamily: F.sans }}>
          {lang === 'en' 
            ? "Not enough data to show the graph.\nRecord transactions to see trends."
            : "Sin datos suficientes para mostrar la gráfica.\nRegistra transacciones para ver tendencias."}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Leyenda */}
      <View style={{ flexDirection:"row", gap:16, marginBottom:16 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <View style={{ width:10, height:10, borderRadius:3, backgroundColor:C.gold }} />
          <Text style={{ fontSize:11, color:C.t3, fontFamily: F.sansM }}>{lang === 'en' ? "Income" : "Ingresos"}</Text>
        </View>
        <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <View style={{ width:10, height:10, borderRadius:3, backgroundColor:C.rose }} />
          <Text style={{ fontSize:11, color:C.t3, fontFamily: F.sansM }}>{lang === 'en' ? "Expenses" : "Gastos"}</Text>
        </View>
      </View>

      {/* Barras */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection:"row", alignItems:"flex-end", gap:12, paddingBottom:8 }}>
          {datos.map((d, i) => {
            const hIng  = (d.ing  / maxVal) * BAR_H;
            const hGast = (d.gast / maxVal) * BAR_H;
            const balance = d.ing - d.gast;
            return (
              <View key={d.key} style={{ alignItems:"center", width:44 }}>
                {/* Valor balance */}
                <Text style={{
                  fontSize:9, marginBottom:4, fontFamily: F.mono,
                  color: balance >= 0 ? C.gold : C.rose,
                }}>
                  {balance >= 0 ? "+" : ""}{Math.round(balance/1000)}k
                </Text>

                {/* Barras lado a lado */}
                <View style={{ flexDirection:"row", alignItems:"flex-end", gap:3, height:BAR_H }}>
                  {/* Ingreso */}
                  <Animated.View style={{
                    width:16, borderTopLeftRadius:5, borderTopRightRadius:5,
                    backgroundColor: C.gold,
                    height: anims[i].interpolate({
                      inputRange:[0,1], outputRange:[0, Math.max(hIng, d.ing > 0 ? 4 : 0)]
                    }),
                    opacity: d.ing > 0 ? 1 : 0.2,
                  }} />
                  {/* Gasto */}
                  <Animated.View style={{
                    width:16, borderTopLeftRadius:5, borderTopRightRadius:5,
                    backgroundColor: C.rose,
                    height: anims[i].interpolate({
                      inputRange:[0,1], outputRange:[0, Math.max(hGast, d.gast > 0 ? 4 : 0)]
                    }),
                    opacity: d.gast > 0 ? 1 : 0.2,
                  }} />
                </View>

                {/* Mes */}
                <Text style={{ fontSize:10, color:C.t3, marginTop:8, fontFamily: F.sansM }}>
                  {d.mes}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Resumen del mes actual */}
      {(() => {
        const actual = datos[MESES - 1];
        return (
          <View style={{
            flexDirection:"row", marginTop:14, gap:12,
          }}>
            <View style={{ flex:1, backgroundColor:C.card2, borderRadius:12,
              borderWidth:1, borderColor:C.gold+"30", padding:12, alignItems:"center" }}>
              <Text style={{ fontSize:9, color:C.gold, fontFamily: F.mono, letterSpacing:2 }}>{lang === 'en' ? "INCOME" : "INGRESOS"}</Text>
              <Text style={{ fontSize:14, color:C.gold, marginTop:6, fontFamily: F.monoB }}>
                {money(actual.ing, cur)}
              </Text>
            </View>
            <View style={{ flex:1, backgroundColor:C.card2, borderRadius:12,
              borderWidth:1, borderColor:C.rose+"30", padding:12, alignItems:"center" }}>
              <Text style={{ fontSize:9, color:C.rose, fontFamily: F.mono, letterSpacing:2 }}>{lang === 'en' ? "EXPENSES" : "GASTOS"}</Text>
              <Text style={{ fontSize:14, color:C.rose, marginTop:6, fontFamily: F.monoB }}>
                {money(actual.gast, cur)}
              </Text>
            </View>
          </View>
        );
      })()}
    </View>
  );
}
