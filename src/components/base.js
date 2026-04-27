import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Animated, StyleSheet } from "react-native";
import { C } from "../constants/themes";
import { CATS } from "../constants";

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, accent, accentColor, danger }) {
  const acCol     = accentColor || C.mint;
  const borderCol = danger ? C.rose + "60" : accent ? acCol + "50" : C.border;
  const bg        = danger ? C.roseBg : accent ? C.mintBg : C.card;
  return (
    <View style={[styles.card, { borderColor: borderCol, backgroundColor: bg }, style]}>
      {accent && <View style={{ position:"absolute", top:0, left:0, right:0, height:2,
        backgroundColor: acCol, borderTopLeftRadius:20, borderTopRightRadius:20 }} />}
      {children}
    </View>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Btn({ label, onPress, primary, ghost, danger, disabled, style, small }) {
  const bg = disabled ? C.t4 : danger ? C.rose : primary !== false && !ghost ? C.mint : "transparent";
  const tc = disabled ? C.t3 : ghost ? C.t2 : danger ? "#fff" : "#000";
  return (
    <TouchableOpacity onPress={disabled ? null : onPress} activeOpacity={0.75}
      style={[styles.btn, { backgroundColor:bg, borderWidth: ghost ? 1 : 0, borderColor: C.border2 },
        small && { padding:10 }, style]}>
      <Text style={[styles.btnText, { color:tc }, small && { fontSize:13 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Input con soporte de contraseña segura ──────────────────────────────────
export function Input({ value, onChange, placeholder, numeric, style, multiline, editable=true, secureTextEntry=false }) {
  const [_vis, _setVis] = React.useState(false);
  return (
    <View style={[{ marginBottom: style?.marginBottom ?? 0 }]}>
      <TextInput
        style={[
          styles.input,
          { color: C.t1, backgroundColor: C.card2, borderColor: C.border2 },
          !editable && { opacity:0.4, backgroundColor:C.card3 },
          secureTextEntry && { paddingRight: 48 },
          style, { marginBottom: 0 },
        ]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={C.t3} keyboardType={numeric ? "numeric" : "default"}
        multiline={multiline} editable={editable}
        secureTextEntry={secureTextEntry && !_vis}
        autoCapitalize={secureTextEntry ? "none" : "sentences"}
        autoCorrect={!secureTextEntry}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => _setVis(v => !v)}
          style={{ position:"absolute", right:14, top:0, bottom:0, justifyContent:"center" }}>
          <Text style={{ fontSize:16, color: _vis ? C.mint : C.t3 }}>
            {_vis ? "◉" : "◎"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function Bar({ pct, color, h }) {
  const p  = Math.min(Math.max(pct || 0, 0), 100);
  const bc = pct > 100 ? C.rose : pct > 85 ? C.gold : (color || C.mint);
  return (
    <View style={{ height: h || 5, borderRadius:99, backgroundColor:C.border, overflow:"hidden" }}>
      <View style={{ height:"100%", width: p + "%", borderRadius:99, backgroundColor:bc }} />
    </View>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ label, color, size }) {
  return (
    <View style={{ backgroundColor: color+"22", borderRadius:7, borderWidth:1,
      borderColor: color+"35", paddingHorizontal:8, paddingVertical:3 }}>
      <Text style={{ fontSize: size==="sm" ? 10 : 11, fontWeight:"700", color }}>{label}</Text>
    </View>
  );
}

// ── Category Icon ─────────────────────────────────────────────────────────────
export function CatIcon({ cat, size=44 }) {
  const info = CATS[cat] || CATS["Otro"];
  return (
    <View style={{ width:size, height:size, borderRadius:size*0.3,
      backgroundColor:info.color+"20", borderWidth:1, borderColor:info.color+"30",
      alignItems:"center", justifyContent:"center" }}>
      <Text style={{ fontSize:size*0.4, color:info.color, fontWeight:"900" }}>{info.icon}</Text>
    </View>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
export function Toggle({ value, onToggle, color, disabled }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration:180, useNativeDriver:false }).start();
  }, [value]);
  const bg  = anim.interpolate({ inputRange:[0,1], outputRange:[C.border2, color || C.mint] });
  const pos = anim.interpolate({ inputRange:[0,1], outputRange:[3, 21] });
  return (
    <TouchableOpacity onPress={disabled ? null : onToggle} activeOpacity={0.8}>
      <Animated.View style={{ width:48, height:28, borderRadius:14, backgroundColor:bg,
        justifyContent:"center", opacity: disabled ? 0.5 : 1 }}>
        <Animated.View style={{ width:22, height:22, borderRadius:11, backgroundColor:"#fff",
          position:"absolute", left:pos }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── FadeIn wrapper ────────────────────────────────────────────────────────────
export function FadeIn({ children, delay=0, style }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue:1, duration:340, delay, useNativeDriver:true }),
      Animated.timing(translateY, { toValue:0, duration:340, delay, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform:[{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={{ height:1, backgroundColor:C.border, marginVertical:12 }} />;
}

// ── Section header ────────────────────────────────────────────────────────────
export function Section({ sup, title, right }) {
  return (
    <View style={{ paddingHorizontal:18, paddingTop:14, paddingBottom:10,
      flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between" }}>
      <View>
        {!!sup && <Text style={{ fontSize:10, color:C.t3, letterSpacing:2.5, marginBottom:3, textTransform:"uppercase" }}>{sup}</Text>}
        <Text style={{ fontSize:22, fontWeight:"800", color:C.t1, letterSpacing:-0.8 }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  card:    { borderRadius:20, borderWidth:1, padding:16, marginHorizontal:16, marginBottom:12 },
  btn:     { borderRadius:13, padding:15, alignItems:"center", flexDirection:"row", justifyContent:"center" },
  btnText: { fontSize:14, fontWeight:"700" },
  input:   { borderWidth:1, borderRadius:12, padding:13, fontSize:14, marginBottom:10 },
  lbl:     { fontSize:9, letterSpacing:2, fontWeight:"700", marginBottom:6, textTransform:"uppercase" },
});

// Onboarding-specific styles
styles.obH   = { fontSize:26, fontWeight:"900", color:"#F0F0FA", marginBottom:6, letterSpacing:-0.8 };
styles.obSub = { fontSize:13, color:"#9898B8", marginBottom:22, lineHeight:20 };
