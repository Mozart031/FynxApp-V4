# Guía de instalación — Termux + Expo Go SDK 55

## Paso 1 — Requisitos en Termux

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts -y
pkg install git -y
node --version   # debe ser 18.x o 20.x
npm --version    # debe ser 9.x o 10.x
```

## Paso 2 — Copiar el proyecto

Copia la carpeta `mifinanzas/` a tu almacenamiento interno.
Si descargaste el zip, descomprímelo con:

```bash
cd /sdcard/Download
unzip mifinanzas_expo_go.zip
cp -r mifinanzas ~/
cd ~/mifinanzas
```

## Paso 3 — Instalación limpia

```bash
# Elimina restos de instalaciones anteriores
rm -rf node_modules
rm -f package-lock.json

# Instala dependencias
npm install --legacy-peer-deps
```

Si ves errores de EEXIST o EACCES:

```bash
npm cache clean --force
rm -rf node_modules
npm install --legacy-peer-deps
```

## Paso 4 — Iniciar Expo

```bash
npx expo start -c
```

El flag `-c` limpia la caché de Metro. Imprescindible en Termux.

## Paso 5 — Abrir en Expo Go

1. Abre Expo Go en tu Pixel
2. Escanea el QR que aparece en la terminal
3. Si QR no funciona, en la terminal presiona `a` (Android)

## Paso 6 — Primer inicio

Al abrir la app verás la pantalla de autenticación.
En la parte inferior hay un botón gris:

**"Continuar sin cuenta (prueba local)"**

Presiona ese botón para entrar sin Firebase. Funciona 100% offline.

---

## Solución de errores comunes en Termux

### Error: `Command not found: expo`
```bash
npx expo start -c
```
Usa siempre `npx expo` en lugar de `expo` directamente.

### Error: `ENOSPC` o sin espacio
```bash
termux-setup-storage
# Libera espacio en /sdcard o usa almacenamiento externo
```

### Error: `Cannot find module '...'`
```bash
rm -rf node_modules && npm install --legacy-peer-deps
```

### Error con `VirtualViewExperimentalNativeComponent`
Ya resuelto. El `app.json` incluye `"newArchEnabled": false`.

### Metro no recarga
En la terminal del servidor, presiona `r` para recargar manualmente.

---

## Dependencias opcionales (para funciones avanzadas)

Estas NO son necesarias para probar en Expo Go:

```bash
# Firebase (cuando tengas credenciales)
npx expo install firebase

# Biometría (requiere EAS Build — no funciona en Expo Go)
npx expo install expo-local-authentication
```
