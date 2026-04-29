import React from "react";
import { View, Text, Animated } from "react-native";
import { C } from "../constants/themes";
import { money } from "../utils/formatters";

export function RunwayAlert({ runway, day, pulseAnim }) {
  if (!runway || runway >= 7) return null;
  return (
    <Animated.View style={{ transform:[{ scale: pulseAnim || 1 }],
      marginHorizontal:16, marginBottom:10, borderRadius:14,
      backgroundColor:"#F4433618", borderWidth:1.5, borderColor:"#F4433660",
      padding:12, flexDirection:"row", gap:10, alignItems:"center" }}>
      <Text style={{ fontSize:22, color:"#F44336", fontWeight:"900" }}>!</Text>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:12, fontWeight:"900", color:"#F44336", letterSpacing:0.5 }}>
          SUPERVIVENCIA: {runway} DÍAS
        </Text>
        <Text style={{ fontSize:11, color:C.t2, marginTop:2 }}>
          A este ritmo quedas en cero el día {day + runway} del mes.
        </Text>
      </View>
    </Animated.View>
  );
}
