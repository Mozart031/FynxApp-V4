/**
 * FYNX — Firebase Service v4.1
 * - Expo Go: Firebase JS puro funciona (email/pass auth OK)
 * - GoogleSignin se carga LAZY solo cuando el usuario lo necesita (no crashea Expo Go)
 * - EAS Build: Firebase real con fynx-f09d8
 */

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

  const { initializeApp, getApps } = require("firebase/app");
  const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    initializeAuth,
    getReactNativePersistence,
    GoogleAuthProvider,
    signInWithCredential,
  } = require("firebase/auth");
  const { getFirestore, doc, setDoc, getDoc, collection, getDocs, serverTimestamp } = require("firebase/firestore");
  // ⚠️ GoogleSignin NO se importa aquí — se carga lazy en iniciarSesionGoogle
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
  const db = getFirestore(app);

  // [FIX v4.1] NO sobreescribir onboarded/premium/setupCompleted en usuarios existentes
  async function _crearDocUsuario(uid, email) {
    try {
      const existing = await getDoc(doc(db, "usuarios", uid));
      if (existing.exists()) {
        // Usuario existente: solo actualizar email y último login
        await setDoc(doc(db, "usuarios", uid), {
          email,
          ultimoLogin: serverTimestamp(),
        }, { merge: true });
      } else {
        // Usuario nuevo: crear doc base completo
        await setDoc(doc(db, "usuarios", uid), {
          email,
          creadoEn:       serverTimestamp(),
          ultimoLogin:    serverTimestamp(),
          premium:        false,
          onboarded:      false,
          setupCompleted: false,
          customCategories: ["Comida", "Transporte", "Vivienda", "Salud", "Servicios", "Entretenimiento", "Ropa", "Deudas", "Otros"],
        });
      }
    } catch (e) {
      console.warn("[Fynx] No se pudo crear/actualizar doc usuario:", e.code);
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
    iniciarSesionGoogle: async () => {
      // Carga LAZY — solo cuando el usuario toca "Continuar con Google"
      // Esto evita crashear Expo Go donde el módulo nativo no existe
      let GoogleSignin;
      try {
        ({ GoogleSignin } = require("@react-native-google-signin/google-signin"));
      } catch (e) {
        throw new Error("Google Sign-In no está disponible en Expo Go. Usa el build de producción.");
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch (e) {} // Forzar selección de cuenta
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (!idToken) throw new Error("No ID token found from Google Sign-In");
      const credential = GoogleAuthProvider.credential(idToken);
      const c = await signInWithCredential(auth, credential);
      await _crearDocUsuario(c.user.uid, c.user.email);
      return { uid: c.user.uid, email: c.user.email };
    },
    cerrarSesion:        async () => signOut(auth),
    recuperarContrasena: async (e) => sendPasswordResetEmail(auth, e.trim()),
    escucharSesion: (cb) => onAuthStateChanged(auth,
      u => cb(u ? { uid: u.uid, email: u.email } : null)
    ),
    sincronizarDatos: async (uid, state) => {
      if (!uid) { console.warn("[Fynx] sincronizarDatos: uid is empty, skipping."); return; }
      try {
        // Verificar que el usuario esté autenticado en Firebase
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn("[Fynx] sincronizarDatos: No hay usuario autenticado en Firebase, no se puede escribir.");
          return;
        }
        if (currentUser.uid !== uid) {
          console.warn(`[Fynx] sincronizarDatos: UID mismatch — auth=${currentUser.uid} vs expected=${uid}`);
          return;
        }

        // Limpiar el estado: eliminar undefined, funciones y objetos Timestamp de Firestore
        function cleanForFirestore(obj) {
          if (obj === null || obj === undefined) return null;
          if (typeof obj !== "object") return obj;
          if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(v => v !== undefined);
          // Detectar Timestamp de Firestore (tiene seconds y nanoseconds)
          if (typeof obj.seconds === "number" && typeof obj.nanoseconds === "number") {
            return obj.seconds * 1000; // convertir a ms timestamp normal
          }
          const out = {};
          for (const [k, v] of Object.entries(obj)) {
            if (v === undefined || typeof v === "function") continue;
            out[k] = cleanForFirestore(v);
          }
          return out;
        }

        const cleanState = cleanForFirestore(state);
        await setDoc(doc(db, "usuarios", uid),
          { ...cleanState, _sync: Date.now() }, { merge: true });
        console.log("[Fynx] ✅ Datos sincronizados correctamente para uid:", uid);
      } catch (e) {
        console.error("[Fynx] ❌ ERROR al sincronizar en la nube:", e.code, e.message);
        // Re-lanzar para que el caller pueda manejar si lo desea
        throw e;
      }
    },
    descargarDatos: async (uid) => {
      if (!uid) return null;
      try {
        const s = await getDoc(doc(db, "usuarios", uid));
        return s.exists() ? s.data() : null;
      } catch { return null; }
    },
    getAdminStats: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        let totalUsers = 0;
        let currencies = {};
        let premiumCount = 0;
        querySnapshot.forEach((docSnap) => {
          totalUsers++;
          const data = docSnap.data();
          if (data.premium || data.user?.premium) premiumCount++;
          const cur = data.user?.currency || data.currency;
          if (cur) currencies[cur] = (currencies[cur] || 0) + 1;
        });
        return { totalUsers, premiumCount, currencies };
      } catch (e) {
        console.warn("Error fetching admin stats:", e);
        return null;
      }
    }
  };
  return _svc;
}

const svc = () => EXPO_GO ? stub : buildReal();

export const registrarUsuario    = (...a) => svc().registrarUsuario(...a);
export const iniciarSesion       = (...a) => svc().iniciarSesion(...a);
export const iniciarSesionGoogle = (...a) => svc().iniciarSesionGoogle(...a);
export const cerrarSesion        = ()     => svc().cerrarSesion();
export const recuperarContrasena = (...a) => svc().recuperarContrasena(...a);
export const escucharSesion      = (...a) => svc().escucharSesion(...a);
export const sincronizarDatos    = (...a) => svc().sincronizarDatos(...a);
export const descargarDatos      = (...a) => svc().descargarDatos(...a);
export const getAdminStats       = ()     => svc().getAdminStats();
