/**
 * TARS — Biometría
 * Asegurar import estático para que el empaquetador lo enlace correctamente.
 */
import * as _LocalAuth from "expo-local-authentication";

export async function verificarDisponibilidad() {
  if (!_LocalAuth) return { disponible: false, tipo: "no_disponible" };
  try {
    const compatible = await _LocalAuth.hasHardwareAsync();
    if (!compatible) return { disponible: false, tipo: "ninguno" };
    const enrollado = await _LocalAuth.isEnrolledAsync();
    if (!enrollado) return { disponible: false, tipo: "sin_datos" };
    const tipos = await _LocalAuth.supportedAuthenticationTypesAsync();
    const tieneFacial = tipos.includes(_LocalAuth.AuthenticationType.FACIAL_RECOGNITION);
    const tieneHuella = tipos.includes(_LocalAuth.AuthenticationType.FINGERPRINT);
    return { disponible: true, tipo: tieneFacial ? "facial" : tieneHuella ? "huella" : "otro" };
  } catch {
    return { disponible: false, tipo: "error" };
  }
}

export async function autenticar(prompt = "Confirma tu identidad.") {
  if (!_LocalAuth) return { exito: false, error: "no_disponible" };
  try {
    const resultado = await _LocalAuth.authenticateAsync({
      promptMessage: prompt, cancelLabel: "Cancelar",
      disableDeviceFallback: false, fallbackLabel: "Usar PIN",
    });
    return resultado.success ? { exito: true } : { exito: false, error: resultado.error };
  } catch {
    return { exito: false, error: "error" };
  }
}

export function textoEstado(tipo) {
  const map = {
    facial:       "Desbloqueo con reconocimiento facial activado.",
    huella:       "Desbloqueo con huella digital activado.",
    sin_datos:    "Configura una huella o rostro en los ajustes del dispositivo.",
    no_disponible:"Función disponible tras compilar con EAS Build.",
  };
  return map[tipo] || "Biometría no disponible en este dispositivo.";
}
