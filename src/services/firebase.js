/**
 * FYNX — Firebase Service v4
 * - Expo Go: stub seguro (sin crash)
 * - EAS Build: Firebase real con fynx-f09d8
 * - Errores específicos con mensajes del strings.js
 * - Crea users/{uid} al registrarse (fix crash Firestore)
 */

function isExpoGo() {
  try {
    const C = require("expo-constants").default;
    return C.executionEnvironment === "storeClient";
  } catch { return false; }
}

const EXPO_GO = false; // Forzamos Firebase real para habilitar Auth y Logout correctamente.

// ── Stub seguro para Expo Go ──────────────────────────────────────────────────
const stub = {
  registrarUsuario:    async () => { throw { code: "expo-go" }; },
  iniciarSesion:       async () => { throw { code: "expo-go" }; },
  cerrarSesion:        async () => {},
  recuperarContrasena: async () => { throw { code: "expo-go" }; },
  escucharSesion:      (cb) => { cb(null); return () => {}; },
  sincronizarDatos:    async () => {},
  descargarDatos:      async () => null,
};

// ── Firebase real ─────────────────────────────────────────────────────────────
let _svc = null;

function buildReal() {
  if (_svc) return _svc;
  const { initializeApp, getApps }               = require("firebase/app");
  const { getAuth, createUserWithEmailAndPassword,
          signInWithEmailAndPassword, signOut,
          sendPasswordResetEmail, onAuthStateChanged,
          initializeAuth, getReactNativePersistence } = require("firebase/auth");
  const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require("firebase/firestore");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBLglzupI41PY6W7VJ5c_-EQ_vbbVDBbf0",
        authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fynx-f09d8.firebaseapp.com",
        projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fynx-f09d8",
        storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fynx-f09d8.firebasestorage.app",
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "184364852664",
        appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:184364852664:android:3c67cf6da748f0e8291b4d",
      });

  let auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    auth = getAuth(app);
  }
  const db   = getFirestore(app);

  // Crea el documento del usuario en Firestore al registrarse (fix crash)
  async function _crearDocUsuario(uid, email) {
    try {
      await setDoc(doc(db, "usuarios", uid), {
        email,
        creadoEn:  serverTimestamp(),
        premium:   false,
        onboarded: false,
      }, { merge: true });
    } catch (e) {
      console.warn("[Fynx] No se pudo crear doc usuario:", e.code);
    }
  }

  _svc = {
    registrarUsuario: async (email, password) => {
      const c = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await _crearDocUsuario(c.user.uid, c.user.email);
      return { uid: c.user.uid, email: c.user.email };
    },
    iniciarSesion: async (email, password) => {
      const c = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { uid: c.user.uid, email: c.user.email };
    },
    cerrarSesion:        async () => signOut(auth),
    recuperarContrasena: async (e) => sendPasswordResetEmail(auth, e.trim()),
    escucharSesion: (cb) => onAuthStateChanged(auth,
      u => cb(u ? { uid: u.uid, email: u.email } : null)
    ),
    sincronizarDatos: async (uid, state) => {
      if (!uid) return;
      try {
        await setDoc(doc(db, "usuarios", uid),
          { ...state, _sync: Date.now() }, { merge: true });
      } catch { /* sin conexión — AsyncStorage actúa de caché */ }
    },
    descargarDatos: async (uid) => {
      if (!uid) return null;
      try {
        const s = await getDoc(doc(db, "usuarios", uid));
        return s.exists() ? s.data() : null;
      } catch { return null; }
    },
  };
  return _svc;
}

const svc = () => EXPO_GO ? stub : buildReal();

export const registrarUsuario    = (...a) => svc().registrarUsuario(...a);
export const iniciarSesion       = (...a) => svc().iniciarSesion(...a);
export const cerrarSesion        = ()     => svc().cerrarSesion();
export const recuperarContrasena = (...a) => svc().recuperarContrasena(...a);
export const escucharSesion      = (...a) => svc().escucharSesion(...a);
export const sincronizarDatos    = (...a) => svc().sincronizarDatos(...a);
export const descargarDatos      = (...a) => svc().descargarDatos(...a);
