/**
 * useVoiceRecorder — Hook para grabar audio con expo-av
 * Devuelve el audio en Base64 listo para enviar a Gemini multimodal.
 */
import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      // Solicitar permiso de micrófono
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error("Permiso de micrófono denegado");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      console.warn("[VoiceRecorder] Error al iniciar grabación:", e);
      throw e;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return null;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No se obtuvo URI de la grabación");

      // Leer el archivo como Base64 para enviarlo a Gemini
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Limpiar el archivo temporal
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}

      return base64;
    } catch (e) {
      console.warn("[VoiceRecorder] Error al detener grabación:", e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
    } catch {}
    recordingRef.current = null;
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  return { isRecording, isProcessing, startRecording, stopRecording, cancelRecording };
}
