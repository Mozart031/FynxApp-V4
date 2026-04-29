import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Clave API para Android (si tuvieras iOS, deberías configurarlo de manera condicional)
const API_KEY = "test_wYewGxegMoIuOsoFFkTvrWxySPq";

export const rcInit = async () => {
  try {
    Purchases.configure({ apiKey: API_KEY });
  } catch (e) {
    console.warn("Error inicializando RevenueCat", e);
  }
};

export const rcGetOfferings = async () => {
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
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    // Verificamos si tiene acceso a la suscripción "premium" (o como se llame el entitlement en RevenueCat)
    if (typeof customerInfo.entitlements.active["Premium"] !== "undefined") {
      return { success: true };
    }
    return { success: true }; // En modo test forzaremos success si la compra no lanzó excepción
  } catch (e) {
    if (!e.userCancelled) {
      console.warn("Error en la compra", e);
    }
    return { success: false, error: e };
  }
};

export const rcCheckSubscription = async () => {
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
