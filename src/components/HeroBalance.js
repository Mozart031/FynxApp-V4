import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { C, F } from "../constants/themes";
import { money } from "../utils/formatters";
import { Bar } from "./base";

export function HeroBalance({ balance, totalInc, totalExp, savePct, runway, sem, cur, hidden, onPressIncome, pulseAnim }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: "hidden",
      borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
      
      {/* Subtle top gold glow */}
      <View style={{ position:"absolute", top:0, left:20, right:20, height:1, backgroundColor: C.goldGlow }} />

      <View style={{ padding: 24, paddingBottom: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 10, color: C.t3, letterSpacing: 4, fontWeight: "800", fontFamily: F.mono, marginBottom: 8 }}>
          BALANCE DISPONIBLE
        </Text>
        <Text style={{ fontSize: 38, fontWeight: "900", color: C.gold, letterSpacing: -1, fontFamily: F.monoB, marginBottom: 16 }}>
          {hidden(money(balance, cur))}
        </Text>
        
        <View style={{ width: "100%" }}>
          <Bar pct={Math.max(savePct, 0)} color={sem.level === "red" ? C.rose : C.gold} h={4} />
        </View>
      </View>
      
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border2, backgroundColor: C.card2 }}>
        <View style={{ flex: 1, paddingVertical: 16, alignItems: "center", borderRightWidth: 1, borderRightColor: C.border2 }}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: savePct >= 20 ? C.green : savePct >= 0 ? C.orange : C.rose, fontFamily: F.mono }}>
            {hidden(savePct + "%")}
          </Text>
          <Text style={{ fontSize: 9, color: C.t3, marginTop: 4, fontFamily: F.sansM, textTransform: "uppercase", letterSpacing: 1 }}>Tasa Ahorro</Text>
        </View>
        <View style={{ flex: 1, paddingVertical: 16, alignItems: "center", borderRightWidth: 1, borderRightColor: C.border2 }}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: !runway ? C.t3 : runway < 7 ? C.rose : runway < 15 ? C.orange : C.green, fontFamily: F.mono }}>
            {hidden(runway !== null ? runway + "d" : "—")}
          </Text>
          <Text style={{ fontSize: 9, color: C.t3, marginTop: 4, fontFamily: F.sansM, textTransform: "uppercase", letterSpacing: 1 }}>Runway</Text>
        </View>
        <TouchableOpacity onPress={onPressIncome} style={{ flex: 1, paddingVertical: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: C.gold, fontFamily: F.mono }}>
            {hidden(money(totalInc, cur))}
          </Text>
          <Text style={{ fontSize: 9, color: C.t3, marginTop: 4, fontFamily: F.sansM, textTransform: "uppercase", letterSpacing: 1 }}>Ingresos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
