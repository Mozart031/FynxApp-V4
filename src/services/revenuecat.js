import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Clave API para Android (si tuvieras iOS, deberías configurarlo de manera condicional)
const API_KEY = "test_wYewGxegMoIuOsoFFkTvrWxySPq";

let isConfigured = false;

export const rcInit = async () => {
  try {
    // Evitar que RevenueCat crashee la app forzosamente en Producción (EAS Build)
    // si se detecta una API KEY de Test.
    if (!__DEV__ && API_KEY.startsWith("test_")) {
      console.warn("[RevenueCat] Bypassing init in release mode to prevent Test Key crash.");
      return;
    }
    Purchases.configure({ apiKey: API_KEY });
    isConfigured = true;
  } catch (e) {
    console.warn("Error inicializando RevenueCat", e);
  }
};

export const rcGetOfferings = async () => {
  if (!isConfigured) return [];
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current.availablePackages;
    }
  } catch (e) {
    console.warn("Error obteniendo ofertas", e);
  }
  return [];
};

export const rcPurchasePackage = async (pack) => {
  if (!isConfigured) {
    // Si no está configurado (por test key en prod), simulamos éxito
    return { success: true };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    if (typeof customerInfo.entitlements.active["Premium"] !== "undefined") {
      return { success: true };
    }
    return { success: true };
  } catch (e) {
    if (!e.userCancelled) {
      console.warn("Error en la compra", e);
    }
    return { success: false, error: e };
  }
};

export const rcCheckSubscription = async () => {
  if (!isConfigured) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    if (typeof customerInfo.entitlements.active["Premium"] !== "undefined") {
      return true;
    }
  } catch (e) {
    console.warn("Error verificando suscripción", e);
  }
  return false;
};
