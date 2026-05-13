/**
 * TarsBootSequence — Animación de arranque estilo TARS (Interestelar)
 * Solo se muestra al administrador al entrar en ROOT.
 * Monolito SVG + secuencia de texto terminal en verde.
 */
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, Animated, Dimensions, Platform, StyleSheet } from "react-native";
import Svg, { Rect, Line, G } from "react-native-svg";

const { width: SW, height: SH } = Dimensions.get("window");
const LIME = "#00FF00";
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const BOOT_LINES = [
  { text: "FYNX CORP — SECURE TERMINAL v4.0", delay: 200 },
  { text: "────────────────────────────────", delay: 400 },
  { text: "TARS ONLINE", delay: 700, highlight: true },
  { text: "UNIT: TACTICAL ADMINISTRATIVE RELAY SYSTEM", delay: 950 },
  { text: "────────────────────────────────", delay: 1150 },
  { text: "> CORE SYSTEMS ............ [OK]", delay: 1350 },
  { text: "> HUMOR SETTING ........... 75%", delay: 1520 },
  { text: "> HONESTY PROTOCOL ........ 90%", delay: 1680 },
  { text: "> FIREBASE UPLINK ......... [OK]", delay: 1840 },
  { text: "> VOICE COMMAND RELAY ..... [OK]", delay: 2000 },
  { text: "> GLOBAL NODE MAP ......... [OK]", delay: 2160 },
  { text: "────────────────────────────────", delay: 2350 },
  { text: "BIOMETRIC SCAN: COMPLETE", delay: 2500 },
  { text: "ADMINISTRATOR: AUTHENTICATED ✓", delay: 2700, highlight: true },
  { text: "ROOT ACCESS GRANTED", delay: 2950, highlight: true },
];

// Componente TARS — monolito rectangular estilo Interestelar
function TarsMonolith({ progress }) {
  const W = 80;
  const H = 200;
  const panelH = H / 4;

  // Panel lines — las 4 secciones del monolito
  const panels = [0, 1, 2, 3];

  return (
    <Svg width={W + 40} height={H + 20} viewBox={`0 0 ${W + 40} ${H + 20}`}>
      {/* Glow exterior */}
      <Rect x={16} y={6} width={W + 8} height={H + 8} rx={3} fill="none"
        stroke={LIME} strokeWidth={1} opacity={0.15} />

      {/* Cuerpo principal del monolito */}
      <Rect x={20} y={10} width={W} height={H} rx={2}
        fill="#000" stroke={LIME} strokeWidth={1.5} opacity={0.9} />

      {/* Líneas de panel (las 4 secciones que se pliegan) */}
      {panels.map(i => (
        <G key={i}>
          {/* Línea divisora horizontal de panel */}
          {i > 0 && (
            <Line
              x1={20} y1={10 + i * panelH}
              x2={20 + W} y2={10 + i * panelH}
              stroke={LIME} strokeWidth={0.8} opacity={0.6}
            />
          )}
          {/* Detalle interno del panel — línea vertical central */}
          <Line
            x1={20 + W / 2} y1={10 + i * panelH + 4}
            x2={20 + W / 2} y2={10 + (i + 1) * panelH - 4}
            stroke={LIME} strokeWidth={0.4} opacity={0.3}
          />
          {/* Detalle: puntos de articulación */}
          <Rect
            x={20 + W / 2 - 2} y={10 + i * panelH + panelH / 2 - 2}
            width={4} height={4} rx={1}
            fill={LIME} opacity={0.5}
          />
        </G>
      ))}

      {/* Scanner horizontal animado */}
      <Line
        x1={20} y1={10 + (H * 0.6)}
        x2={20 + W} y2={10 + (H * 0.6)}
        stroke={LIME} strokeWidth={1} opacity={0.4}
      />

      {/* Detalles laterales — bisagras */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <Rect key={i} x={16} y={10 + H * t - 3} width={4} height={6} rx={1}
          fill={LIME} opacity={0.5} />
      ))}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <Rect key={i} x={20 + W} y={10 + H * t - 3} width={4} height={6} rx={1}
          fill={LIME} opacity={0.5} />
      ))}

      {/* Label inferior */}
      <Rect x={30} y={10 + H - 18} width={W - 20} height={12} rx={1}
        fill={LIME} opacity={0.08} />
    </Svg>
  );
}

function BootLine({ text, highlight, startDelay, onDone }) {
  const [visible, setVisible] = useState(false);
  const [chars, setChars] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      // Typewriter char by char
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setChars(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(iv);
          if (onDone) onDone();
        }
      }, 18);
    }, startDelay);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;
  return (
    <Animated.Text style={[
      styles.bootLine,
      highlight && styles.bootLineHighlight,
      { opacity }
    ]}>
      {chars}
      {chars.length < text.length ? <Text style={{ color: LIME }}>█</Text> : ""}
    </Animated.Text>
  );
}

export function TarsBootSequence({ visible, onFinish }) {
  const outerOpacity = useRef(new Animated.Value(0)).current;
  const monolithScale = useRef(new Animated.Value(0.6)).current;
  const monolithOpacity = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  const [linesReady, setLinesReady] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Fase 1: fade in pantalla
    Animated.timing(outerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Fase 2: monolito aparece
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(monolithScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(monolithOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start(() => setLinesReady(true));

      // Scanner loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanY, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(scanY, { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      ).start();
    }, 300);

    // Auto-dismiss
    const dismiss = setTimeout(() => {
      Animated.timing(outerOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        if (onFinish) onFinish();
      });
    }, 3800);

    return () => clearTimeout(dismiss);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.container, { opacity: outerOpacity }]}>

        {/* Monolito centrado */}
        <Animated.View style={{
          transform: [{ scale: monolithScale }],
          opacity: monolithOpacity,
          marginBottom: 24,
          alignItems: "center",
        }}>
          <TarsMonolith />
          <Text style={styles.tarsLabel}>T · A · R · S</Text>
          <Text style={styles.tarsSub}>TACTICAL ADMINISTRATIVE RELAY SYSTEM</Text>
        </Animated.View>

        {/* Boot sequence */}
        <View style={styles.terminal}>
          {linesReady && BOOT_LINES.map((line, i) => (
            <BootLine
              key={i}
              text={line.text}
              highlight={line.highlight}
              startDelay={line.delay - 700}
            />
          ))}
        </View>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  tarsLabel: {
    fontFamily: MONO,
    color: LIME,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 8,
    marginTop: 12,
  },
  tarsSub: {
    fontFamily: MONO,
    color: LIME + "60",
    fontSize: 7,
    letterSpacing: 2,
    marginTop: 4,
  },
  terminal: {
    width: "100%",
    backgroundColor: "rgba(0,255,0,0.03)",
    borderWidth: 1,
    borderColor: LIME + "25",
    padding: 12,
    gap: 3,
    maxHeight: 260,
  },
  bootLine: {
    fontFamily: MONO,
    color: LIME + "80",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bootLineHighlight: {
    color: LIME,
    fontWeight: "700",
    fontSize: 11,
  },
});
