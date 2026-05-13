import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { C, F } from "../../constants/themes";
import { money } from "../../utils/formatters";
import { useLanguage } from "../../context/LanguageContext";

// ─────────────────────────────────────────────────────────────
// FYNX CORE WIDGET — Deep Space Edition
// Regla: nunca mezclar useNativeDriver entre true/false en el
// mismo Animated.Value. Nunca llamar setValue() en un valor
// que ya fue attached a native driver en un render previo.
// ─────────────────────────────────────────────────────────────

const GOLD     = "#D4AF37";
const GOLD_DIM = "#8B6F1A";
const SIZE     = 200;
const PAD      = 6;
const R_OUTER  = (SIZE - PAD) / 2;
const R_MID    = R_OUTER - 14;
const CIRC_OUT = 2 * Math.PI * R_OUTER;

function healthCfg(score) {
  if (score >= 70) {
    return {
      beatUp: 130, beatDown: 280, beatPause: 900,
      coreScale: 1.0,
      glowPeak: 0.80, glowBase: 0.15,
      arcFraction: 0.78, rotateMs: 3200,
      strokeColor: GOLD, labelText: "SISTEMA ACTIVO", pulseColor: GOLD, pulseOpacity: 0.35
    };
  } else if (score >= 40) {
    return {
      beatUp: 300, beatDown: 700, beatPause: 2200,
      coreScale: 0.95,
      glowPeak: 0.20, glowBase: 0.04,
      arcFraction: 0.45, rotateMs: 9000,
      strokeColor: GOLD_DIM, labelText: "EN ALERTA", pulseColor: GOLD, pulseOpacity: 0.35
    };
  } else {
    return {
      beatUp: 500, beatDown: 1400, beatPause: 4000,
      coreScale: 0.90,
      glowPeak: 0.15, glowBase: 0.0,
      arcFraction: 0.18, rotateMs: 18000,
      strokeColor: "#555555", labelText: "ESTADO CRÍTICO", pulseColor: "#FF4D6D", pulseOpacity: 0.8
    };
  }
}

