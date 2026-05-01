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
import { Ionicons } from "@expo/vector-icons";
import { DARK_THEME as TH } from "../constants/themes";
import { S } from "../constants/strings";
import { Btn, Input } from "../components/base";
import { useToast } from "../components/Toast";
import { LegalScreen } from "./LegalScreen";
import { BlurView } from "expo-blur";
import { iniciarSesion, registrarUsuario, recuperarContrasena } from "../services/firebase";

const GlassCard = ({ children, style, padding = 24, borderColor }) => {
  return (
    <View style={[{ borderRadius: 24, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: borderColor || (TH.gold + "30") }, style]}>
      <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10, 10, 10, 0.5)" }}>
        <View style={{ padding }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const MODO_DEV = true;
const MODO = { LOGIN: "login", REGISTRO: "registro", RECUPERAR: "recuperar" };

function mensajeError(code) {
  if (!code) return S.auth.errGeneral;
  const c = String(code).toLowerCase();
  if (c.includes("user-not-found"))        return S.auth.errInvalido;
  if (c.includes("wrong-password"))        return S.auth.errInvalido;
  if (c.includes("invalid-credential"))    return S.auth.errInvalido;
  if (c.includes("invalid-login"))         return S.auth.errInvalido;
  if (c.includes("email-already-in-use"))  return S.auth.errExiste;
  if (c.includes("weak-password"))         return S.auth.errDebil;
  if (c.includes("network-request-failed"))return S.auth.errRed;
  if (c.includes("too-many-requests"))     return "Demasiados intentos. Espera unos minutos.";
  if (c.includes("invalid-email"))         return "El formato del correo no es válido.";
  if (c.includes("user-disabled"))         return "Esta cuenta ha sido deshabilitada.";
  if (c.includes("operation-not-allowed")) return "Este método de autenticación no está habilitado.";
  if (c.includes("timeout"))              return "La conexión tardó demasiado. Verifica tu internet.";
  if (c.includes("internal-error"))       return "Error interno del servidor. Intenta de nuevo.";
  return S.auth.errGeneral;
}

// Timeout wrapper para evitar loading infinito
function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject({ code: "auth/timeout" }), ms)
    ),
  ]);
}

