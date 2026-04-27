/**
 * FYNX — Toast de notificaciones
 * Aparece en la parte superior, desaparece solo.
 * Uso: const { showToast, ToastComponent } = useToast()
 */
import React, { useState, useRef, useCallback } from "react";
import { Animated, Text, View } from "react-native";

export function useToast() {
  const [msg,     setMsg]     = useState("");
  const [tipo,    setTipo]    = useState("error"); // error | success | info
  const [visible, setVisible] = useState(false);
  const anim    = useRef(new Animated.Value(0)).current;
  const timer   = useRef(null);

  const showToast = useCallback((mensaje, t = "error", duracion = 3000) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(mensaje);
    setTipo(t);
    setVisible(true);
    Animated.spring(anim, { toValue:1, tension:80, friction:10, useNativeDriver:true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue:0, duration:250, useNativeDriver:true }).start(() => {
        setVisible(false);
      });
    }, duracion);
  }, []);

  const colors = {
    error:   { bg:"#FF4D6D18", border:"#FF4D6D50", text:"#FF4D6D" },
    success: { bg:"#00E5B018", border:"#00E5B050", text:"#00E5B0" },
    info:    { bg:"#38BDF818", border:"#38BDF850", text:"#38BDF8" },
  };
  const c = colors[tipo] || colors.error;

  const ToastComponent = visible ? (
    <Animated.View style={{
      position:"absolute", top:56, left:20, right:20, zIndex:9999,
      opacity: anim,
      transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[-20,0] }) }],
    }}>
      <View style={{
        backgroundColor:c.bg, borderRadius:14, borderWidth:1,
        borderColor:c.border, padding:14, flexDirection:"row", alignItems:"center", gap:10,
      }}>
        <Text style={{ fontSize:16, color:c.text }}>
          {tipo === "error" ? "✕" : tipo === "success" ? "✓" : "ℹ"}
        </Text>
        <Text style={{ fontSize:13, color:c.text, fontWeight:"600", flex:1, lineHeight:19 }}>
          {msg}
        </Text>
      </View>
    </Animated.View>
  ) : null;

  return { showToast, ToastComponent };
}
