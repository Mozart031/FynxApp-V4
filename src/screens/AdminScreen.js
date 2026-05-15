import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Switch, Modal, Animated, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { getAdminStats, sendGlobalBroadcast } from "../services/firebase";
import { F } from "../constants/themes";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { WorldPresenceMap } from "../components/WorldPresenceMap";
import { TarsBootSequence } from "../components/TarsBootSequence";

const LIME = "#00FF00";
const DARK = "#000000";

export function AdminScreen({ isActive, navigation }) {
  const { lang } = useLanguage();
  const { appState, updateState } = useFinance();
  const [showBoot, setShowBoot] = useState(true); // Animación TARS al entrar
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);

  // Custom Alert & Prompt States
  const [hackerAlert, setHackerAlert] = useState(null);
  const [hackerPrompt, setHackerPrompt] = useState(null);
  const [promptInput, setPromptInput] = useState("");

  // TARS Admin Voice Logic
  const { isRecording, isProcessing, lastBase64, startRecording, stopRecording } = useVoiceRecorder();
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.stopAnimation();
      micPulse.setValue(1);
    }
  }, [isRecording]);

  const user = appState?.user || {};
  const isPremium = user.isPremium || user.tempUnlock > Date.now();
  const adsEnabled = appState?.config?.adsEnabled !== false;

  const [tarsInput, setTarsInput] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Paso 1: Transcribir el audio a texto (SIN ejecutar nada)
  const transcribeAudio = useCallback(async (base64) => {
    // PRIMER FEEDBACK - si esto aparece, la función sí se llama
    setTarsInput("[ TARS recibió audio... ]");
    setIsTranscribing(true);
    if (!base64) { setTarsInput("[ Error: audio vació ]"); setIsTranscribing(false); return; }
    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!API_KEY) { setTarsInput(""); Alert.alert("Error", "API Key no encontrada en .env"); return; }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Transcribe exactly what the user said in this audio. Return ONLY the transcription text, nothing else." },
                { inlineData: { mimeType: "audio/mp4", data: base64 } }
              ]
            }]
          })
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      setTarsInput(text || "[ Sin respuesta de Gemini ]");
    } catch (e) {
      setTarsInput("");
      Alert.alert("TARS ERROR", `Transcripción fallida: ${e.message}`);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  // Backup: si el callback no disparó, lo atrapamos aquí
  useEffect(() => {
    if (lastBase64 && !isRecording) {
      transcribeAudio(lastBase64);
    }
  }, [lastBase64]);

  // Paso 2: Ejecutar el comando de texto
  const executeTarsCommand = useCallback(async () => {
    const cmd = tarsInput.trim();
    if (!cmd) return;
    const lower = cmd.toLowerCase();
    if (lower.includes("broadcast") || lower.includes("aviso") || lower.includes("notif")) {
      const msg = cmd.replace(/broadcast|aviso|notif(ica(r|cion)?)?/gi, "").trim();
      if (msg) { await sendGlobalBroadcast(msg); Alert.alert("✅ TARS", `Broadcast enviado: "${msg}"`); }
      else setHackerPrompt({ title: "BROADCAST", placeholder: "Escribe el mensaje..." });
    } else if (lower.includes("premium") || lower.includes("elite")) {
      togglePremium();
      Alert.alert("✅ TARS", `Elite ${!isPremium ? "activado" : "desactivado"}`);
    } else if (lower.includes("anuncio") || lower.includes("ads") || lower.includes("publicidad")) {
      toggleAds();
      Alert.alert("✅ TARS", `Anuncios ${!adsEnabled ? "activados" : "desactivados"}`);
    } else if (lower.includes("status") || lower.includes("reporte") || lower.includes("info")) {
      Alert.alert("📊 SYSTEM", `Usuarios: ${stats?.totalUsers || 0}\nElite: ${stats?.premiumCount || 0}\nElite activo: ${isPremium ? "SÍ" : "NO"}\nAds: ${adsEnabled ? "ON" : "OFF"}`);
    } else {
      Alert.alert("⚠️ TARS", `Comando no reconocido:\n"${cmd}"\n\nPrueba: "broadcast [msg]", "elite", "ads", "status"`);
    }
    setTarsInput("");
  }, [tarsInput, isPremium, adsEnabled, stats]);

  const handleTarsVoice = async () => {
    if (isRecording) {
      setTarsInput("[ deteniendo grabación... ]");
      const base64 = await stopRecording();
      if (base64) transcribeAudio(base64);
      else setTarsInput("[ Sin audio capturado ]");
    } else {
      setTarsInput("");
      await startRecording(transcribeAudio);
    }
  };

  useEffect(() => {
    if (user?.email !== "ericksonp032102@gmail.com") {
      navigation.goBack();
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.warn("Stats error", e);
      }
      setLoading(false);
    };
    fetchStats();
  }, [appState]);

  const togglePremium = () => {
    updateState({ user: { ...user, isPremium: !isPremium } });
  };

  const toggleAds = () => {
    updateState({ config: { ...appState.config, adsEnabled: !adsEnabled } });
  };

  const injectStressData = () => {
    setHackerAlert({
      title: "STRESS_TEST_INITIATED",
      message: "WARNING: Injecting 50 random transactions into the core database. This operation is irreversible locally. Proceed?",
      confirmLabel: "EXECUTE",
      onConfirm: () => {
        const newExps = [...(appState.expenses || [])];
        for (let i = 0; i < 50; i++) {
          newExps.push({
            id: Date.now() + i,
            amount: Math.floor(Math.random() * 500) + 1,
            category: ["Food", "Transport", "Shopping", "Entertainment"][Math.floor(Math.random() * 4)],
            date: new Date().toISOString(),
            note: "STRESS_TEST_DATA_" + i
          });
        }
        updateState({ expenses: newExps });
        setHackerAlert(null);
      }
    });
  };

  const handleBroadcast = async () => {
    if (!promptInput.trim()) return;
    const { sendGlobalBroadcast } = require("../services/firebase");
    const success = await sendGlobalBroadcast(promptInput);
    if (success) {
      setHackerPrompt(null);
      setPromptInput("");
      setHackerAlert({
        title: "TRANSMISSION_SUCCESS",
        message: "Data packet broadcasted to the global network. All active nodes will receive the update.",
        confirmLabel: "OK"
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }} edges={['top', 'left', 'right']}>
      {/* TARS Boot Sequence — solo admin, una vez por sesión */}
      {isActive && <TarsBootSequence visible={showBoot} onFinish={() => setShowBoot(false)} />}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="terminal-outline" size={20} color={LIME} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="logo-android" size={24} color={LIME} />
          <View>
            <Text style={styles.headerTitle}>FYNX_ROOT_ACCESS_v4.0</Text>
            <Text style={styles.headerSub}>ADMINISTRATOR_LEVEL_GOD</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* SECTION: TARS_ADMIN_COMMAND_CENTER */}
        <Text style={styles.sectionLabel}>// TARS_VOICE_COMMAND_CENTER (ADMIN_ONLY)</Text>
        <TouchableOpacity
          onPress={handleTarsVoice}
          onLongPress={() => setHackerAlert({
            title: "TARS_COMMAND_HELP",
            message: "1. Toca para empezar a grabar.\n2. Habla tu comando.\n3. Toca de nuevo para parar.\n4. El texto aparece — pulsa EXECUTE.\n\nEjemplos:\n• 'broadcast Actualización disponible'\n• 'activa el modo elite'\n• 'desactiva los anuncios'\n• 'dame el status'"
          })}
          style={[styles.hackerCard, { borderColor: isRecording ? LIME : isTranscribing ? LIME + "60" : LIME + "30" }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isRecording ? LIME : "rgba(0,255,0,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={isRecording ? "stop-circle" : isTranscribing ? "hourglass-outline" : "mic-outline"} size={24} color={isRecording ? DARK : LIME} />
              </View>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hackerText, { color: isRecording ? LIME : LIME + "80", fontSize: 13, fontWeight: "800" }]}>
                {isRecording ? "● REC — TOCA PARA PARAR" : isTranscribing ? "TRANSCRIBIENDO AUDIO..." : "TOCA PARA GRABAR COMANDO"}
              </Text>
              <Text style={[styles.hackerText, { fontSize: 9, opacity: 0.4, marginTop: 2 }]}>
                {isRecording ? "Habla y luego toca el botón para procesar" : "Mantén pulsado para ayuda"}
              </Text>
            </View>
            {(isRecording || isTranscribing) && <ActivityIndicator color={LIME} size="small" />}
          </View>
        </TouchableOpacity>

        {/* CAMPO DE TEXTO + BOTÓN EJECUTAR */}
        <View style={{ borderWidth: 1, borderColor: LIME + "40", backgroundColor: "rgba(0,255,0,0.03)", padding: 10, marginBottom: 10 }}>
          <Text style={[styles.hackerText, { fontSize: 8, opacity: 0.5, marginBottom: 6 }]}>[ TARS_INPUT — EDITABLE ]</Text>
          <TextInput
            value={tarsInput}
            onChangeText={setTarsInput}
            placeholder="> Habla o escribe un comando..."
            placeholderTextColor={LIME + "30"}
            style={{ fontFamily: F.mono, color: LIME, fontSize: 13, minHeight: 40 }}
            multiline
          />
        </View>
        <TouchableOpacity
          onPress={executeTarsCommand}
          disabled={!tarsInput.trim()}
          style={[styles.actionBtn, { opacity: tarsInput.trim() ? 1 : 0.3 }]}
        >
          <Ionicons name="flash-outline" size={18} color={DARK} />
          <Text style={styles.actionBtnText}>EXECUTE_TARS_COMMAND</Text>
        </TouchableOpacity>

        {/* SECTION: SYSTEM CONTROLS */}
        <Text style={styles.sectionLabel}>// SYSTEM_CONTROLS (LONG_PRESS_FOR_HELP)</Text>
        <View style={styles.hackerCard}>
          <ControlRow
            label="BYPASS_ELITE_SUBSCRIPTION"
            value={isPremium}
            onToggle={togglePremium}
            icon="ribbon-outline"
            onHelp={() => setHackerAlert({
              title: "ELITE_OVERRIDE_HELP",
              message: "Forcefully unlocks all premium features (AI, PDF Reports, Ad-Free) ignoring store status. Use for internal testing."
            })}
          />
          <ControlRow
            label="AD_NETWORK_KILL_SWITCH"
            value={adsEnabled}
            onToggle={toggleAds}
            icon="megaphone-outline"
            onHelp={() => setHackerAlert({
              title: "AD_KILL_HELP",
              message: "Globally disables all AdMob components. Useful to clean the UI during demos or for maintenance sessions."
            })}
          />
          <TouchableOpacity
            onPress={injectStressData}
            onLongPress={() => setHackerAlert({
              title: "STRESS_TEST_HELP",
              message: "Injects 50 random financial entries to verify database performance and UI scrolling stability."
            })}
            style={styles.actionBtn}
          >
            <Ionicons name="flask-outline" size={18} color={DARK} />
            <Text style={styles.actionBtnText}>EXECUTE_STRESS_TEST_50x</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: GLOBAL ANALYTICS */}
        <Text style={styles.sectionLabel}>// GLOBAL_PLATFORM_METRICS (LONG_PRESS_FOR_HELP)</Text>
        {loading ? (
          <ActivityIndicator color={LIME} style={{ marginVertical: 20 }} />
        ) : stats && (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <MetricBox label="USERS" val={stats.totalUsers} />
              <MetricBox label="PREMIUM" val={stats.premiumCount} />
              <MetricBox label="TX_TOTAL" val={stats.totalTransactions} />
            </View>

            {/* GEOGRAPHIC DISTRIBUTION */}
            <Text style={styles.sectionLabel}>// GEOGRAPHIC_PRESENCE — NODE_MAP</Text>
            <View style={[styles.hackerCard, { borderColor: LIME + "30", paddingHorizontal: 12 }]}>
              <WorldPresenceMap
                countries={stats.countries || {}}
                countryList={stats.countryList || []}
              />
            </View>

            {/* REVENUE HUB - HACKER GREEN */}
            <Text style={styles.sectionLabel}>// REVENUE_HUB (ESTIMATED_DATA)</Text>
            <View style={[styles.hackerCard, { borderColor: LIME + "40" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
                <View>
                  <Text style={[styles.hackerText, { opacity: 0.6, fontSize: 9 }]}>AD_REVENUE_ADSENSE</Text>
                  <Text style={[styles.metricVal, { color: LIME, fontSize: 24 }]}>$0.00</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.hackerText, { fontSize: 8 }]}>SYNC_STATUS</Text>
                  <Text style={[styles.hackerText, { fontSize: 10 }]}>[ PENDING_SYNC ]</Text>
                </View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: LIME + "10", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[styles.hackerText, { fontSize: 10 }]}>ELITE_SUBSCRIPTIONS</Text>
                <Text style={[styles.hackerText, { fontSize: 10 }]}>$0.00 USD</Text>
              </View>
            </View>
          </>
        )}

        {/* SECTION: BROADCAST_SIMULATOR */}
        <Text style={styles.sectionLabel}>// BROADCAST_COMMUNICATIONS (LIVE_TRANSMISSION)</Text>
        <TouchableOpacity
          onPress={() => {
            setPromptInput("");
            setHackerPrompt({
              title: "NEW_GLOBAL_BROADCAST",
              placeholder: "Enter mission briefing..."
            });
          }}
          onLongPress={() => setHackerAlert({
            title: "BROADCAST_PROTO_HELP",
            message: "Directly updates the 'global_notice' document in Firestore. All active apps will display this message instantly."
          })}
          style={styles.hackerCard}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="radio-outline" size={18} color={LIME} />
            <Text style={styles.hackerText}>INITIALIZE_GLOBAL_BROADCAST_SEQUENCE</Text>
          </View>
        </TouchableOpacity>

        {/* SECTION: RAW DATA EXPLORER */}
        <Text style={styles.sectionLabel}>// RAW_STATE_EXPLORER</Text>
        <TouchableOpacity
          onPress={() => setShowJson(!showJson)}
          onLongPress={() => setHackerAlert({
            title: "DATA_DUMP_HELP",
            message: "Displays the raw JSON of the local database. View internal variables, hidden flags, and all app state."
          })}
          style={[styles.hackerCard, { alignItems: "center", paddingVertical: 10 }]}
        >
          <Text style={styles.hackerText}>{showJson ? "[ CLOSE_DATA_DUMP ]" : "[ OPEN_STATE_DATA_DUMP ]"}</Text>
        </TouchableOpacity>

        {showJson && (
          <View style={styles.jsonContainer}>
            <Text style={styles.jsonText}>{JSON.stringify(appState, null, 2)}</Text>
          </View>
        )}

        <Text style={[styles.hackerText, { opacity: 0.3, marginTop: 40, textAlign: "center", fontSize: 10 }]}>
          CAUTION: UNAUTHORIZED ACCESS TO THIS TERMINAL MAY RESULT IN DATA LOSS.
        </Text>
      </ScrollView>

      {/* CUSTOM HACKER ALERT MODAL */}
      <Modal visible={!!hackerAlert} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.hackerModal}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={16} color={LIME} />
              <Text style={styles.modalTitle}>{hackerAlert?.title || "SYSTEM_MESSAGE"}</Text>
            </View>
            <Text style={styles.modalText}>{hackerAlert?.message}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              {hackerAlert?.onConfirm && (
                <TouchableOpacity onPress={() => setHackerAlert(null)} style={[styles.modalBtn, { borderColor: "#333" }]}>
                  <Text style={[styles.modalBtnText, { color: "#888" }]}>ABORT</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={hackerAlert?.onConfirm || (() => setHackerAlert(null))}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>{hackerAlert?.confirmLabel || "CLOSE"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM HACKER PROMPT MODAL */}
      <Modal visible={!!hackerPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.hackerModal}>
            <View style={styles.modalHeader}>
              <Ionicons name="radio-outline" size={16} color={LIME} />
              <Text style={styles.modalTitle}>{hackerPrompt?.title || "SYSTEM_PROMPT"}</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: LIME + "50", padding: 10, backgroundColor: "rgba(0,255,0,0.05)" }}>
              <TextInput
                value={promptInput}
                onChangeText={setPromptInput}
                placeholder={hackerPrompt?.placeholder}
                placeholderTextColor="rgba(0,255,0,0.3)"
                style={{ fontFamily: F.mono, color: LIME, fontSize: 13, minHeight: 60 }}
                multiline
                autoFocus
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setHackerPrompt(null)} style={[styles.modalBtn, { borderColor: "#333" }]}>
                <Text style={[styles.modalBtnText, { color: "#888" }]}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBroadcast}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>TRANSMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function ControlRow({ label, value, onToggle, icon, onHelp }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onHelp}
      style={styles.controlRow}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={icon} size={18} color={LIME} />
        <Text style={styles.hackerText}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#333", true: LIME }}
        thumbColor={DARK}
      />
    </TouchableOpacity>
  );
}

