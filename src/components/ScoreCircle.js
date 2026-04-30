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
import { C } from "../constants/themes";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreCircle({ score: sc, pulseAnim }) {
  // Tema Titanio para Elite (>= 85)
  const isElite = sc >= 85;
  const baseColor = isElite ? C.gold : sc >= 40 ? "#00E5B0" : "#F44336";
  const size = 50;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progress = useSharedValue(0);
  const breath = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(sc, { duration: 1500 });
    if (isElite) {
      breath.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1800 }),
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
    return {
      strokeDashoffset: circumference - (progress.value / 100) * circumference,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: isElite ? breath.value - 0.7 : 0,
      transform: [{ scale: isElite ? breath.value : 1 }],
    };
  });

  return (
    <RNAnimated.View style={{ transform:[{ scale: sc < 40 && pulseAnim ? pulseAnim : 1 }] }}>
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
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 10,
          }, glowStyle]} />
        )}

        <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
          {isElite && (
            <Defs>
              <RadialGradient id="eliteGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={baseColor} stopOpacity="0.4" />
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
            fill={isElite ? "url(#eliteGrad)" : baseColor + "10"}
          />
          {/* Progreso del anillo animado (Reanimated) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={baseColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ 
          fontSize: 15, fontWeight: "900", 
          color: isElite ? "#FFF" : baseColor, 
          letterSpacing: -0.5,
          textShadowColor: isElite ? baseColor : "transparent",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isElite ? 10 : 0
        }}>
          {sc}
        </Text>
      </View>
    </RNAnimated.View>
  );
}
