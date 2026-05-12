import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORE_KEY, FRENO_KEY, FRENO_HOURS } from "../constants";

import { encode as b64encode, decode as b64decode } from 'base-64';

// Clave ensamblada en runtime
const KEY_PARTS = ["MiFinanzas", "DR", "#2025"];
const getSecret = () => KEY_PARTS.join("");

function xorCipher(str) {
  const key = getSecret();
  let out = "";
  for (let i = 0; i < str.length; i++)
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

// Convertir string UTF-16 a bytes UTF-8 (para Base64 seguro)
function utf8_to_b64(str) {
  return b64encode(unescape(encodeURIComponent(str)));
}

// Convertir Base64 a string UTF-16
function b64_to_utf8(str) {
  return decodeURIComponent(escape(b64decode(str)));
}

export function encode(str) {
  try {
    // Primero XOR, luego Base64 seguro para UTF-8
    return utf8_to_b64(xorCipher(str));
  } catch(e) {
    console.warn("[Security] Encode failed:", e);
    return str; 
  }
}

export function decode(str) {
  try {
    // Primero Base64 decode con UTF-8, luego XOR
    return xorCipher(b64_to_utf8(str));
  } catch(e) {
    console.warn("[Security] Decode failed:", e);
    return str;
  }
}

export async function loadApp() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return null;
    try { return JSON.parse(decode(raw)); }
    catch {
      // Migración: texto plano -> cifrado automático
      const parsed = JSON.parse(raw);
      await saveApp(parsed);
      return parsed;
    }
  } catch { return null; }
}

export async function saveApp(state) {
  try {
    await AsyncStorage.setItem(STORE_KEY, encode(JSON.stringify(state)));
  } catch {}
}

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
  } catch { return { active: false, hoursLeft: 0 }; }
}

export async function activateFreno() {
  await AsyncStorage.setItem(FRENO_KEY, JSON.stringify({ activatedAt: Date.now() }));
}
export async function deactivateFreno() {
  await AsyncStorage.removeItem(FRENO_KEY);
}
