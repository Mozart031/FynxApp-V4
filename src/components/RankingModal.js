import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../constants/themes';
import { useLanguage } from '../context/LanguageContext';

export function RankingModal({ visible, onClose, userScore }) {
  const { lang } = useLanguage();
  
  const mockUsers = React.useMemo(() => {
    const safeScore = isNaN(userScore) || userScore == null ? 0 : userScore;
    // Generate a larger list
    const list = [
      { id: "1", name: "Fynx Elite 9X", score: Math.min(100, safeScore + 18), isUser: false },
      { id: "2", name: "User_8421", score: Math.min(100, safeScore + 12), isUser: false },
      { id: "3", name: "Alpha_Anon", score: Math.min(100, safeScore + 8), isUser: false },
      { id: "4", name: "Crypto_Wolf", score: Math.min(100, safeScore + 5), isUser: false },
      { id: "user", name: lang === 'en' ? "You" : "Tú", score: safeScore, isUser: true },
      { id: "6", name: "Anon_1092", score: Math.max(0, safeScore - 4), isUser: false },
      { id: "7", name: "User_4491", score: Math.max(0, safeScore - 7), isUser: false },
      { id: "8", name: "Diamond_Hand", score: Math.max(0, safeScore - 9), isUser: false },
      { id: "9", name: "User_8842", score: Math.max(0, safeScore - 12), isUser: false },
      { id: "10", name: "Anon_991", score: Math.max(0, safeScore - 15), isUser: false },
      { id: "11", name: "User_314", score: Math.max(0, safeScore - 18), isUser: false },
      { id: "12", name: "Investor_X", score: Math.max(0, safeScore - 22), isUser: false },
      { id: "13", name: "User_9981", score: Math.max(0, safeScore - 25), isUser: false },
      { id: "14", name: "Anon_332", score: Math.max(0, safeScore - 28), isUser: false },
      { id: "15", name: "Whale_Alert", score: Math.max(0, safeScore - 30), isUser: false },
      { id: "16", name: "User_771", score: Math.max(0, safeScore - 35), isUser: false },
      { id: "17", name: "Anon_002", score: Math.max(0, safeScore - 40), isUser: false },
      { id: "18", name: "User_511", score: Math.max(0, safeScore - 45), isUser: false },
      { id: "19", name: "TARS_Fan", score: Math.max(0, safeScore - 50), isUser: false },
      { id: "20", name: "User_119", score: Math.max(0, safeScore - 55), isUser: false },
    ];
    // Filter out duplicates if score is identical, or just let them tie. Sorting is enough.
    return list.sort((a, b) => b.score - a.score);
  }, [userScore, lang]);

  const getRankColor = (index, isUser) => {
    if (isUser) return C.gold; // Always gold for the user
    if (index === 0) return '#FFD700'; // 1st - Gold
    if (index === 1) return '#C0C0C0'; // 2nd - Silver
    if (index === 2) return '#CD7F32'; // 3rd - Bronze
    if (index < 10) return '#4AFFE7'; // Top 10 - Cyan
    return '#A0AAB2'; // Others - Gray
  };

  const getRankLabel = (index) => {
    if (index === 0) return 'CHAMPION';
    if (index < 3) return 'ELITE';
    if (index < 10) return 'PRO';
    return 'CHALLENGER';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#0A0A0A', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', paddingHorizontal: 24, paddingTop: 24, borderWidth: 1, borderColor: C.gold + '40' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: C.gold, letterSpacing: 1 }}>RANKING GLOBAL</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {mockUsers.map((item, index) => {
              const rankColor = getRankColor(index, item.isUser);
              const isTop3 = index < 3;
              
              return (
                <View key={item.id} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: item.isUser ? C.gold + '40' : 'rgba(255,255,255,0.05)', 
                  backgroundColor: item.isUser ? 'rgba(212, 175, 55, 0.1)' : 'transparent', 
                  borderRadius: item.isUser ? 12 : 0, 
                  paddingHorizontal: item.isUser ? 12 : 0,
                  marginBottom: item.isUser ? 8 : 0,
                  marginTop: item.isUser ? 8 : 0
                }}>
                  {/* Rank Number */}
                  <Text style={{ fontSize: isTop3 ? 20 : 16, fontWeight: '900', color: rankColor, width: 34 }}>
                    {index + 1}
                  </Text>
                  
                  {/* User Info & Progress */}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: isTop3 ? 24 : 18, height: isTop3 ? 24 : 18, borderRadius: 12, backgroundColor: rankColor + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: rankColor }}>
                          <Ionicons name={isTop3 ? "trophy" : "person"} size={isTop3 ? 12 : 10} color={rankColor} />
                        </View>
                        <Text style={{ fontSize: isTop3 ? 15 : 14, fontWeight: '700', color: item.isUser ? '#FFF' : '#E5E7EB' }}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: rankColor, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {getRankLabel(index)}
                      </Text>
                    </View>
                    
                    {/* Score Bar */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ width: `${item.score}%`, height: '100%', backgroundColor: rankColor, borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: rankColor, width: 50, textAlign: 'right' }}>
                        {item.score}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
