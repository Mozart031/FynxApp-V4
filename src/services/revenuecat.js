import { Platform } from 'react-native';
import { CONFIG } from '../constants/config';

let Purchases = null;
let isConfigured = false;

import Constants from "expo-constants";

try {
  if (Constants.appOwnership !== "expo") {
    Purchases = require('react-native-purchases').default;
  }
} catch (e) {
  console.warn("[Fynx] react-native-purchases native module not found");
}

export const initRevenueCat = async () => {
  if (Platform.OS === 'android' && Purchases) {
    await Purchases.configure({ apiKey: CONFIG.REVENUECAT_API_KEY });
    isConfigured = true;
  }
};

export const getCustomerInfo = async () => {
  if (!Purchases || !isConfigured) return null;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (e) {
    console.error("Error fetching customer info", e);
    return null;
  }
};

export const isUserPremium = async () => {
  const info = await getCustomerInfo();
  if (!info || !info.entitlements) return false;
  return info.entitlements.active[CONFIG.ENTITLEMENT_ID] !== undefined;
};

export const getOfferings = async () => {
  if (!Purchases || !isConfigured) return [];
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current.availablePackages;
    }
  } catch (e) {
    console.error("Error fetching offerings", e);
  }
  return [];
};

export const purchasePackage = async (pack) => {
  if (!Purchases || !isConfigured) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    return customerInfo.entitlements.active[CONFIG.ENTITLEMENT_ID] !== undefined;
  } catch (e) {
    if (!e.userCancelled) {
      console.error("Purchase error", e);
    }
    return false;
  }
};
