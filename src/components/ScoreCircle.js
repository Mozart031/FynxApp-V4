import React, { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";

export function ScoreCircle({ score: sc, pulseAnim }) {
  const color = sc >= 70 ? "#4CAF50" : sc >= 40 ? "#FFC107" : "#F44336";
  return (
    <Animated.View style={{ transform:[{ scale: sc < 40 && pulseAnim ? pulseAnim : new Animated.Value(1) }] }}>
      <View style={{ width:50, height:50, borderRadius:25, borderWidth:3.5,
        borderColor:color, backgroundColor:color+"18", alignItems:"center", justifyContent:"center" }}>
        <Text style={{ fontSize:15, fontWeight:"900", color, letterSpacing:-0.5 }}>{sc}</Text>
      </View>
    </Animated.View>
  );
}