export function FynxCoreWidget({ balance = 0, cur = "RD$", hidden, score = 75, derived = {}, esPremium, onUpgrade, onPressChallenge }) {
  const { lang, t } = useLanguage();
  const cfg = healthCfg(score);

  // Traducir labelText según idioma
  let translatedLabel = cfg.labelText;
  if (lang === 'en') {
    if (score >= 70) translatedLabel = "SYSTEM ACTIVE";
    else if (score >= 40) translatedLabel = "IN ALERT";
    else translatedLabel = "CRITICAL STATE";
  }

  // Todos los valores usan useNativeDriver: true (opacity + transform)
  // NUNCA se llama setValue() después del primer start — solo se cambia
  // el toValue via nuevas animaciones que reemplazan las anteriores.
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  // Track score in a ref to derive cfg without triggering re-animation
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    const c = cfgRef.current;

    // Escala suave
    Animated.spring(scaleAnim, {
      toValue: c.coreScale, friction: 8, tension: 40, useNativeDriver: true,
    }).start();

    // Latido — toValue fijo en 1, siempre native ✓
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1, duration: c.beatUp,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0, duration: c.beatDown,
          easing: Easing.in(Easing.cubic), useNativeDriver: true,
        }),
        Animated.delay(c.beatPause),
      ])
    );

    // Glow — toValue SIEMPRE fijo en 1, intensidad controlada por interpolación en el View
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: c.beatUp + c.beatDown * 0.6,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: c.beatDown * 0.8,
          easing: Easing.in(Easing.ease), useNativeDriver: true,
        }),
        Animated.delay(c.beatPause * 0.8),
      ])
    );

    // Rotación
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1, duration: c.rotateMs,
        easing: Easing.linear, useNativeDriver: true,
      })
    );

    heartbeat.start();
    glowLoop.start();
    rotation.start();

    return () => {
      heartbeat.stop();
      glowLoop.stop();
      rotation.stop();
    };
  }, [score]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseRingOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cfg.glowPeak],  // Intensidad del ring varía según salud
  });

  const arcLen = CIRC_OUT * cfg.arcFraction;
  const gapLen = CIRC_OUT * (1 - cfg.arcFraction);

  const displayBalance = typeof hidden === "function"
    ? hidden(money(balance, cur))
    : money(balance, cur);

  return (
    <View style={styles.outerContainer}>

      {/* Grupo para asegurar centro absoluto entre glow y núcleo */}
      <View style={styles.coreGroup}>
        {/* Ambient Glow — opacity, native ✓ */}
        <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} pointerEvents="none" />

        {/* Núcleo — scale, native ✓ */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.coreWrapper}>

          {/* Anillo rotatorio — rotate, native ✓ */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: spin }] }]}
          >
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <Defs>
                <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%"   stopColor={cfg.strokeColor} stopOpacity="0"   />
                  <Stop offset="40%"  stopColor={cfg.strokeColor} stopOpacity="0.6" />
                  <Stop offset="100%" stopColor={cfg.strokeColor} stopOpacity="0"   />
                </LinearGradient>
              </Defs>
              <Circle
                cx={SIZE / 2} cy={SIZE / 2} r={R_OUTER}
                stroke={GOLD + "15"} strokeWidth={2.5} fill="transparent"
              />
              <Circle
                cx={SIZE / 2} cy={SIZE / 2} r={R_OUTER}
                stroke="url(#arcGrad)" strokeWidth={2.5} fill="transparent"
                strokeDasharray={`${arcLen} ${gapLen}`}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>

          {/* Anillo de pulso — opacity, native ✓ */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: pulseRingOpacity }]}
          >
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <Defs>
                <RadialGradient id="pulseRad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%"   stopColor={cfg.pulseColor} stopOpacity={cfg.pulseOpacity} />
                  <Stop offset="70%"  stopColor={cfg.pulseColor} stopOpacity={score < 40 ? "0.2" : "0.05"} />
                  <Stop offset="100%" stopColor={cfg.pulseColor} stopOpacity="0"    />
                </RadialGradient>
              </Defs>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={R_MID} fill="url(#pulseRad)" />
              <Circle
                cx={SIZE / 2} cy={SIZE / 2} r={R_MID}
                stroke={cfg.strokeColor} strokeWidth={1}
                fill="transparent" opacity={0.9}
              />
            </Svg>
          </Animated.View>

          {/* Centro — score */}
          <View style={styles.coreCenter}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreNumber}>{score}</Text>
            {derived.scoreTrend && isFinite(derived.scoreTrend.pctChange) && derived.scoreTrend.pctChange !== 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, opacity: 0.8 }}>
                <Ionicons 
                  name={derived.scoreTrend.trend === "positive" ? "arrow-up" : "arrow-down"} 
                  size={10} 
                  color={derived.scoreTrend.trend === "positive" ? C.mint : C.rose} 
                />
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: derived.scoreTrend.trend === "positive" ? C.mint : C.rose, marginLeft: 2 }}>
                  {Math.abs(derived.scoreTrend.pctChange)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
      </View>

      {/* Balance — debajo del núcleo, sin animación para evitar conflictos */}
      <View style={styles.balanceBlock}>
        <Text style={styles.balanceCurrency}>{lang === 'en' ? "TOTAL BALANCE" : "BALANCE TOTAL"}</Text>
        <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
          {displayBalance}
        </Text>
        <Text style={styles.statusLabel}>{translatedLabel}</Text>
      </View>

      {/* Explicabilidad (Drivers) y Reto */}
      {derived.factors && derived.factors.length > 0 && (
        <View style={{ marginTop: 24, width: "100%", paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.t4, letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>
            {lang === 'en' ? "KEY FACTORS" : "FACTORES PRINCIPALES"}
          </Text>
          <View style={{ gap: 8, overflow: "hidden", borderRadius: 12 }}>
            {derived.factors.map((f, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card2, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border2 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: f.type === "positive" ? C.mint+"20" : C.rose+"20", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name={f.icon} size={16} color={f.type === "positive" ? C.mint : C.rose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: C.t1, fontWeight: "700" }}>{f.factor}</Text>
                  <Text style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                    {lang === 'en' ? "Score impact: " : "Impacto en score: "}
                    <Text style={{ color: f.type === "positive" ? C.mint : C.rose, fontWeight: "700" }}>{f.impact > 0 ? "+"+f.impact : f.impact}</Text>
                  </Text>
                </View>
              </View>
            ))}

            {/* Premium Wall */}
            {!esPremium && (
              <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", borderRadius: 12, overflow: "hidden" }]}>
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity onPress={onUpgrade} style={{ alignItems: "center", backgroundColor: "rgba(0,0,0,0.85)", padding: 16, borderRadius: 12, width: "100%", height: "100%", justifyContent: "center" }}>
                  <Ionicons name="lock-closed" size={24} color={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 12, fontFamily: F.sansB, textAlign: "center", marginTop: 8 }}>
                    {lang === 'en' ? "Upgrade to Premium to see your Score diagnosis" : "Actualiza a Premium para ver el diagnóstico de tu Score"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {score < 70 && onPressChallenge && (
            <TouchableOpacity 
              onPress={onPressChallenge}
              style={{ marginTop: 16, backgroundColor: GOLD+"20", borderWidth: 1, borderColor: GOLD, borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Ionicons name="flash" size={18} color={GOLD} />
              <Text style={{ color: GOLD, fontWeight: "800", fontSize: 14 }}>
                {lang === 'en' ? "Accept Improvement Challenge" : "Aceptar Reto de Mejora"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
    marginBottom: 4,
  },
  coreGroup: {
    alignItems: "center",
    justifyContent: "center",
  },
  ambientGlow: {
    position: "absolute",
    width: SIZE * 1.3,
    height: SIZE * 1.3,
    borderRadius: SIZE * 0.65,
    backgroundColor: GOLD + "10", // Reducido un poco para que no sea tan pesado
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 0,
  },
  coreWrapper: {
    width: SIZE, height: SIZE,
    alignItems: "center", justifyContent: "center",
  },
  coreCenter: {
    alignItems: "center", justifyContent: "center",
  },
  scoreLabel: {
    fontFamily: F.mono, fontSize: 8, color: GOLD + "50",
    letterSpacing: 3, marginBottom: 4,
  },
  scoreNumber: {
    fontFamily: F.monoB, fontSize: 38,
    color: GOLD + "CC", letterSpacing: -1, lineHeight: 40,
  },
  balanceBlock: {
    alignItems: "center",
    marginTop: 20,
  },
  balanceCurrency: {
    fontFamily: F.mono, fontSize: 9, color: C.t3,
    letterSpacing: 3, marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: F.monoB, fontSize: 38, color: C.t1,
    letterSpacing: -1.5, textAlign: "center", paddingHorizontal: 20,
  },
  statusLabel: {
    fontFamily: F.mono, fontSize: 8, color: GOLD + "60",
    letterSpacing: 2.5, marginTop: 10,
  },
});
