/**
 * useVoiceRecorder — Hook estable para expo-av + expo-file-system v54+
 * Eliminado getInfoAsync (deprecated en v54). Lee directamente con readAsStringAsync.
 */
import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBase64, setLastBase64] = useState(null);
  const recordingRef = useRef(null);
  const savedUriRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      // ── Limpieza defensiva: si ya hay un recording colgado, descargarlo ──
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (_) {}
        recordingRef.current = null;
        savedUriRef.current = null;
        setIsRecording(false);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      savedUriRef.current = recording.getURI();
      recordingRef.current = recording;
      setIsRecording(true);
      setLastBase64(null);
    } catch (e) {
      console.warn("[VoiceRecorder] startRecording error:", e);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return null;

    recordingRef.current = null;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = savedUriRef.current;
      savedUriRef.current = null;

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
  }, []);

  const cancelRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    savedUriRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (_) {}
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  return { isRecording, isProcessing, lastBase64, startRecording, stopRecording, cancelRecording };
}
