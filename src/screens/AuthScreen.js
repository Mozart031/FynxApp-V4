/**
 * FYNX — AuthScreen v4.2
 * - secureTextEntry con eye toggle
 * - Toast de errores (no alert bloqueante)
 * - Checkbox "Acepto los términos" en registro
 * - Mensajes específicos de Firebase
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, Animated, ScrollView, Modal,
} from "react-native";
import { DARK_THEME as TH } from "../constants/themes";
import { S } from "../constants/strings";
import { Btn, Input } from "../components/base";
import { useToast } from "../components/Toast";
import { LegalScreen } from "./LegalScreen";
import { iniciarSesion, registrarUsuario, recuperarContrasena } from "../services/firebase";

const MODO_DEV = true;
const MODO = { LOGIN:"login", REGISTRO:"registro", RECUPERAR:"recuperar" };

function mensajeError(code) {
  if (!code) return S.auth.errGeneral;
  if (code.includes("user-not-found"))        return S.auth.errInvalido;
  if (code.includes("wrong-password"))        return S.auth.errInvalido;
  if (code.includes("invalid-credential"))    return S.auth.errInvalido;
  if (code.includes("email-already-in-use"))  return S.auth.errExiste;
  if (code.includes("weak-password"))         return S.auth.errDebil;
  if (code.includes("network-request-failed"))return S.auth.errRed;
  if (code.includes("too-many-requests"))     return "Demasiados intentos. Espera unos minutos.";
  if (code.includes("invalid-email"))         return "El formato del correo no es válido.";
  return S.auth.errGeneral;
}

export function AuthScreen({ onAuth }) {
  const [modo,       setModo]       = useState(MODO.LOGIN);
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [cargando,   setCargando]   = useState(false);
  const [aceptoTerms,setAcepto]     = useState(false);
  const [showLegal,  setShowLegal]  = useState(false);
  const { showToast, ToastComponent } = useToast();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:600, useNativeDriver:true }),
      Animated.spring(slideAnim, { toValue:0, tension:80, friction:10, useNativeDriver:true }),
    ]).start();
  }, []);

  async function handleSubmit() {
    if (!email.trim() || (modo !== MODO.RECUPERAR && !password.trim())) {
      showToast(S.auth.errCampos, "error"); return;
    }
    if (modo === MODO.REGISTRO && !aceptoTerms) {
      showToast("Debes aceptar los Términos y Condiciones para continuar.", "error"); return;
    }
    setCargando(true);
    try {
      if (modo === MODO.LOGIN) {
        const u = await iniciarSesion(email, password);
        onAuth(u);
      } else if (modo === MODO.REGISTRO) {
        const u = await registrarUsuario(email, password);
        onAuth(u);
      } else {
        await recuperarContrasena(email);
        showToast(S.auth.enviado, "success", 5000);
      }
    } catch (e) {
      showToast(mensajeError(e?.code || e?.message), "error");
    } finally { setCargando(false); }
  }

  function cambiarModo(m) { setModo(m); }

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor:"#0A0A12" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Toast flotante */}
      {ToastComponent}

      <ScrollView
        contentContainerStyle={{ flexGrow:1, justifyContent:"center", paddingHorizontal:32, paddingVertical:48 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity:fadeAnim, transform:[{ translateY:slideAnim }] }}>

          {/* Logo */}
          <View style={{ alignItems:"center", marginBottom:44 }}>
            <View style={{ width:80, height:80, borderRadius:23, backgroundColor:"#1C1C24",
              borderWidth:1.5, borderColor:"#555", alignItems:"center", justifyContent:"center",
              marginBottom:18, shadowColor:"#888", shadowOffset:{width:0,height:4},
              shadowOpacity:0.2, shadowRadius:12, elevation:8 }}>
              <Text style={{ fontSize:32, color:"#B8B8B8", fontWeight:"700", letterSpacing:-2 }}>FX</Text>
            </View>
            <Text style={{ fontSize:28, fontWeight:"700", color:"#E0E0E0", letterSpacing:1.5 }}>
              {S.appNombre}
            </Text>
            <Text style={{ fontSize:13, color:"#555566", marginTop:5, fontWeight:"500" }}>
              {S.auth.subtitulo}
            </Text>
          </View>

          {/* Título */}
          <Text style={{ fontSize:20, fontWeight:"700", color:"#D0D0D8", textAlign:"center", marginBottom:24 }}>
            {modo === MODO.LOGIN ? S.auth.btnEntrar
             : modo === MODO.REGISTRO ? S.auth.btnRegistrar
             : S.auth.recuperar}
          </Text>

          {/* Email */}
          <Text style={{ fontSize:10, color:"#555566", fontWeight:"600", letterSpacing:2, marginBottom:7 }}>
            {S.auth.lblEmail}
          </Text>
          <Input value={email} onChange={setEmail} placeholder={S.auth.phEmail}
            style={{ marginBottom:16 }} />

          {/* Password */}
          {modo !== MODO.RECUPERAR && (
            <>
              <Text style={{ fontSize:10, color:"#555566", fontWeight:"600", letterSpacing:2, marginBottom:7 }}>
                {S.auth.lblPassword}
              </Text>
              <Input value={password} onChange={setPassword} placeholder={S.auth.phPassword}
                secureTextEntry={true} style={{ marginBottom:16 }} />
            </>
          )}

          {/* Checkbox términos — solo en registro */}
          {modo === MODO.REGISTRO && (
            <TouchableOpacity onPress={() => setAcepto(v => !v)}
              style={{ flexDirection:"row", alignItems:"center", gap:12, marginBottom:20 }}>
              <View style={{
                width:22, height:22, borderRadius:7, borderWidth:1.5,
                borderColor: aceptoTerms ? TH.mint : "#333344",
                backgroundColor: aceptoTerms ? TH.mintBg : "transparent",
                alignItems:"center", justifyContent:"center",
              }}>
                {aceptoTerms && <Text style={{ color:TH.mint, fontSize:13, fontWeight:"800" }}>✓</Text>}
              </View>
              <Text style={{ fontSize:12, color:"#666677", flex:1, lineHeight:18 }}>
                Acepto los{" "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color:TH.mint, fontWeight:"600", textDecorationLine:"underline" }}>
                  Términos y Condiciones
                </Text>
                {" "}y la{" "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color:TH.mint, fontWeight:"600", textDecorationLine:"underline" }}>
                  Política de Privacidad
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* CTA */}
          <TouchableOpacity onPress={handleSubmit} disabled={cargando}
            style={{
              backgroundColor: cargando ? "#1E1E2A" : "#B8B8B8",
              borderRadius:14, paddingVertical:17, alignItems:"center",
              shadowColor:"#888", shadowOffset:{width:0,height:4},
              shadowOpacity: cargando ? 0 : 0.25, shadowRadius:10, elevation:6,
            }}>
            <Text style={{ fontSize:16, fontWeight:"700", color: cargando ? "#444" : "#0A0A12" }}>
              {cargando ? S.auth.verificando
                : modo === MODO.LOGIN    ? S.auth.btnEntrar
                : modo === MODO.REGISTRO ? S.auth.btnRegistrar
                : S.auth.enviarCorreo}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={{ marginTop:28, gap:14, alignItems:"center" }}>
            {modo === MODO.LOGIN && (
              <>
                <TouchableOpacity onPress={() => cambiarModo(MODO.REGISTRO)}>
                  <Text style={{ fontSize:14, color:"#888899", fontWeight:"500" }}>{S.auth.linkCrear}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => cambiarModo(MODO.RECUPERAR)}>
                  <Text style={{ fontSize:13, color:"#555566", fontWeight:"500" }}>{S.auth.linkOlvide}</Text>
                </TouchableOpacity>
              </>
            )}
            {(modo === MODO.REGISTRO || modo === MODO.RECUPERAR) && (
              <TouchableOpacity onPress={() => cambiarModo(MODO.LOGIN)}>
                <Text style={{ fontSize:14, color:"#888899", fontWeight:"500" }}>{S.auth.linkTengo}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Desarrollo */}
          {MODO_DEV && (
            <View style={{ marginTop:40, paddingTop:20, borderTopWidth:1, borderTopColor:"#1E1E2A" }}>
              <Text style={{ fontSize:9, color:"#2A2A35", textAlign:"center", letterSpacing:2.5, marginBottom:12 }}>
                {S.auth.modoDev}
              </Text>
              <TouchableOpacity onPress={() => onAuth({ uid:"dev", email:"dev@local" })}
                style={{ paddingVertical:14, borderRadius:12, borderWidth:1,
                  borderColor:"#1A1A24", alignItems:"center", backgroundColor:"#0E0E18" }}>
                <Text style={{ fontSize:13, fontWeight:"600", color:"#2A2A3A" }}>{S.auth.continuarDev}</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Modal Legal */}
      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>
    </KeyboardAvoidingView>
  );
}
