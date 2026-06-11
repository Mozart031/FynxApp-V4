/**
 * useVoiceRecorder — Hook estable para expo-audio + expo-file-system v54+
 * Eliminado getInfoAsync (deprecated en v54). Lee directamente con readAsStringAsync.
 */
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBase64, setLastBase64] = useState(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert("Error", "Permiso de micrófono denegado.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      try {
        // En SDK 52, a veces ya está preparado o necesita prepararse de nuevo.
        await recorder.prepareToRecordAsync();
      } catch (prepareErr) {
        console.log("Ya estaba preparado o error al preparar:", prepareErr);
      }

      // Create new recording
      recorder.record();
      setIsRecording(true);
      setLastBase64(null);
    } catch (e) {
      console.warn("[VoiceRecorder] startRecording error:", e);
      Alert.alert("Error al Grabar", String(e.message || e));
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return null;

    setIsProcessing(true);
    setIsRecording(false);
    try {
      const uri = recorder.uri; // <--- AGARRAR ANTES DE STOP
      
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      if (!uri) {
        Alert.alert("Error", "No se encontró el archivo de audio (URI nulo).");
        return null;
      }

      // Pequeña espera para que Android termine de escribir el archivo
      await new Promise(resolve => setTimeout(resolve, 400));

      // 🚨 readAsStringAsync directo — sin getInfoAsync (deprecated en expo-file-system v54+)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}

      if (!base64 || base64.length < 50) return null;

      setLastBase64(base64);
      return base64;
    } catch (e) {
      console.warn("[VoiceRecorder] stopRecording error:", e);
      Alert.alert("Error al procesar audio", String(e.message || e));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [recorder, isRecording]);

  const cancelRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch (_) {}
    setIsRecording(false);
    setIsProcessing(false);
  }, [recorder, isRecording]);

  return { isRecording, isProcessing, lastBase64, startRecording, stopRecording, cancelRecording };
}
