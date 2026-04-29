import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { C } from "../constants/themes";

const adUnitId = __DEV__ ? TestIds.BANNER : TestIds.BANNER; // TODO: Reemplazar por Ad Unit ID real en producción

export function AdBanner({ esPremium, onUpgrade }) {
  if (esPremium) return null;

  return (
    <View style={{
      marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
      backgroundColor: C.card2, borderWidth: 1, borderColor: C.border,
      overflow: "hidden", paddingBottom: 10
    }}>
      <View style={{
        paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ fontSize: 8, color: C.t3, letterSpacing: 1.5, fontWeight: "600" }}>
          PUBLICIDAD
        </Text>
        <TouchableOpacity onPress={onUpgrade}>
          <Text style={{ fontSize: 8, color: C.mint, letterSpacing: 1, fontWeight: "700" }}>
            ELIMINAR
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
            console.error('Ad failed to load: ', error);
          }}
        />
      </View>
    </View>
  );
}
