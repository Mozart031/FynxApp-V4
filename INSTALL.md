# MiFinanzas — Guía de instalación de dependencias nuevas

## Dependencias requeridas para las nuevas funciones

### 1. Autenticación biométrica
```bash
npx expo install expo-local-authentication
```

### 2. Firebase (autenticación + sincronización en la nube)
```bash
npx expo install firebase
```
Luego abre `src/services/firebase.js` y reemplaza `FIREBASE_CONFIG` con tus credenciales:
1. Ve a https://console.firebase.google.com
2. Crea un proyecto nuevo
3. Ve a Autenticación → Habilitar "Correo electrónico/Contraseña"
4. Ve a Configuración del proyecto → Tus apps → SDK de Firebase (web)
5. Copia las credenciales al objeto `FIREBASE_CONFIG`

### 3. (Opcional) Firestore — para sincronización de datos en la nube
En la consola de Firebase:
1. Ve a Firestore Database → Crear base de datos
2. Selecciona modo producción
3. Elige la región más cercana (us-east1 es la más cercana a RD)

---

## Estructura de archivos nuevos

```
src/
├── constants/
│   └── texts.js              ← Todos los textos de la UI auditados RAE
├── services/
│   ├── firebase.js           ← Auth + sincronización Firebase
│   └── biometrics.js         ← Huella digital y reconocimiento facial
├── screens/
│   └── AuthScreen.js         ← Login / Registro / Recuperación
├── components/
│   ├── PremiumModal.js       ← Modal de suscripción Premium
│   ├── AdBanner.js           ← Banner no intrusivo (plan gratuito)
│   └── TypewriterText.js     ← Efecto letra a letra (25 ms/carácter)
```

---

## Flujo de la aplicación actualizado

```
Arranque
  └── LoadingScreen (splash animado)
       └── AuthScreen (Login / Registro / Biometría)
            └── OnboardingScreen (si es usuario nuevo)
                 └── AppNavigator (tabs principales)
```

---

## Monetización — próximos pasos

El modal Premium está preparado pero el botón "Suscribirse" aún no procesa pagos reales.
Para activarlo, integra una de estas opciones:

- **RevenueCat** (recomendado para Expo): https://www.revenuecat.com
- **Stripe** (pagos web/móvil)
- **Compras in-app de Google Play / App Store** (nativas)

Cuando el pago sea exitoso, llama:
```js
updateState({ user: { ...appState.user, premium: true } });
```
Esto desactiva los banners y desbloquea las funciones premium en toda la app.

---

## Nota sobre el Auth en modo desarrollo

Si aún no has configurado Firebase, la `AuthScreen` mostrará un error al intentar iniciar sesión.
Para saltarla temporalmente durante el desarrollo, puedes comentar el bloque `if (!autenticado)` en `App.js`.
