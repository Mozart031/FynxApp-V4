import React, { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreCircle({ score: sc, pulseAnim }) {
  const color = sc >= 70 ? "#4CAF50" : sc >= 40 ? "#FFC107" : "#F44336";
  const size = 50;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: sc,
      tension: 40,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [sc]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0]
  });

  return (
    <Animated.View style={{ transform:[{ scale: sc < 40 && pulseAnim ? pulseAnim : new Animated.Value(1) }] }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
          {/* Fondo del anillo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color + "30"}
            strokeWidth={strokeWidth}
            fill={color + "10"}
          />
          {/* Progreso del anillo animado */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ fontSize:15, fontWeight:"900", color, letterSpacing:-0.5 }}>{sc}</Text>
      </View>
    </Animated.View>
  );
}
