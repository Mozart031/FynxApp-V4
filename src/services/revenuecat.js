import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { CONFIG } from '../constants/config';

export const initRevenueCat = async () => {
  if (Platform.OS === 'android') {
    await Purchases.configure({ apiKey: CONFIG.REVENUECAT_API_KEY });
  }
};

export const getCustomerInfo = async () => {
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
  if (!info) return false;
  return info.entitlements.active[CONFIG.ENTITLEMENT_ID] !== undefined;
};

export const getOfferings = async () => {
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
