import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { C } from "../constants/themes";
import { BlurView } from "expo-blur";
import { isAdMobReady } from "../services/admob";
import { useLanguage } from "../context/LanguageContext";

export function AdBanner({ esPremium, onUpgrade }) {
  const { lang } = useLanguage();
  if (esPremium) return null;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Verificar periódicamente si AdMob está listo
    if (isAdMobReady()) { setReady(true); return; }
    const timer = setInterval(() => {
      if (isAdMobReady()) { setReady(true); clearInterval(timer); }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!ready) return null; // No renderizar BannerAd hasta que AdMob esté inicializado

  // Importar dinámicamente para evitar crash si el módulo falla
  let BannerAd, BannerAdSize, TestIds;
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch(e) {
    console.warn("[Fynx] AdBanner: google-mobile-ads not available");
    return null;
  }

  const adUnitId = __DEV__ ? TestIds.BANNER : "ca-app-pub-4592841309124858/8043121096";

  return (
    <View style={{
      marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
      borderWidth: 1, borderColor: C.gold + "30",
      overflow: "hidden"
    }}>
      <BlurView intensity={20} tint="dark" style={{ backgroundColor: "rgba(10, 10, 10, 0.4)", paddingBottom: 10 }}>
      <View style={{
        paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ fontSize: 8, color: C.t3, letterSpacing: 1.5, fontWeight: "600" }}>
          {lang === 'en' ? "ADVERTISEMENT" : "PUBLICIDAD"}
        </Text>
        <TouchableOpacity onPress={onUpgrade}>
          <Text style={{ fontSize: 8, color: C.mint, letterSpacing: 1, fontWeight: "700" }}>
            {lang === 'en' ? "REMOVE" : "ELIMINAR"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", justifyContent: "center", minHeight: 50, width: "100%" }}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error) => {
            console.warn('Ad failed to load: ', error);
          }}
        />
      </View>
      </BlurView>
    </View>
  );
}
