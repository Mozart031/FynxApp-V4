import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { C, F } from "../constants/themes";
import { useLanguage } from "../context/LanguageContext";

export function SocialLeaderboard({ userScore = 0 }) {
  const { lang } = useLanguage();
  
  // Memos to avoid re-generating random numbers
  const data = React.useMemo(() => {
    return [
      { id: "1", name: "Fynx_Elite_9X", score: Math.min(100, userScore + 12), isUser: false },
      { id: "2", name: "User_8421", score: Math.min(100, userScore + 5), isUser: false },
      { id: "3", name: lang === 'en' ? "You" : "Tú", score: userScore, isUser: true },
      { id: "4", name: "User_1092", score: Math.max(0, userScore - 8), isUser: false },
      { id: "5", name: "Anon_4491", score: Math.max(0, userScore - 15), isUser: false },
    ].sort((a, b) => b.score - a.score);
  }, [userScore, lang]);

  return (
    <View style={{ marginTop: 24, width: "100%", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
      <Text style={{ fontSize: 10, fontWeight: "800", color: C.t4, letterSpacing: 2, marginBottom: 16, textAlign: "center", textTransform: "uppercase" }}>
        {lang === 'en' ? "Live Global Ranking" : "Ranking Global en Vivo"}
      </Text>
      
      {data.map((item, index) => {
        return <LeaderboardRow key={item.id} item={item} index={index} />;
      })}
    </View>
  );
}

function LeaderboardRow({ item, index }) {
  const { isUser, score, name } = item;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 800 + index * 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [index]);

  const widthPct = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", `${Math.max(5, (score / 100) * 100)}%`]
  });

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "900", color: isUser ? C.gold : C.t4, width: 16 }}>
            {index + 1}.
          </Text>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: isUser ? "900" : "600", 
            color: isUser ? C.gold : C.t2,
            fontFamily: isUser ? F.monoB : F.sans
          }}>
            {name}
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: "900", color: isUser ? C.gold : "#4AFFE7", fontFamily: F.monoB }}>
          {Math.round(score)} pts
        </Text>
      </View>
      <View style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
        <Animated.View style={{ 
          width: widthPct, 
          height: "100%", 
          backgroundColor: isUser ? C.gold : "#4AFFE7", 
          opacity: isUser ? 1 : 0.5,
          borderRadius: 3,
          shadowColor: isUser ? C.gold : "#4AFFE7",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: isUser ? 4 : 0
        }} />
      </View>
    </View>
  );
}
