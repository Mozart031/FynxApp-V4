/**
 * UpdateChecker — Fynx Elite
 * Lee config/appConfig de Firestore y muestra un modal elegante
 * cuando el versionCode instalado es menor al latestVersionCode remoto.
 */
import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, Platform, Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { getAppConfig } from "../services/firebase";
import { C, F } from "../constants/themes";
import { BlurView } from "expo-blur";

// versionCode instalado — viene del manifest en el APK real
const INSTALLED_VERSION_CODE =
  Constants.expoConfig?.android?.versionCode ||
  Constants.manifest?.android?.versionCode ||
  0;

const INSTALLED_VERSION =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  "1.0.0";

export function UpdateChecker({ lang = "es" }) {
  const [visible, setVisible] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const config = await getAppConfig();
        if (cancelled || !config) return;

        const remoteCode = config.latestVersionCode || 0;

        if (remoteCode > INSTALLED_VERSION_CODE) {
          setRemoteConfig(config);
          setVisible(true);
          Animated.timing(fadeAnim, {
            toValue: 1, duration: 400, useNativeDriver: true,
          }).start();
        }
      } catch (e) {
        // Silencioso — el update checker nunca debe crashear la app
      }
    };

    // Lanzar con delay para no competir con el arranque de la app
    const timer = setTimeout(check, 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  if (!visible || !remoteConfig) return null;

  const notes = remoteConfig.releaseNotes || [];
  const newVersion = remoteConfig.latestVersion || "";
  const isForce = remoteConfig.forceUpdate === true;

  const dismiss = () => {
    if (isForce) return; // No se puede cerrar si es forzada
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 300, useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        opacity: fadeAnim,
      }}>
        <View style={{
          width: "100%", maxWidth: 360,
          backgroundColor: "#0A0A0A",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: C.gold + "50",
          overflow: "hidden",
        }}>
          <BlurView intensity={20} tint="dark">

            {/* Header dorado */}
            <View style={{
              backgroundColor: C.gold + "15",
              borderBottomWidth: 1,
              borderBottomColor: C.gold + "30",
              padding: 20,
              alignItems: "center",
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: C.gold + "20",
                borderWidth: 1, borderColor: C.gold + "60",
                alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <Ionicons name="rocket" size={26} color={C.gold} />
              </View>
              <Text style={{
                fontSize: 10, fontWeight: "800", color: C.gold,
                letterSpacing: 3, textTransform: "uppercase",
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                marginBottom: 4,
              }}>
                {lang === "en" ? "UPDATE AVAILABLE" : "ACTUALIZACIÓN DISPONIBLE"}
              </Text>
              <Text style={{
                fontSize: 22, fontWeight: "900", color: "#FFF", letterSpacing: -0.5,
              }}>
                Fynx Elite {newVersion}
              </Text>
              <Text style={{
                fontSize: 11, color: C.t3, marginTop: 4,
              }}>
                {lang === "en"
                  ? `Installed: v${INSTALLED_VERSION} → New: v${newVersion}`
                  : `Instalada: v${INSTALLED_VERSION} → Nueva: v${newVersion}`}
              </Text>
            </View>

            {/* Release notes */}
            <View style={{ padding: 20 }}>
              <Text style={{
                fontSize: 10, fontWeight: "800", color: C.t3,
                letterSpacing: 2, textTransform: "uppercase", marginBottom: 12,
              }}>
                {lang === "en" ? "WHAT'S NEW" : "NOVEDADES"}
              </Text>
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                {notes.map((note, i) => (
                  <View key={i} style={{
                    flexDirection: "row", alignItems: "flex-start",
                    gap: 10, marginBottom: 10,
                  }}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: C.gold + "20",
                      alignItems: "center", justifyContent: "center",
                      marginTop: 1, flexShrink: 0,
                    }}>
                      <Text style={{ fontSize: 10, color: C.gold, fontWeight: "900" }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: C.t2, lineHeight: 20 }}>
                      {note}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Botones */}
            <View style={{
              padding: 20, paddingTop: 4, gap: 10,
              borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
            }}>
              <TouchableOpacity
                onPress={() => {
                  try {
                    const { Linking } = require("react-native");
                    Linking.openURL("market://details?id=com.fynx.elite");
                  } catch {}
                }}
                style={{
                  backgroundColor: C.gold,
                  paddingVertical: 14, borderRadius: 14,
                  alignItems: "center", flexDirection: "row",
                  justifyContent: "center", gap: 8,
                }}
              >
                <Ionicons name="download-outline" size={18} color="#000" />
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#000", letterSpacing: 0.5 }}>
                  {lang === "en" ? "Update Now" : "Actualizar Ahora"}
                </Text>
              </TouchableOpacity>

              {!isForce && (
                <TouchableOpacity
                  onPress={dismiss}
                  style={{
                    paddingVertical: 12, borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ fontSize: 13, color: C.t3, fontWeight: "600" }}>
                    {lang === "en" ? "Maybe later" : "Quizás después"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

          </BlurView>
        </View>
      </Animated.View>
    </Modal>
  );
}
