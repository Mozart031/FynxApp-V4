import React, { useEffect } from "react";
import { View, Text, Animated as RNAnimated } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  withRepeat,
  withSequence,
  useAnimatedStyle
} from "react-native-reanimated";
import { C, F } from "../constants/themes";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreCircle({ score: sc, pulseAnim }) {
  const safeSc = isNaN(sc) || sc == null ? 0 : sc;
  // Tema Titanio para Elite (>= 85)
  const isElite = safeSc >= 85;
  const baseColor = isElite ? C.violet : safeSc >= 40 ? C.gold : C.rose;
  const size = 50;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Hacemos que sea un arco de 270 grados (75% del círculo)
  const arcLength = circumference * 0.75;
  const gapLength = circumference * 0.25;

  const progress = useSharedValue(0);
  const breath = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(safeSc, { duration: 1500 });
    if (isElite) {
      breath.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1800 }),
          withTiming(1, { duration: 1800 })
        ),
        -1,
        true
      );
    } else {
      breath.value = 1;
    }
  }, [sc, isElite]);

  const animatedProps = useAnimatedProps(() => {
    // El progreso va del 0 al 100, pero el arco es solo 0 a arcLength
    const p = Math.min(Math.max(progress.value, 0), 100) / 100;
    return {
      strokeDashoffset: arcLength - (p * arcLength),
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: isElite ? breath.value - 0.7 : 0,
      transform: [{ scale: isElite ? breath.value : 1 }],
    };
  });

  return (
    <RNAnimated.View style={{ transform:[{ scale: safeSc < 40 && pulseAnim ? pulseAnim : 1 }] }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        
        {/* Respiración OLED Titanio (Glow) */}
        {isElite && (
          <Animated.View style={[{
            position: "absolute",
            width: size, height: size,
            borderRadius: size / 2,
            backgroundColor: baseColor,
            shadowColor: baseColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 5,
          }, glowStyle]} />
        )}

        <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "135deg" }] }}>
          {isElite && (
            <Defs>
              <RadialGradient id="eliteGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={baseColor} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={baseColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>
          )}
          {/* Fondo del anillo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={baseColor + "20"}
            strokeWidth={strokeWidth}
            fill={isElite ? "url(#eliteGrad)" : "transparent"}
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeLinecap="round"
          />
          {/* Progreso del anillo animado */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={baseColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${arcLength} ${gapLength}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ 
          fontSize: 16, 
          color: C.t1, 
          fontFamily: F.monoB,
          marginTop: 2
        }}>
          {safeSc}
        </Text>
      </View>
    </RNAnimated.View>
  );
}