export function AuthScreen({ onAuth }) {
  const [modo, setModo] = useState(MODO.LOGIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aceptoTerms, setAcepto] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
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
        const u = await withTimeout(iniciarSesion(email, password));
        onAuth(u);
      } else if (modo === MODO.REGISTRO) {
        const u = await withTimeout(registrarUsuario(email, password));
        onAuth(u);
      } else {
        await withTimeout(recuperarContrasena(email));
        showToast(S.auth.enviado, "success", 5000);
      }
    } catch (e) {
      const errorCode = e?.code || e?.message || "unknown";
      console.error("[Fynx Auth Error]", { code: errorCode, raw: e });
      showToast(mensajeError(errorCode), "error");
    } finally { setCargando(false); }
  }

  function cambiarModo(m) { setModo(m); }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TH.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Toast flotante */}
      {ToastComponent}

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Logo (floating animation) */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)",
              borderWidth: 1.5, borderColor: TH.gold + "50", alignItems: "center", justifyContent: "center",
              marginBottom: 18, shadowColor: TH.gold, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 16, elevation: 8
            }}>
              <Text style={{ fontSize: 34, color: TH.gold, fontWeight: "900", letterSpacing: -2 }}>FX</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: TH.t1, letterSpacing: -0.5 }}>
              {S.appNombre}
            </Text>
            <Text style={{ fontSize: 13, color: TH.t3, marginTop: 4, fontWeight: "500" }}>
              {S.auth.subtitulo}
            </Text>
          </View>

          <GlassCard>
            {/* Título */}
            <Text style={{ fontSize: 18, fontWeight: "800", color: TH.t1, textAlign: "center", marginBottom: 24, letterSpacing: -0.5 }}>
              {modo === MODO.LOGIN ? S.auth.btnEntrar
                : modo === MODO.REGISTRO ? S.auth.btnRegistrar
                  : S.auth.recuperar}
            </Text>

          {/* Email */}
          <Text style={{ fontSize: 10, color: TH.t2, fontWeight: "600", letterSpacing: 2, marginBottom: 7 }}>
            {S.auth.lblEmail}
          </Text>
          <Input value={email} onChange={setEmail} placeholder={S.auth.phEmail}
            style={{ marginBottom: 16 }} />

          {/* Password */}
          {modo !== MODO.RECUPERAR && (
            <>
              <Text style={{ fontSize: 10, color: TH.t2, fontWeight: "600", letterSpacing: 2, marginBottom: 7 }}>
                {S.auth.lblPassword}
              </Text>
              <Input value={password} onChange={setPassword} placeholder={S.auth.phPassword}
                secureTextEntry={true} style={{ marginBottom: 16 }} />
            </>
          )}

          {/* Checkbox términos — solo en registro */}
          {modo === MODO.REGISTRO && (
            <TouchableOpacity onPress={() => setAcepto(v => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <View style={{
                width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
                borderColor: aceptoTerms ? TH.gold : TH.border,
                backgroundColor: aceptoTerms ? TH.goldBg : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {aceptoTerms && <Ionicons name="checkmark" size={16} color={TH.gold} style={{ fontWeight: "800" }} />}
              </View>
              <Text style={{ fontSize: 12, color: TH.t2, flex: 1, lineHeight: 18 }}>
                Acepto los{" "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color: TH.gold, fontWeight: "600", textDecorationLine: "underline" }}>
                  Términos y Condiciones
                </Text>
                {" "}y la{" "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color: TH.gold, fontWeight: "600", textDecorationLine: "underline" }}>
                  Política de Privacidad
                </Text>
              </Text>
            </TouchableOpacity>
          )}

            {/* CTA */}
            <TouchableOpacity onPress={handleSubmit} disabled={cargando}
              style={{
                backgroundColor: cargando ? "rgba(255,255,255,0.05)" : TH.gold,
                borderRadius: 14, paddingVertical: 17, alignItems: "center",
                shadowColor: TH.gold, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: cargando ? 0 : 0.4, shadowRadius: 14, elevation: 6,
                borderWidth: cargando ? 1 : 0, borderColor: TH.gold + "30",
                marginTop: 8
              }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: cargando ? TH.t3 : "#000", letterSpacing: 0.5 }}>
                {cargando ? S.auth.verificando
                  : modo === MODO.LOGIN ? S.auth.btnEntrar
                    : modo === MODO.REGISTRO ? S.auth.btnRegistrar
                      : S.auth.enviarCorreo}
              </Text>
            </TouchableOpacity>

            {/* Links */}
            <View style={{ marginTop: 24, gap: 14, alignItems: "center" }}>
              {modo === MODO.LOGIN && (
                <>
                  <TouchableOpacity onPress={() => cambiarModo(MODO.REGISTRO)}>
                    <Text style={{ fontSize: 13, color: TH.gold, fontWeight: "700" }}>{S.auth.linkCrear}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => cambiarModo(MODO.RECUPERAR)}>
                    <Text style={{ fontSize: 12, color: TH.t3, fontWeight: "600" }}>{S.auth.linkOlvide}</Text>
                  </TouchableOpacity>
                </>
              )}
              {(modo === MODO.REGISTRO || modo === MODO.RECUPERAR) && (
                <TouchableOpacity onPress={() => cambiarModo(MODO.LOGIN)}>
                  <Text style={{ fontSize: 13, color: TH.gold, fontWeight: "700" }}>{S.auth.linkTengo}</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>

          {/* Desarrollo */}
          {MODO_DEV && (
            <View style={{ marginTop: 20, paddingTop: 20 }}>
              <TouchableOpacity onPress={() => onAuth({ uid: "dev", email: "dev@local" })}
                style={{
                  paddingVertical: 14, borderRadius: 14, borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)", alignItems: "center", backgroundColor: "rgba(20,20,20,0.5)"
                }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: TH.t3 }}>{S.auth.continuarDev}</Text>
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
