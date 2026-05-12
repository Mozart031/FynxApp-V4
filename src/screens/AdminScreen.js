import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { getAdminStats } from "../services/firebase";
import { C, F } from "../constants/themes";

const GOLD = "#D4AF37";

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.t1} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{lang === 'en' ? "FYNX ELITE ANALYTICS" : "FYNX ELITE ANALÍTICAS"}</Text>
          <Text style={styles.headerSub}>
            {lang === 'en' ? "Global Platform Dashboard" : "Panel Global de la Plataforma"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: "center", justifyContent: "center", height: 300 }}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={{ marginTop: 16, color: C.t3, fontFamily: F.mono, fontSize: 10, letterSpacing: 2 }}>
              {lang === 'en' ? "FETCHING GLOBAL DATA..." : "OBTENIENDO DATOS GLOBALES..."}
            </Text>
          </View>
        ) : stats ? (
          <View style={{ gap: 16 }}>
            {/* ROW 1: USERS */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MetricCard
                title={lang === 'en' ? "TOTAL USERS" : "USUARIOS TOTALES"}
                value={stats.totalUsers}
                icon="people-outline"
                color={C.t1}
              />
              <MetricCard
                title={lang === 'en' ? "ACTIVE USERS" : "USUARIOS ACTIVOS"}
                value={stats.activeUsers}
                icon="pulse-outline"
                color={C.mint}
              />
            </View>

            {/* ROW 2: ENGAGEMENT & REVENUE */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MetricCard
                title={lang === 'en' ? "TRANSACTIONS" : "TRANSACCIONES"}
                value={stats.totalTransactions}
                icon="swap-vertical-outline"
                color="#38BDF8"
              />
              <MetricCard
                title={lang === 'en' ? "PREMIUM USERS" : "USUARIOS PREMIUM"}
                value={stats.premiumCount}
                icon="star-outline"
                color={GOLD}
                border
              />
            </View>

            {/* DEMOGRAPHICS (CURRENCIES) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="earth-outline" size={18} color={GOLD} />
                <Text style={styles.cardTitle}>{lang === 'en' ? "DEMOGRAPHICS (REGION)" : "DEMOGRAFÍA (REGIÓN)"}</Text>
              </View>
              {Object.entries(stats.currencies).length > 0 ? (
                Object.entries(stats.currencies).map(([currency, count], index) => {
                  let region = currency;
                  if (currency === "RD$") region = lang === 'en' ? "Dominican Republic" : "República Dominicana";
                  if (currency === "$" || currency === "USD") region = lang === 'en' ? "USA / International" : "USA / Internacional";
                  if (currency === "€") region = lang === 'en' ? "Europe" : "Europa";
                  if (currency === "COP") region = "Colombia";
                  if (currency === "MXN") region = "México";

                  return (
                    <View key={currency} style={[styles.rowItem, index !== Object.entries(stats.currencies).length - 1 && styles.borderBottom]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyText}>{currency}</Text>
                        </View>
                        <Text style={styles.rowLabel}>{region}</Text>
                      </View>
                      <Text style={styles.rowValue}>{count} {lang === 'en' ? "users" : "usuarios"}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>{lang === 'en' ? "No region data." : "Sin datos de región."}</Text>
              )}
            </View>

            {/* BEHAVIOR (TOP CATEGORIES) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart-outline" size={18} color={C.rose} />
                <Text style={[styles.cardTitle, { color: C.rose }]}>{lang === 'en' ? "BEHAVIOR (TOP CATEGORIES)" : "COMPORTAMIENTO (TOP CATEGORÍAS)"}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.t3, marginBottom: 16 }}>
                {lang === 'en' ? "Most recorded expense categories across the platform." : "Categorías de gastos más registradas en toda la plataforma."}
              </Text>
              
              {stats.topCategories && stats.topCategories.length > 0 ? (
                stats.topCategories.map(([cat, count], index) => (
                  <View key={cat} style={[styles.rowItem, index !== stats.topCategories.length - 1 && styles.borderBottom]}>
                    <Text style={styles.rowLabel}>{cat}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.rowValue, { color: C.t2 }]}>{count}</Text>
                      <Text style={{ fontSize: 10, color: C.t4 }}>{lang === 'en' ? "entries" : "registros"}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{lang === 'en' ? "No transaction data." : "Sin datos de transacciones."}</Text>
              )}
            </View>

          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Ionicons name="warning-outline" size={40} color={C.rose} />
            <Text style={{ color: C.rose, marginTop: 12, fontWeight: "600" }}>
              {lang === 'en' ? "Failed to load analytics." : "Error al cargar las analíticas."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, icon, color, border }) {
  return (
    <View style={[styles.metricCard, border && { borderColor: GOLD + "40", borderWidth: 1 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: C.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border2
  },
  headerTitle: {
    fontFamily: F.monoB,
    fontSize: 16,
    color: GOLD,
    letterSpacing: 1
  },
  headerSub: {
    fontSize: 11,
    color: C.t3,
    marginTop: 2
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.card2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border
  },
  metricTitle: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.t3,
    letterSpacing: 1
  },
  metricValue: {
    fontFamily: F.sansB,
    fontSize: 28,
  },
  card: {
    backgroundColor: C.card2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16
  },
  cardTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    color: GOLD,
    letterSpacing: 2
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  currencyBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: C.border2,
    alignItems: "center",
    justifyContent: "center"
  },
  currencyText: {
    fontFamily: F.monoB,
    fontSize: 13,
    color: C.t2
  },
  rowLabel: {
    fontFamily: F.sansM,
    fontSize: 14,
    color: C.t1
  },
  rowValue: {
    fontFamily: F.sansB,
    fontSize: 14,
    color: C.t1
  },
  emptyText: {
    color: C.t4,
    fontSize: 12,
    fontStyle: "italic"
  }
});
