import React, { useState, useRef, useEffect } from "react";
import { View, SafeAreaView, Text, TouchableOpacity, ScrollView, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { ICON, CATS } from "../constants";
import { money, DAY } from "../utils/formatters";
import { Card, Btn, Bar, Tag, CatIcon, FadeIn } from "../components/base";
import { ScoreCircle } from "../components/ScoreCircle";
import { HeroBalance } from "../components/HeroBalance";
import { RunwayAlert } from "../components/RunwayCard";
import { StreakBanner } from "../components/StreakBanner";
import { HistorialModal } from "../components/HistorialModal";
import { IngresosModal } from "../components/IngresosModal";
import { AdBanner }     from "../components/AdBanner";
import { PremiumModal } from "../components/PremiumModal";
import { TrendChart }   from "../components/TrendChart";
import { usePostHog } from 'posthog-react-native';

export function HomeScreen({ openSettings }) {
  const { appState, derived, deleteExpense, updateIncome, frenoState, isSurvival, T, updateState } = useFinance();
  const posthog = usePostHog();
  const { expenses=[], income=[], budgets={}, user={}, streakDays=[], goals=[] } = appState || {};
  const { balance=0, totalInc=0, totalExp=0, savePct=0, sc=0, grade={}, runway, sem={} } = derived;
  const cur = user.currency || "RD$";
  const TH = T || C;
  const esPremium = user?.premium || false;
  const [showPremium, setShowPremium] = useState(false);

  const [incognito,    setIncognito]    = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showIngresos,  setShowIngresos]  = useState(false);

  // Función incógnito — cubre todos los montos
  const hidden = (val) => incognito ? "••••••" : val;

  // Pulso para alerta roja
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (sem.level === "red") {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.06, duration:700, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1,    duration:700, useNativeDriver:true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [sem.level]);

  const ct = {};
  expenses.forEach(e => { ct[e.cat] = (ct[e.cat] || 0) + e.amount; });
  const level = Math.floor(sc / 20) + 1;

  return (
    <View style={{ flex:1, backgroundColor: TH.bg }}>
      <SafeAreaView style={{ flex:1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:130 }}>

          {/* HEADER */}
          <FadeIn delay={0}>
            <View style={{ flexDirection:"row", alignItems:"center", paddingHorizontal:16,
              paddingTop:12, paddingBottom:10, gap:10 }}>
              <View style={{ width:42, height:42, borderRadius:13, backgroundColor:TH.card2,
                borderWidth:1, borderColor:TH.border2, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={ICON.profile} size={20} color={TH.t2} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:11, color:TH.t3 }}>Nivel <Text style={{ color:TH.gold, fontWeight:"700" }}>{level}</Text></Text>
                <Text style={{ fontSize:16, fontWeight:"900", color:TH.t1, letterSpacing:-0.4 }}>{user.name || "Mi cuenta"}</Text>
              </View>
              <View style={{ alignItems:"center", gap:2 }}>
                <ScoreCircle score={sc} pulseAnim={pulseAnim} />
                <Text style={{ fontSize:7, color:TH.t3, letterSpacing:1, fontWeight:"600" }}>SCORE</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setIncognito(v => !v);
                posthog?.capture('Widget_Interaction', { type: 'incognito' });
              }}
                style={{ width:38, height:38, borderRadius:12,
                  backgroundColor: incognito ? TH.mintBg2 : TH.card2,
                  borderWidth:1, borderColor: incognito ? TH.mint+"50" : TH.border2,
                  alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={incognito ? ICON.eyeOff : ICON.eye} size={20} color={incognito ? TH.mint : TH.t3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                posthog?.capture('Widget_Interaction', { type: 'settings' });
                openSettings();
              }}
                style={{ width:38, height:38, borderRadius:12, backgroundColor:TH.card2,
                  borderWidth:1, borderColor:TH.border2, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={ICON.settings} size={20} color={TH.t2} />
              </TouchableOpacity>
            </View>
          </FadeIn>

          {/* MODO SUPERVIVENCIA */}
          {isSurvival && (
            <FadeIn delay={40}>
              <Animated.View style={{ transform:[{ scale:pulseAnim }], marginHorizontal:16, marginBottom:10,
                borderRadius:14, backgroundColor:"#F4433618", borderWidth:1.5, borderColor:"#F4433660",
                padding:12, flexDirection:"row", gap:10, alignItems:"center" }}>
                <Ionicons name={ICON.alert} size={24} color="#F44336" />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, fontWeight:"900", color:"#F44336" }}>MODO SUPERVIVENCIA ACTIVO</Text>
                  <Text style={{ fontSize:11, color:TH.t2, marginTop:2 }}>Score bajo de 40 pts. Revisa tus finanzas.</Text>
                </View>
              </Animated.View>
            </FadeIn>
          )}

          {/* HERO BALANCE */}
          <FadeIn delay={70}>
            <HeroBalance balance={balance} totalInc={totalInc} totalExp={totalExp}
              savePct={savePct} runway={runway} sem={sem} cur={cur} hidden={hidden}
              onPressIncome={() => setShowIngresos(true)} pulseAnim={pulseAnim} />
          </FadeIn>

          {/* RUNWAY ALERT */}
          <RunwayAlert runway={runway} day={DAY} pulseAnim={pulseAnim} />

          {/* FRENO ACTIVO */}
          {frenoState.active && (
            <FadeIn delay={90}>
              <View style={{ marginHorizontal:16, marginBottom:12, borderRadius:14, backgroundColor:TH.roseBg2,
                borderWidth:1, borderColor:TH.rose+"50", padding:12, flexDirection:"row", gap:10 }}>
                <Ionicons name={ICON.lock} size={24} color={TH.rose} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, fontWeight:"800", color:TH.rose }}>Freno de emergencia activo</Text>
                  <Text style={{ fontSize:11, color:TH.t3, marginTop:2 }}>Ocio bloqueado · {frenoState.hoursLeft}h restantes</Text>
                </View>
              </View>
            </FadeIn>
          )}

          {/* STREAK */}
          <FadeIn delay={110}><StreakBanner streakDays={streakDays} /></FadeIn>

          {/* GASTOS RECIENTES */}
          <FadeIn delay={150}>
            <Card style={{ marginBottom:12 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <Text style={{ fontSize:14, fontWeight:"800", color:TH.t1 }}>Gastos Recientes</Text>
                {expenses.length > 0 && (
                  <TouchableOpacity onPress={() => setShowHistorial(true)}>
                    <Tag label={"Ver todos " + expenses.length} color={TH.sky} />
                  </TouchableOpacity>
                )}
              </View>
              {expenses.length === 0 ? (
                <View style={{ paddingVertical:8 }}>
                  <View style={{ flexDirection:"row", alignItems:"flex-end", gap:6, height:68, marginBottom:16 }}>
                    {[32,55,20,70,42,60,35].map((h, i) => (
                      <View key={i} style={{ flex:1, justifyContent:"flex-end", height:68 }}>
                        <View style={{ width:"100%", height:h, borderRadius:6,
                          backgroundColor:TH.mint+"10", borderWidth:1, borderColor:TH.mint+"18" }} />
                      </View>
                    ))}
                  </View>
                  <View style={{ alignItems:"center" }}>
                    <Text style={{ fontSize:13, fontWeight:"900", color:TH.mint }}>Tu potencial de ahorro aquí</Text>
                    <Text style={{ fontSize:11, color:TH.t3, marginTop:4, textAlign:"center", lineHeight:17 }}>
                      Cada movimiento registrado construye{"\n"}tu historia financiera real.
                    </Text>
                  </View>
                </View>
              ) : (
                expenses.slice(0, 5).map((e, i) => {
                  const info = CATS[e.cat] || CATS["Otro"];
                  return (
                    <View key={e.id}>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                        <CatIcon cat={e.cat} size={40} />
                        <View style={{ flex:1 }}>
                          <Text style={{ fontSize:13, fontWeight:"700", color:TH.t1 }} numberOfLines={1}>{e.desc}</Text>
                          <Text style={{ fontSize:10, color:TH.t3, marginTop:1 }}>{e.cat} · {e.date}</Text>
                        </View>
                        <Text style={{ fontSize:14, fontWeight:"800", color:sem.color }}>
                          {hidden("-" + money(e.amount, cur))}
                        </Text>
                      </View>
                      {i < Math.min(expenses.length, 5) - 1 && (
                        <View style={{ height:1, backgroundColor:TH.border, marginVertical:10, marginLeft:52 }} />
                      )}
                    </View>
                  );
                })
              )}
            </Card>
          </FadeIn>

          {/* CATEGORÍAS */}
          {Object.keys(ct).length > 0 && (
            <FadeIn delay={190}>
              <Card style={{ marginBottom:12 }}>
                <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:14 }}>
                  <Text style={{ fontSize:14, fontWeight:"800", color:TH.t1 }}>Por Categoría</Text>
                  <Tag label={hidden(money(totalExp, cur))} color={sem.color} />
                </View>
                {Object.entries(ct).sort((a,b) => b[1]-a[1]).map(([cat, amt], idx, arr) => {
                  const info   = CATS[cat] || CATS["Otro"];
                  const budLim = budgets[cat];
                  const over   = budLim && amt > budLim;
                  const maxC   = Math.max(...Object.values(ct), 1);
                  return (
                    <View key={cat} style={{ marginBottom: idx < arr.length - 1 ? 12 : 0 }}>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                        <CatIcon cat={cat} size={36} />
                        <View style={{ flex:1 }}>
                          <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:5 }}>
                            <Text style={{ fontSize:12, color:TH.t2, fontWeight:"600" }}>{cat}</Text>
                            <View style={{ flexDirection:"row", gap:6, alignItems:"center" }}>
                              {over && <Tag label="Excedido" color={TH.rose} size="sm" />}
                              <Text style={{ fontSize:12, fontWeight:"800", color:TH.t1 }}>
                                {hidden(money(amt, cur))}
                              </Text>
                            </View>
                          </View>
                          <Bar pct={(amt / maxC) * 100} color={over ? TH.rose : info.color} h={5} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </FadeIn>
          )}

          {/* Gráfica de tendencias */}
          <View style={{ marginHorizontal:16, marginBottom:16 }}>
            <View style={{ backgroundColor:TH.card, borderRadius:18, borderWidth:1,
              borderColor:TH.border, padding:18, position: "relative", overflow: "hidden" }}>
              <Text style={{ fontSize:13, fontWeight:"800", color:TH.t1, marginBottom:16,
                letterSpacing:0.3 }}>
                Tendencia mensual
              </Text>
              
              {/* Contenido (con opacidad si no es premium) */}
              <View style={{ opacity: esPremium ? 1 : 0.3 }}>
                <TrendChart expenses={expenses} income={income} cur={cur} />
              </View>

              {/* Overlay Premium */}
              {!esPremium && (
                <View style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(10, 10, 18, 0.4)",
                  zIndex: 10
                }}>
                  <TouchableOpacity onPress={() => setShowPremium(true)} style={{ alignItems: "center" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: TH.gold + "20", borderWidth: 1, borderColor: TH.gold + "50", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Ionicons name="lock-closed" size={20} color={TH.gold} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: TH.gold }}>Desbloquea con Premium</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Banner publicitario — solo usuarios gratuitos */}
          <AdBanner esPremium={esPremium} onUpgrade={() => setShowPremium(true)} />

        </ScrollView>
      </SafeAreaView>

      <HistorialModal visible={showHistorial} onClose={() => setShowHistorial(false)}
        expenses={expenses} onDelete={deleteExpense} cur={cur} />
      <IngresosModal visible={showIngresos} onClose={() => setShowIngresos(false)}
        income={income} onSave={updateIncome} cur={cur} />
      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          if (success) {
            posthog?.capture('Suscripcion_Exitosa', { plan });
            updateState({ user: { ...user, premium: true } });
            setShowPremium(false);
          } else {
            posthog?.capture('Suscripcion_Fallida', { plan });
          }
        }}
      />
    </View>
  );
}
