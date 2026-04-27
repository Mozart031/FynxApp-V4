import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { C } from "../constants/themes";
import { money } from "../utils/formatters";
import { Bar } from "./base";

export function HeroBalance({ balance, totalInc, totalExp, savePct, runway, sem, cur, hidden, onPressIncome, pulseAnim }) {
  const isRed = sem.level === "red";

  return (
    <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:24, overflow:"hidden",
      borderWidth:1.5, borderColor:sem.color+"55",
      shadowColor:sem.color, shadowOffset:{width:0,height:5}, shadowOpacity:0.2, shadowRadius:20 }}>
      <View style={{ backgroundColor:sem.dark, padding:20, paddingBottom:14 }}>
        <View style={{ flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
          <Text style={{ fontSize:9, color:sem.color, letterSpacing:3, fontWeight:"700" }}>BALANCE DISPONIBLE</Text>
          <Animated.View style={{ transform:[{ scale: isRed && pulseAnim ? pulseAnim : new Animated.Value(1) }] }}>
            <View style={{ backgroundColor:sem.color+"28", borderRadius:9, borderWidth:1,
              borderColor:sem.color+"55", paddingHorizontal:9, paddingVertical:3 }}>
              <Text style={{ fontSize:10, fontWeight:"800", color:sem.color }}>{sem.label}</Text>
            </View>
          </Animated.View>
        </View>
        <Text style={{ fontSize:44, fontWeight:"900", color:sem.color, letterSpacing:-2, lineHeight:50, marginBottom:12 }}>
          {hidden(money(balance, cur))}
        </Text>
        <Bar pct={Math.max(savePct, 0)} color={sem.color} h={5} />
      </View>
      <View style={{ backgroundColor:sem.color+"0E", flexDirection:"row",
        borderTopWidth:1, borderTopColor:sem.color+"22" }}>
        <View style={{ flex:1, paddingVertical:12, alignItems:"center",
          borderRightWidth:1, borderRightColor:sem.color+"18" }}>
          <Text style={{ fontSize:15, fontWeight:"900",
            color: savePct >= 20 ? "#4CAF50" : savePct >= 0 ? "#FFC107" : "#F44336" }}>
            {hidden(savePct + "%")}
          </Text>
          <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>Tasa Ahorro</Text>
        </View>
        {/* Runway — parpadea si < 7 días */}
        <Animated.View style={{ flex:1,
          transform:[{ scale: runway !== null && runway < 7 && pulseAnim ? pulseAnim : new Animated.Value(1) }],
          borderRightWidth:1, borderRightColor:sem.color+"18" }}>
          <View style={{ flex:1, paddingVertical:12, alignItems:"center",
            borderWidth: runway !== null && runway < 7 ? 1.5 : 0,
            borderColor: "#F44336", borderRadius:6,
            backgroundColor: runway !== null && runway < 7 ? "#F4433610" : "transparent" }}>
            <Text style={{ fontSize:15, fontWeight:"900",
              color: !runway ? C.t3 : runway < 7 ? "#F44336" : runway < 15 ? "#FFC107" : "#4CAF50" }}>
              {hidden(runway !== null ? runway + "d" : "—")}
            </Text>
            <Text style={{ fontSize:9, marginTop:2, fontWeight: runway !== null && runway < 7 ? "700" : "400",
              color: runway !== null && runway < 7 ? "#F44336" : C.t3 }}>
              {runway !== null && runway < 7 ? "URGENTE" : "Runway"}
            </Text>
          </View>
        </Animated.View>
        <TouchableOpacity onPress={onPressIncome}
          style={{ flex:1, paddingVertical:12, alignItems:"center" }}>
          <Text style={{ fontSize:15, fontWeight:"900", color:C.mint }}>
            {hidden(money(totalInc, cur))}
          </Text>
          <Text style={{ fontSize:9, color:C.t3, marginTop:2 }}>Ingresos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
