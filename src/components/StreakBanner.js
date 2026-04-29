import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { calcStreak, streakMessage, lastNDays } from "../utils/finance";

export function StreakBanner({ streakDays = [] }) {
  const today    = new Date().toISOString().split("T")[0];
  const streak   = calcStreak(streakDays);
  const regToday = streakDays.includes(today);
  const { msg, sub, color } = streakMessage(streak, regToday);
  const last7    = lastNDays(7);

  return (
    <View style={{ marginHorizontal:16, marginBottom:14, borderRadius:20, borderWidth:1,
      borderColor: color+"45", backgroundColor: color+"0C" }}>
      <View style={{ flexDirection:"row", alignItems:"center", padding:14, paddingBottom:10, gap:12 }}>
        <View style={{ width:44, height:44, borderRadius:14, backgroundColor:color+"22",
          borderWidth:1.5, borderColor:color+"40", alignItems:"center", justifyContent:"center" }}>
          <Ionicons name={ICON.fire} size={22} color={color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontSize:14, fontWeight:"900", color, letterSpacing:-0.2 }}>{msg}</Text>
          <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>{sub}</Text>
        </View>
        <View style={{ alignItems:"center" }}>
          <Text style={{ fontSize:26, fontWeight:"900", color, letterSpacing:-1 }}>{streak}</Text>
          <Text style={{ fontSize:8, color:C.t3, letterSpacing:1.5, fontWeight:"700" }}>DÍAS</Text>
        </View>
      </View>
      <View style={{ height:1, backgroundColor:color+"20", marginHorizontal:14 }} />
      <View style={{ flexDirection:"row", justifyContent:"space-between", paddingHorizontal:14, paddingVertical:10 }}>
        {last7.map(day => {
          const done    = streakDays.includes(day);
          const isToday = day === today;
          const num     = new Date(day + "T12:00:00").getDate();
          const lbl     = new Date(day + "T12:00:00").toLocaleDateString("es", { weekday:"narrow" }).toUpperCase();
          return (
            <View key={day} style={{ alignItems:"center", gap:4 }}>
              <Text style={{ fontSize:8, color: isToday ? color : C.t3, fontWeight: isToday ? "800" : "400" }}>{lbl}</Text>
              <View style={{ width:30, height:30, borderRadius:9,
                backgroundColor: done ? color : isToday ? color+"18" : C.card2,
                borderWidth: isToday && !done ? 1.5 : 1, borderColor: isToday ? color+"60" : C.border,
                alignItems:"center", justifyContent:"center" }}>
                {done
                  ? <Ionicons name={ICON.check} size={14} color="#000" />
                  : <Text style={{ fontSize:11, fontWeight:"700", color: isToday ? color : C.t4 }}>{num}</Text>}
              </View>
              {isToday && <View style={{ width:4, height:4, borderRadius:2, backgroundColor:color }} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}
