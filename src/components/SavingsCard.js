import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C, F } from "../constants/themes";
import { CircleProgress } from "./CircleProgress";
import { money } from "../utils/formatters";

export function SavingsCard({ totalSaved, savingsPct, lang }) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.coreGroup}>
        <CircleProgress 
          percentage={savingsPct} 
          size={200} 
          strokeWidth={4} 
          color={C.gold} 
          label=""
          subLabel=""
        />
      </View>

      <View style={styles.balanceBlock}>
        <Text style={styles.balanceCurrency}>{lang === 'en' ? "TOTAL SAVED" : "TOTAL AHORRADO"}</Text>
        <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
          {money(totalSaved, "RD$")}
        </Text>
        <Text style={styles.statusLabel}>{lang === 'en' ? "SAVINGS" : "AHORROS"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    width: "100%",
    paddingTop: 16,
  },
  coreGroup: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceBlock: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    width: "100%",
  },
  balanceCurrency: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 3,
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: F.serif,
    fontSize: 42,
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 48,
  },
  statusLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.gold,
    letterSpacing: 2,
    marginTop: 8,
  }
});
