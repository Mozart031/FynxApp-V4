/**
 * useVoiceRecorder — Hook estable para expo-audio + expo-file-system v54+
 * Eliminado getInfoAsync (deprecated en v54). Lee directamente con readAsStringAsync.
 */
import { useState, useCallback } from "react";
import { useAudioRecorder, AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

export function useVoiceRecorder() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBase64, setLastBase64] = useState(null);
  const recorder = useAudioRecorder();

  const startRecording = useCallback(async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') return;

      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      // Create new recording
      await recorder.record();
      setLastBase64(null);
    } catch (e) {
      console.warn("[VoiceRecorder] startRecording error:", e);
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!recorder.isRecording) return null;

    setIsProcessing(true);
    try {
      await recorder.stop();
      await AudioModule.setAudioModeAsync({ allowsRecording: false });

      const uri = recorder.uri;
      if (!uri) return null;

      // Pequeña espera para que Android termine de escribir el archivo
      await new Promise(resolve => setTimeout(resolve, 400));

      // ✅ readAsStringAsync directo — sin getInfoAsync (deprecated en expo-file-system v54+)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}

      if (!base64 || base64.length < 50) return null;

      setLastBase64(base64);
      return base64;
    } catch (e) {
      console.warn("[VoiceRecorder] stopRecording error:", e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    if (!recorder.isRecording) return;
    try {
      await recorder.stop();
      await AudioModule.setAudioModeAsync({ allowsRecording: false });
    } catch (_) {}
    setIsProcessing(false);
  }, [recorder]);

  return { isRecording: recorder.isRecording, isProcessing, lastBase64, startRecording, stopRecording, cancelRecording };
}
