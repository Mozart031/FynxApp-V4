import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../../constants/themes";
import { money } from "../../utils/formatters";
import { Input, Btn } from "../base";
import { BlurView } from "expo-blur";

const WIDGET_WIDTH = 340; // Approx width for SVG
const SVG_HEIGHT = 160;

export function PredictorWidget({ balance = 0, cur = "RD$", hidden, slideDelay = 300, esPremium, onUpgrade }) {
  const [ahorroPct, setAhorroPct] = useState(20);
  const [gastoFijo, setGastoFijo] = useState(1000);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [inflation, setInflation] = useState("3");
  const [returnRate, setReturnRate] = useState("8");

  // Client-Side Simulation: Re-calculates in <100ms
  const sim = useMemo(() => {
    const inf = Number(inflation) || 3;
    const ret = Number(returnRate) || 8;
    const saveAmt = balance * (ahorroPct / 100);
    const months = esPremium ? 12 : 3;
    
    // Generar puntos para la línea proyectada (S&P 500)
    const points = [];
    const lowerPoints = []; // Confidence Band Pessimistic
    const upperPoints = []; // Confidence Band Optimistic
    
    let currentBalance = balance;
    let maxProjected = balance;
    
    for (let i = 0; i <= months; i++) {
      // Simplification: Monthly compound interest
      const monthlyReturn = ret / 100 / 12;
      const monthlyInf = inf / 100 / 12;
      
      // Real value growth
      currentBalance = currentBalance * (1 + monthlyReturn - monthlyInf) + saveAmt;
      
      points.push(currentBalance);
      // Uncertainty grows over time (e.g. ±2% per month)
      const uncertainty = currentBalance * (0.02 * i);
      lowerPoints.push(currentBalance - uncertainty);
      upperPoints.push(currentBalance + uncertainty);
      
      if (currentBalance + uncertainty > maxProjected) {
        maxProjected = currentBalance + uncertainty;
      }
    }
    
    // Normalize to SVG coordinates
    const normalizeY = (val) => SVG_HEIGHT - 20 - ((val / Math.max(maxProjected, 1)) * (SVG_HEIGHT - 40));
    const stepX = WIDGET_WIDTH / months;
    
    // Path d string generators
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * stepX},${normalizeY(p)}`).join(' ');
    
    // Confidence band polygon (upper path forward, lower path backward)
    const upperPathStr = upperPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * stepX},${normalizeY(p)}`).join(' ');
    const lowerPathStr = lowerPoints.map((p, i) => `L${(months - i) * stepX},${normalizeY(lowerPoints[months - i])}`).join(' ');
    const bandPath = `${upperPathStr} ${lowerPathStr} Z`;
    
    return { points, linePath, bandPath, finalAmt: currentBalance };
  }, [balance, ahorroPct, gastoFijo, inflation, returnRate, esPremium]);

  // Very simple slider simulation for UX
  const renderSlider = (label, val, setVal, min, max, formatFn) => (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, color: C.t3, fontFamily: F.sansB }}>{label}</Text>
        <Text style={{ fontSize: 11, color: C.gold, fontFamily: F.monoB }}>{formatFn(val)}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity onPress={() => setVal(Math.max(min, val - (max-min)/20))} style={styles.sliderBtn}>
          <Ionicons name="remove" size={14} color={C.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1, height: 4, backgroundColor: C.border2, borderRadius: 2 }}>
          <View style={{ width: `${((val - min) / (max - min)) * 100}%`, height: "100%", backgroundColor: C.gold, borderRadius: 2 }} />
        </View>
        <TouchableOpacity onPress={() => setVal(Math.min(max, val + (max-min)/20))} style={styles.sliderBtn}>
          <Ionicons name="add" size={14} color={C.t1} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="analytics" size={16} color={C.gold} />
          <Text style={styles.title}>SIMULADOR PREDICTIVO</Text>
        </View>
        <TouchableOpacity onPress={() => esPremium ? setShowSettings(true) : onUpgrade()}>
          <Ionicons name={esPremium ? "settings-outline" : "lock-closed"} size={16} color={C.t3} />
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 10, color: C.t4, fontFamily: F.mono }}>PROYECCIÓN A {esPremium ? "12" : "3"} MESES</Text>
        <Text style={{ fontSize: 24, color: C.mint, fontFamily: F.monoB, marginTop: 4 }}>
          {hidden ? "••••••" : money(sim.finalAmt, cur)}
        </Text>
      </View>

      <View style={{ height: SVG_HEIGHT, marginHorizontal: -16, overflow: "hidden" }}>
        <Svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${WIDGET_WIDTH} ${SVG_HEIGHT}`}>
          <Defs>
            <LinearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.gold} stopOpacity="0.15" />
              <Stop offset="1" stopColor={C.gold} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          
          {/* Confidence Band */}
          {esPremium && <Path d={sim.bandPath} fill="url(#bandGrad)" />}
          
          {/* Projection Line */}
          <Path d={sim.linePath} stroke={C.gold} strokeWidth="2" fill="none" />
          
          {/* Current Node */}
          <Path d={`M0,${SVG_HEIGHT} L0,0`} stroke={C.border2} strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Future Node */}
          <Path d={`M${WIDGET_WIDTH},${SVG_HEIGHT} L${WIDGET_WIDTH},0`} stroke={C.border2} strokeWidth="1" strokeDasharray="4 4" />
        </Svg>
      </View>

      <View style={{ paddingHorizontal: 4, marginTop: 16, position: "relative" }}>
        {renderSlider("COMPROMISO DE AHORRO", ahorroPct, setAhorroPct, 0, 100, (v) => `${Math.round(v)}%`)}
        {renderSlider("GASTO FIJO MENSUAL", gastoFijo, setGastoFijo, 0, 10000, (v) => money(Math.round(v), cur))}

        {!esPremium && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", borderRadius: 12, overflow: "hidden" }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <TouchableOpacity onPress={onUpgrade} style={{ alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 12, borderRadius: 12, width: "100%", height: "100%", justifyContent: "center" }}>
              <Ionicons name="infinite" size={24} color={C.gold} />
              <Text style={{ color: C.gold, fontSize: 11, fontFamily: F.sansB, textAlign: "center", marginTop: 4 }}>
                Fynx Elite: Simula a largo plazo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.disclaimer}>
        * Estas proyecciones son estimaciones basadas en modelos matemáticos e históricos. No garantizan resultados futuros. Úselo como referencia, no como asesoría financiera.
      </Text>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000000DD", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border2 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: C.t1, marginBottom: 16 }}>Variables Globales</Text>
            
            <Text style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>INFLACIÓN ESTIMADA (%)</Text>
            <Input value={inflation} onChange={setInflation} numeric placeholder="Ej: 3" style={{ marginBottom: 16 }} />
            
            <Text style={{ fontSize: 11, color: C.t3, marginBottom: 4 }}>RETORNO ESTIMADO S&P 500 (%)</Text>
            <Input value={returnRate} onChange={setReturnRate} numeric placeholder="Ej: 8" style={{ marginBottom: 24 }} />
            
            <Btn label="Guardar Configuración" onPress={() => setShowSettings(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: C.card2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border2,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: F.monoB,
    fontSize: 10,
    color: C.gold,
    letterSpacing: 1.5,
  },
  sliderBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.border2,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    fontFamily: F.sans,
    fontSize: 8,
    color: C.t4,
    lineHeight: 12,
    marginTop: 16,
    textAlign: "center",
  }
});
