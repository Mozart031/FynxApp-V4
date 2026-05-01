import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { getAdminStats } from "../services/firebase";
import { C } from "../constants/themes";

export function AdminScreen({ navigation }) {
  const { lang } = useLanguage();
  const { appState } = useFinance();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seguridad extra
    if (appState?.user?.email !== "ericksonp032102@gmail.com") {
      navigation.goBack();
      return;
    }

    const fetchStats = async () => {
      const data = await getAdminStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, [appState]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8, backgroundColor: C.card2, borderRadius: 10 }}>
          <Ionicons name="arrow-back" size={20} color={C.t1} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "800", color: C.t1 }}>
          {lang === 'en' ? "Admin Dashboard" : "Panel de Administrador"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 14, color: C.t3, marginBottom: 20 }}>
          {lang === 'en' ? "Overview of Fynx Elite usage." : "Resumen de uso de Fynx Elite."}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 50 }} />
        ) : stats ? (
          <View>
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: C.card2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 12, color: C.t3, fontWeight: "700", marginBottom: 8 }}>
                  {lang === 'en' ? "TOTAL USERS" : "USUARIOS TOTALES"}
                </Text>
                <Text style={{ fontSize: 32, fontWeight: "900", color: C.mint }}>{stats.totalUsers}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.card2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 12, color: C.t3, fontWeight: "700", marginBottom: 8 }}>
                  {lang === 'en' ? "PREMIUM USERS" : "USUARIOS PREMIUM"}
                </Text>
                <Text style={{ fontSize: 32, fontWeight: "900", color: C.gold }}>{stats.premiumCount}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: C.card2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.t1, marginBottom: 16 }}>
                {lang === 'en' ? "Usage by Currency / Region" : "Uso por Moneda / Región"}
              </Text>
              
              {Object.entries(stats.currencies).length > 0 ? (
                Object.entries(stats.currencies).map(([currency, count]) => (
                  <View key={currency} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: C.t2 }}>{currency}</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: C.t2, fontWeight: "600" }}>
                        {currency === "RD$" ? "República Dominicana" : currency === "$" ? "USD / Internacional" : currency === "€" ? "Europa" : currency}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: C.mint }}>{count}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: C.t3, fontSize: 12 }}>{lang === 'en' ? "No data available." : "Sin datos disponibles."}</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={{ color: C.rose, textAlign: "center", marginTop: 20 }}>
            {lang === 'en' ? "Failed to load stats." : "Error al cargar las estadísticas."}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