function MetricBox({ label, val }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIME + "40",
    backgroundColor: DARK
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "rgba(0,255,0,0.1)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: LIME
  },
  headerTitle: {
    fontFamily: F.monoB,
    fontSize: 16,
    color: LIME,
    letterSpacing: 1
  },
  headerSub: {
    fontFamily: F.mono,
    fontSize: 9,
    color: LIME,
    opacity: 0.7
  },
  sectionLabel: {
    fontFamily: F.monoB,
    fontSize: 10,
    color: LIME,
    marginTop: 20,
    marginBottom: 8,
    opacity: 0.8
  },
  hackerCard: {
    backgroundColor: "rgba(0,255,0,0.05)",
    borderWidth: 1,
    borderColor: LIME + "40",
    padding: 16,
    borderRadius: 4,
    marginBottom: 10
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10
  },
  hackerText: {
    fontFamily: F.mono,
    color: LIME,
    fontSize: 11
  },
  actionBtn: {
    backgroundColor: LIME,
    padding: 12,
    borderRadius: 2,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  actionBtnText: {
    fontFamily: F.monoB,
    color: DARK,
    fontSize: 11
  },
  metricBox: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "rgba(0,255,0,0.02)",
    borderWidth: 1,
    borderColor: LIME + "20",
    padding: 10,
    alignItems: "center"
  },
  metricLabel: {
    fontFamily: F.mono,
    color: LIME,
    fontSize: 8,
    opacity: 0.6
  },
  metricVal: {
    fontFamily: F.monoB,
    color: LIME,
    fontSize: 20
  },
  jsonContainer: {
    backgroundColor: "#050505",
    padding: 10,
    borderWidth: 1,
    borderColor: LIME + "30",
    marginTop: 5
  },
  jsonText: {
    fontFamily: F.mono,
    color: LIME,
    fontSize: 8,
    opacity: 0.8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  hackerModal: {
    width: "100%",
    backgroundColor: DARK,
    borderWidth: 2,
    borderColor: LIME,
    padding: 20,
    borderRadius: 2,
    shadowColor: LIME,
    shadowRadius: 10,
    shadowOpacity: 0.5
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: LIME + "30",
    paddingBottom: 10
  },
  modalTitle: {
    fontFamily: F.monoB,
    color: LIME,
    fontSize: 14,
    letterSpacing: 1
  },
  modalText: {
    fontFamily: F.mono,
    color: LIME,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.9
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIME,
    padding: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  modalBtnText: {
    fontFamily: F.monoB,
    color: LIME,
    fontSize: 12
  }
});
