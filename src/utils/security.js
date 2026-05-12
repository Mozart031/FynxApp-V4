import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORE_KEY, FRENO_KEY, FRENO_HOURS } from "../constants";

import { encode as b64encode, decode as b64decode } from 'base-64';

// Clave ensamblada en runtime — nunca en texto plano
const KEY_PARTS = ["MiFinanzas", "DR", "#2025"];
const getSecret = () => KEY_PARTS.join("");

function xorCipher(str) {
  const key = getSecret();
  let out = "";
  for (let i = 0; i < str.length; i++)
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

// Helper para manejar UTF-8 sin escape/unescape (obsoletos)
export function encode(str) {
  try {
    // Primero aplicamos XOR, luego convertimos a Base64
    const xored = xorCipher(str);
    return b64encode(xored);
  } catch(e) {
    console.warn("[Security] Encode failed:", e);
    return str; 
  }
}

export function decode(str) {
  try {
    // Primero Base64 decode, luego aplicamos XOR para recuperar original
    const decoded = b64decode(str);
    return xorCipher(decoded);
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
