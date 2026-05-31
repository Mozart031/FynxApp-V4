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
  Platform, Animated, ScrollView, Modal, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DARK_THEME as TH } from "../constants/themes";
import { S } from "../constants/strings";
import { Btn, Input } from "../components/base";
import { useToast } from "../components/Toast";
import { LegalScreen } from "./LegalScreen";
import { BlurView } from "expo-blur";
import { iniciarSesion, registrarUsuario, recuperarContrasena, iniciarSesionGoogle, iniciarSesionApple } from "../services/firebase";
import { useLanguage } from "../context/LanguageContext";
import * as AppleAuthentication from 'expo-apple-authentication';
// GoogleSignin se carga lazy para no crashear en Expo Go

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

const MODO_DEV = false;
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
  const { t, lang, changeLanguage } = useLanguage();
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

    try {
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "184364852664-b7pb76pr7u1nlmeau1ousbt22ravvfg1.apps.googleusercontent.com",
      });
    } catch (e) {
      console.warn("[Fynx] GoogleSignin no disponible (Expo Go)", e.message);
    }
  }, []);

  async function handleGoogleLogin() {
    setCargando(true);
    try {
      const u = await withTimeout(iniciarSesionGoogle(), 20000);
      onAuth(u);
    } catch (e) {
      const errorCode = e?.code || e?.message || "unknown";
      if (String(errorCode).includes("SIGN_IN_CANCELLED") || String(errorCode).includes("12501")) {
        setCargando(false);
        return; // Ignore user cancellation
      }
      console.error("[Fynx Auth Error Google]", { code: errorCode, raw: e });
      showToast(`Google Auth Error: ${errorCode} | ${e?.message || "Desconocido"}`, "error");
    } finally { setCargando(false); }
  }

  async function handleAppleLogin() {
    setCargando(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const u = await withTimeout(iniciarSesionApple(credential), 20000);
      onAuth(u);
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        setCargando(false);
        return;
      }
      showToast(`Apple Auth Error: ${e.message}`, "error");
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit() {
    if (!email.trim() || (modo !== MODO.RECUPERAR && !password.trim())) {
      showToast(t.auth.errCampos, "error"); return;
    }
    if (modo === MODO.REGISTRO && !aceptoTerms) {
      showToast(lang === 'en' ? "You must accept the Terms and Conditions to continue." : "Debes aceptar los Términos y Condiciones para continuar.", "error"); return;
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
        showToast(t.auth.enviado, "success", 5000);
      }
    } catch (e) {
      const errorCode = e?.code || e?.message || "unknown";
      console.error("[Fynx Auth Error]", { code: errorCode, raw: e });
      showToast(mensajeError(errorCode), "error"); // Note: mensajeError ideally needs 't' passed to it, but toast is okay for now
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 120 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Language Toggle */}
          <View style={{ position: 'absolute', top: -20, right: 0, zIndex: 10 }}>
            <TouchableOpacity onPress={() => changeLanguage(lang === 'es' ? 'en' : 'es')}
               style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Ionicons name="language" size={14} color={TH.t3} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: TH.t3, fontWeight: "600" }}>{lang.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Logo (floating animation) */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)",
              borderWidth: 1.5, borderColor: TH.gold + "50", alignItems: "center", justifyContent: "center",
              marginBottom: 18, shadowColor: TH.gold, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, overflow: "hidden"
            }}>
              <Image source={require("../../assets/icon.png")} style={{ width: 80, height: 80 }} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: TH.t1, letterSpacing: -0.5 }}>
              {t.appNombre}
            </Text>
            <Text style={{ fontSize: 13, color: TH.t3, marginTop: 4, fontWeight: "500" }}>
              {t.auth.subtitulo}
            </Text>
          </View>

          <GlassCard>
            {/* Título */}
            <Text style={{ fontSize: 18, fontWeight: "800", color: TH.t1, textAlign: "center", marginBottom: 24, letterSpacing: -0.5 }}>
              {modo === MODO.LOGIN ? t.auth.btnEntrar
                : modo === MODO.REGISTRO ? t.auth.btnRegistrar
                  : t.auth.recuperar}
            </Text>

          {/* Email */}
          <Text style={{ fontSize: 10, color: TH.t2, fontWeight: "600", letterSpacing: 2, marginBottom: 7 }}>
            {t.auth.lblEmail}
          </Text>
          <Input value={email} onChange={setEmail} placeholder={t.auth.phEmail}
            style={{ marginBottom: 16 }} />

          {/* Password */}
          {modo !== MODO.RECUPERAR && (
            <>
              <Text style={{ fontSize: 10, color: TH.t2, fontWeight: "600", letterSpacing: 2, marginBottom: 7 }}>
                {t.auth.lblPassword}
              </Text>
              <Input value={password} onChange={setPassword} placeholder={t.auth.phPassword}
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
                {lang === 'en' ? "I accept the " : "Acepto los "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color: TH.gold, fontWeight: "600", textDecorationLine: "underline" }}>
                  {lang === 'en' ? "Terms and Conditions" : "Términos y Condiciones"}
                </Text>
                {lang === 'en' ? " and " : " y la "}
                <Text onPress={() => setShowLegal(true)}
                  style={{ color: TH.gold, fontWeight: "600", textDecorationLine: "underline" }}>
                  {lang === 'en' ? "Privacy Policy" : "Política de Privacidad"}
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
                {cargando ? t.auth.verificando
                  : modo === MODO.LOGIN ? t.auth.btnEntrar
                    : modo === MODO.REGISTRO ? t.auth.btnRegistrar
                      : t.auth.enviarCorreo}
              </Text>
            </TouchableOpacity>

            {/* O Divider */}
            {modo === MODO.LOGIN && (
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: TH.border || "rgba(255,255,255,0.1)" }} />
                <Text style={{ marginHorizontal: 12, color: TH.t3, fontSize: 12, fontWeight: "600" }}>{lang === 'en' ? "OR" : "O"}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: TH.border || "rgba(255,255,255,0.1)" }} />
              </View>
            )}

            {/* Google e iOS Sign In CTAs */}
            {modo === MODO.LOGIN && (
              <>
                <TouchableOpacity onPress={handleGoogleLogin} disabled={cargando}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: 14, paddingVertical: 15, alignItems: "center",
                    flexDirection: "row", justifyContent: "center", gap: 10,
                    borderWidth: 1, borderColor: TH.border || "rgba(255,255,255,0.1)",
                  }}>
                  <Ionicons name="logo-google" size={18} color={TH.t1} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: TH.t1 }}>
                    {lang === 'en' ? "Continue with Google" : "Continuar con Google"}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={14}
                    style={{ width: '100%', height: 52, marginTop: 12 }}
                    onPress={handleAppleLogin}
                  />
                )}
              </>
            )}

            {/* Links */}
            <View style={{ marginTop: 24, gap: 14, alignItems: "center" }}>
              {modo === MODO.LOGIN && (
                <>
                  <TouchableOpacity onPress={() => cambiarModo(MODO.REGISTRO)}>
                    <Text style={{ fontSize: 13, color: TH.gold, fontWeight: "700" }}>{t.auth.linkCrear}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => cambiarModo(MODO.RECUPERAR)}>
                    <Text style={{ fontSize: 12, color: TH.t3, fontWeight: "600" }}>{t.auth.linkOlvide}</Text>
                  </TouchableOpacity>
                </>
              )}
              {(modo === MODO.REGISTRO || modo === MODO.RECUPERAR) && (
                <TouchableOpacity onPress={() => cambiarModo(MODO.LOGIN)}>
                  <Text style={{ fontSize: 13, color: TH.gold, fontWeight: "700" }}>{t.auth.linkTengo}</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>

        </Animated.View>
      </ScrollView>

      {/* Modal Legal */}
      <Modal visible={showLegal} animationType="slide" onRequestClose={() => setShowLegal(false)}>
        <LegalScreen onClose={() => setShowLegal(false)} />
      </Modal>
    </KeyboardAvoidingView>
  );
}
