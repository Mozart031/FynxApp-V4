/**
 * FYNX ELITE — Base Components v6
 * ADN: Precisión quirúrgica, lujo funcional, bordes gold 1px
 * Zero drop shadows — profundidad via gradientes sutiles y strokes
 */
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Animated, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { CATS } from "../constants";
import * as Haptics from "expo-haptics";

// ── Haptic helper ────────────────────────────────────────────────────────────
export function haptic(type = "light") {
  try {
    if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, accent, accentColor, danger }) {
  const acCol     = accentColor || C.gold;
  const borderCol = danger ? C.rose + "40" : accent ? acCol + "30" : C.border;
  const bg        = danger ? C.roseBg : C.card;
  return (
    <View style={[styles.card, { borderColor: borderCol, backgroundColor: bg }, style]}>
      {accent && <View style={{ position:"absolute", top:0, left:20, right:20, height:1,
        backgroundColor: acCol + "60" }} />}
      {children}
    </View>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Btn({ label, onPress, primary, ghost, danger, disabled, style, small, icon }) {
  const bg = disabled ? C.t4
    : danger ? C.rose
    : ghost ? "transparent"
    : primary === false ? "rgba(255,255,255,0.05)"
    : C.gold;
  const tc = disabled ? C.t3
    : ghost ? C.t2
    : danger ? "#fff"
    : primary === false ? C.t1
    : "#000";
  const borderCol = ghost ? C.border2 : danger ? C.rose + "60" : "transparent";
  return (
    <TouchableOpacity onPress={() => { if (!disabled) { haptic(); onPress?.(); } }} activeOpacity={0.75}
      style={[styles.btn, {
        backgroundColor: bg,
        borderWidth: ghost ? 1 : 0,
        borderColor: borderCol,
      }, small && { paddingVertical: 10, paddingHorizontal: 14 }, style]}>
      {icon && <Ionicons name={icon} size={small ? 14 : 16} color={tc} style={{ marginRight: 6 }} />}
      <Text style={[styles.btnText, { color: tc, fontFamily: F.sansB }, small && { fontSize: 12 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const formatNum = (str) => {
  if (str === undefined || str === null) return "";
  const p = String(str).replace(/,/g, "").split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return p.join(".");
};

// ── Input ───────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, numeric, style, multiline, editable=true, secureTextEntry=false, ...props }) {
  const [_vis, _setVis] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  
  const displayValue = numeric ? formatNum(value) : value;
  const handleChange = (text) => numeric ? onChange(text.replace(/,/g, "")) : onChange(text);

  return (
    <View style={[{ marginBottom: style?.marginBottom ?? 0 }]}>
      <TextInput
        style={[
          styles.input,
          {
            color: C.t1,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderColor: focused ? C.gold : "rgba(255,255,255,0.1)",
            fontFamily: numeric ? F.mono : F.sans,
          },
          !editable && { opacity: 0.4, backgroundColor: "rgba(255,255,255,0.02)" },
          secureTextEntry && { paddingRight: 48 },
          style, { marginBottom: 0 },
        ]}
        value={displayValue} onChangeText={handleChange} placeholder={placeholder}
        placeholderTextColor={C.t3} keyboardType={numeric ? "numeric" : "default"}
        multiline={multiline} editable={editable}
        secureTextEntry={secureTextEntry && !_vis}
        autoCapitalize={secureTextEntry ? "none" : "sentences"}
        autoCorrect={!secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => _setVis(v => !v)}
          style={{ position:"absolute", right:14, top:0, bottom:0, justifyContent:"center" }}>
          <Ionicons name={_vis ? "eye-outline" : "eye-off-outline"} size={20} color={_vis ? C.gold : C.t3} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function Bar({ pct, color, h }) {
  const p  = Math.min(Math.max(pct || 0, 0), 100);
  const bc = pct > 100 ? C.rose : pct > 85 ? C.orange : (color || C.gold);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: p, duration: 600, useNativeDriver: false }).start();
  }, [p]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={{ height: h || 4, borderRadius: 99, backgroundColor: C.border, overflow: "hidden" }}>
      <Animated.View style={{ height: "100%", width, borderRadius: 99, backgroundColor: bc }} />
    </View>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ label, color, size }) {
  const c = color || C.gold;
  return (
    <View style={{ backgroundColor: c + "12", borderRadius: 6, borderWidth: 1,
      borderColor: c + "28", paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: size === "sm" ? 9 : 11, fontWeight: "700", color: c,
        fontFamily: F.mono, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

// ── Category Icon ─────────────────────────────────────────────────────────────
export function CatIcon({ cat, size=44 }) {
  const info = CATS[cat] || CATS["Otro"];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28,
      backgroundColor: C.card2, borderWidth: 1, borderColor: C.goldGlow,
      alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={info.icon} size={size * 0.45} color={C.gold} />
    </View>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
export function Toggle({ value, onToggle, color, disabled }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 280, useNativeDriver: false }).start();
  }, [value]);
  const bg  = anim.interpolate({ inputRange: [0, 1], outputRange: [C.border2, color || C.gold] });
  const pos = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });
  return (
    <TouchableOpacity onPress={() => { if (!disabled) { haptic(); onToggle?.(); } }} activeOpacity={0.8}>
      <Animated.View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: bg,
        justifyContent: "center", opacity: disabled ? 0.5 : 1 }}>
        <Animated.View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff",
          position: "absolute", left: pos }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── FadeIn wrapper ────────────────────────────────────────────────────────────
export function FadeIn({ children, delay=0, style }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current; // Stronger slide up
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
      ])
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 14 }} />;
}

// ── Section header ────────────────────────────────────────────────────────────
export function Section({ sup, title, right }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10,
      flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
      <View>
        {!!sup && <Text style={{
          fontSize: 9, color: C.t3, letterSpacing: 3, marginBottom: 4,
          textTransform: "uppercase", fontFamily: F.mono,
        }}>{sup}</Text>}
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.t1, letterSpacing: -0.8,
          fontFamily: F.sansB }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  card:    { borderRadius: 16, borderWidth: 1, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  btn:     { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center",
             flexDirection: "row", justifyContent: "center" },
  btnText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2, fontFamily: F.sansB },
  input:   { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 14, marginBottom: 10, fontFamily: F.sans },
  lbl:     { fontSize: 9, letterSpacing: 3, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", fontFamily: F.mono },
});

// Onboarding-specific styles
styles.obH   = { fontSize: 26, fontWeight: "900", color: C.t1, marginBottom: 6, letterSpacing: -0.8, fontFamily: F.sansB };
styles.obSub = { fontSize: 13, color: C.t2, marginBottom: 22, lineHeight: 20, fontFamily: F.sans };
