import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORE_KEY, FRENO_KEY, FRENO_HOURS } from "../constants";

// ── Base64 puro usando la librería base-64 (compatible con Hermes/Android) ─────
// NO usar btoa/atob (no existen en Hermes)
// NO usar unescape/escape (obsoletas y no disponibles en modo estricto)
import { encode as _b64encode, decode as _b64decode } from 'base-64';

// ── XOR cipher ────────────────────────────────────────────────────────────────
const KEY_PARTS = ["MiFinanzas", "DR", "#2025"];
const getSecret = () => KEY_PARTS.join("");

function xorCipher(str) {
  const key = getSecret();
  const len = str.length;
  const keyLen = key.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % keyLen));
  }
  return out.join("");
}

// ── Encode/Decode seguros ──────────────────────────────────────────────────────
// Estrategia: JSON.stringify ya produce un string ASCII válido (escapa chars especiales).
// Por tanto: encode(str) espera recibir ya un JSON string → solo aplica XOR + base64.
export function encode(str) {
  try {
    return _b64encode(xorCipher(str));
  } catch (e) {
    console.warn("[Security] encode failed:", e?.message);
    return str;
  }
}

export function decode(str) {
  try {
    return xorCipher(_b64decode(str));
  } catch (e) {
    console.warn("[Security] decode failed:", e?.message);
    return str;
  }
}

// ── Persistencia principal ────────────────────────────────────────────────────
export async function loadApp() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return null;

    // Intentar con cifrado actual
    try {
      const decoded = decode(raw);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e1) {
      // Fallback: intentar leer como JSON plano (datos migrados o sin cifrar)
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // Guardar con el nuevo cifrado para la próxima vez
          await saveApp(parsed);
          return parsed;
        }
      } catch (e2) {
        console.warn("[Security] loadApp: all parse attempts failed");
      }
    }
    return null;
  } catch (e) {
    console.warn("[Security] loadApp error:", e?.message);
    return null;
  }
}

export async function saveApp(state) {
  try {
    if (!state || typeof state !== "object") return;
    const json = JSON.stringify(state);
    const encoded = encode(json);
    await AsyncStorage.setItem(STORE_KEY, encoded);
  } catch (e) {
    console.warn("[Security] saveApp error:", e?.message);
  }
}

// ── Freno 48h ─────────────────────────────────────────────────────────────────
export async function loadFreno() {
  try {
    const raw = await AsyncStorage.getItem(FRENO_KEY);
    if (!raw) return { active: false, hoursLeft: 0 };
    const data = JSON.parse(raw);
    const elapsed = (Date.now() - data.activatedAt) / 3600000;
    if (elapsed >= FRENO_HOURS) {
      await AsyncStorage.removeItem(FRENO_KEY);
      return { active: false, hoursLeft: 0 };
    }
    return { active: true, hoursLeft: Math.ceil(FRENO_HOURS - elapsed), activatedAt: data.activatedAt };
  } catch {
    return { active: false, hoursLeft: 0 };
  }
}

export async function activateFreno() {
  try {
    await AsyncStorage.setItem(FRENO_KEY, JSON.stringify({ activatedAt: Date.now() }));
  } catch {}
}

export async function deactivateFreno() {
  try {
    await AsyncStorage.removeItem(FRENO_KEY);
  } catch {}
}
