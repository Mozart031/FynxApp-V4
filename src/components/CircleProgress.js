import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { C, F } from "../constants/themes";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircleProgress({ 
  percentage = 0, 
  size = 140, 
  strokeWidth = 3, 
  color = C.gold, 
  label = "AHORRADO", 
  subLabel = "",
  style
}) {
  const R = (size - strokeWidth) / 2;
  const CIRC = 2 * Math.PI * R;
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate to target percentage
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRC, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0" />
            <Stop offset="40%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background track (thin and subtle) */}
        <Circle
          cx={size / 2} cy={size / 2} r={R}
          stroke={color + "15"} strokeWidth={strokeWidth} fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={R}
          stroke={`url(#grad-${color})`} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: F.serif, fontSize: size * 0.24, color: color, letterSpacing: -1, lineHeight: size * 0.24, includeFontPadding: false, textAlignVertical: "center", marginTop: 4 }}>
          {percentage}%
        </Text>
        {!!label && (
          <Text style={{ fontFamily: F.mono, fontSize: size * 0.07, color: C.t3, textTransform: "uppercase", letterSpacing: 2, marginTop: 2 }}>
            {label}
          </Text>
        )}
        {!!subLabel && (
          <Text style={{ fontFamily: F.sans, fontSize: size * 0.1, fontWeight: "900", color: C.white, marginTop: 4 }}>
            {subLabel}
          </Text>
        )}
      </View>
    </View>
  );
}
