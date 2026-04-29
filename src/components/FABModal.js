import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";
import { C } from "../constants/themes";
import { ICON, CATS, BLOCKED_CATS, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { Btn, Input, Toggle } from "./base";

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : TestIds.INTERSTITIAL;

export function FABModal({ visible, onClose, onSaveExpense, onSaveIncome, onSaveAbono, state, frenoActive }) {
  const cur   = state?.user?.currency || "RD$";
  const goals = state?.goals || [];
  const debts = state?.debts || [];
  const premium = state?.user?.premium || false;

  const [mode,      setMode]      = useState(null);
  const [desc,      setDesc]      = useState("");
  const [amount,    setAmount]    = useState("");
  const [cat,       setCat]       = useState("Otro");
  const [showRound, setShowRound] = useState(false);
  const [roundGoal, setRoundGoal] = useState(goals[0]?.id || null);
  const [incSource, setIncSource] = useState("");
  const [debtId,    setDebtId]    = useState(debts[0]?.id || null);
  const slideAnim = useRef(new Animated.Value(500)).current;

  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const interstitial = useRef(null);

  useEffect(() => {
    if (visible) {
      setMode(null); setDesc(""); setAmount(""); setCat("Otro"); setShowRound(false);
      Animated.spring(slideAnim, { toValue:0, tension:62, friction:11, useNativeDriver:true }).start();
      
      // Load Ad
      if (!premium) {
        interstitial.current = InterstitialAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: true,
        });
        const unsubscribeLoaded = interstitial.current.addAdEventListener(AdEventType.LOADED, () => {
          setInterstitialLoaded(true);
        });
        interstitial.current.load();
        return () => unsubscribeLoaded();
      }
    } else {
      Animated.timing(slideAnim, { toValue:500, duration:200, useNativeDriver:true }).start();
    }
  }, [visible]);

  const suggestRound = (() => {
    const n = +amount;
    if (!n || n <= 0) return null;
    const next = Math.ceil(n / 100) * 100;
    return next > n ? next - n : null;
  })();

  const handleSuccessAd = () => {
    if (!premium && interstitialLoaded && interstitial.current) {
      try {
        interstitial.current.show();
      } catch (e) {
        console.log("Error showing ad", e);
      }
    }
    onClose();
  };

  const saveGasto = () => {
    if (!amount || isNaN(+amount)) return;
    const today = new Date().toISOString().split("T")[0];
    onSaveExpense({ id:Date.now(), desc:desc.trim() || cat, amount:+amount, cat, date:today });
    if (showRound && suggestRound && roundGoal) {
      onSaveAbono && onSaveAbono(roundGoal, suggestRound, "meta");
    }
    handleSuccessAd();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={{ flex:1, backgroundColor:"#000000BB", justifyContent:"flex-end" }} onPress={onClose}>
          <Animated.View style={{ transform:[{ translateY:slideAnim }] }} onStartShouldSetResponder={() => true}>
            <View style={{ backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28,
              borderWidth:1, borderColor:C.border2, paddingBottom:36 }}>
              <View style={{ width:38, height:4, borderRadius:99, backgroundColor:C.border2,
                alignSelf:"center", marginTop:14, marginBottom:18 }} />

              {/* Selector de modo */}
              {!mode && (
                <View style={{ paddingHorizontal:20 }}>
                  <Text style={{ fontSize:17, fontWeight:"900", color:C.t1, marginBottom:18 }}>Registrar movimiento</Text>
                  {[
                    ["gasto",   ICON.expense, "Registrar Gasto",   "Almuerzo, gasolina, compras...", C.rose  ],
                    ["ingreso", ICON.income,  "Registrar Ingreso", "Salario extra, freelance...",    C.mint  ],
                    ["abono",   ICON.debt,    "Abono a Deuda",     "Pago adelantado a tarjeta...",   C.violet],
                  ].map(([m, ic, label, sub, col]) => (
                    <TouchableOpacity key={m} onPress={() => setMode(m)}
                      style={{ flexDirection:"row", alignItems:"center", gap:14, backgroundColor:col+"12",
                        borderRadius:16, borderWidth:1, borderColor:col+"30", padding:14, marginBottom:10 }}>
                      <View style={{ width:44, height:44, borderRadius:13, backgroundColor:col+"22",
                        alignItems:"center", justifyContent:"center" }}>
                        <Ionicons name={ic} size={20} color={col} />
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:14, fontWeight:"800", color:col }}>{label}</Text>
                        <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>{sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={C.t3} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* MODO GASTO */}
              {mode === "gasto" && (
                <View style={{ paddingHorizontal:20 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:16 }}>
                    <TouchableOpacity onPress={() => setMode(null)}>
                      <Ionicons name={ICON.back} size={22} color={C.t3} />
                    </TouchableOpacity>
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>Registrar Gasto</Text>
                  </View>

                  {frenoActive && (
                    <View style={{ backgroundColor:C.roseBg2, borderRadius:12, borderWidth:1,
                      borderColor:C.rose+"50", padding:12, marginBottom:12, flexDirection:"row", gap:8 }}>
                      <Ionicons name={ICON.lock} size={16} color={C.rose} />
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:12, fontWeight:"800", color:C.rose }}>Freno activo — 48h</Text>
                        <Text style={{ fontSize:10, color:C.t3, marginTop:1 }}>Categorías bloqueadas: {BLOCKED_CATS.join(", ")}</Text>
                      </View>
                    </View>
                  )}

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
                    <View style={{ flexDirection:"row", gap:8 }}>
                      {Object.entries(CATS).map(([key, val]) => {
                        const blocked = frenoActive && BLOCKED_CATS.includes(key);
                        return (
                          <TouchableOpacity key={key} onPress={() => !blocked && setCat(key)}
                            style={{ paddingHorizontal:11, paddingVertical:7, borderRadius:11, borderWidth:1.5,
                              borderColor: blocked ? C.t4 : cat === key ? val.color : C.border,
                              backgroundColor: blocked ? C.t5 : cat === key ? val.color+"22" : C.card2,
                              opacity: blocked ? 0.45 : 1 }}>
                            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
                              {blocked && <Ionicons name={ICON.lock} size={10} color={C.t4} />}
                              <Ionicons name={val.icon} size={11} color={blocked ? C.t4 : cat === key ? val.color : C.t3} />
                              <Text style={{ fontSize:11, fontWeight:"700",
                                color: blocked ? C.t4 : cat === key ? val.color : C.t3 }}>
                                {key}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <Input value={desc} onChange={setDesc} placeholder="Descripción (ej: Almuerzo Mesón)" autoFocus={true} />
                  <Input value={amount} onChange={setAmount} placeholder={`Monto (${cur})`} numeric
                    editable={!(frenoActive && BLOCKED_CATS.includes(cat))} />

                  {/* Botón deshabilitado si categoría bloqueada */}
                  {frenoActive && BLOCKED_CATS.includes(cat) ? (
                    <View style={{ backgroundColor:C.t4, borderRadius:14, padding:15, alignItems:"center", opacity:0.5 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name={ICON.lock} size={13} color={C.t3} />
                        <Text style={{ fontSize:13, fontWeight:"800", color:C.t3 }}>Categoría bloqueada por Freno</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {suggestRound !== null && goals.length > 0 && (
                        <View style={{ backgroundColor:C.mintBg2, borderRadius:12, borderWidth:1,
                          borderColor:C.mint+"40", padding:12, marginBottom:12 }}>
                          <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                            <View style={{ flex:1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Ionicons name={ICON.save} size={16} color={C.mint} />
                              <View>
                                <Text style={{ fontSize:12, fontWeight:"800", color:C.mint }}>Redondeo automático</Text>
                                <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>Enviar {cur}{suggestRound} a meta</Text>
                              </View>
                            </View>
                            <Toggle value={showRound} onToggle={() => setShowRound(v => !v)} />
                          </View>
                        </View>
                      )}
                      <TouchableOpacity onPress={saveGasto}
                        style={{ backgroundColor:C.rose, borderRadius:14, padding:15, alignItems:"center",
                          shadowColor:C.rose, shadowOffset:{width:0,height:3}, shadowOpacity:0.35, shadowRadius:8 }}>
                        <Text style={{ fontSize:14, fontWeight:"800", color:"#fff" }}>Registrar Gasto</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* MODO INGRESO */}
              {mode === "ingreso" && (
                <View style={{ paddingHorizontal:20 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:16 }}>
                    <TouchableOpacity onPress={() => setMode(null)}>
                      <Ionicons name={ICON.back} size={22} color={C.t3} />
                    </TouchableOpacity>
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>Registrar Ingreso</Text>
                  </View>
                  <Input value={incSource} onChange={setIncSource} placeholder="Fuente (ej: Freelance, Bono)" autoFocus={true} />
                  <Input value={amount} onChange={setAmount} placeholder={`Monto (${cur})`} numeric />
                  <TouchableOpacity onPress={() => {
                    if (!amount || isNaN(+amount)) return;
                    onSaveIncome({ id:Date.now(), source:incSource.trim() || "Ingreso",
                      amount:+amount, date:new Date().toISOString().split("T")[0], type:"variable" });
                    handleSuccessAd();
                  }} style={{ backgroundColor:C.mint, borderRadius:14, padding:15, alignItems:"center" }}>
                    <Text style={{ fontSize:14, fontWeight:"800", color:"#000" }}>Registrar Ingreso</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* MODO ABONO */}
              {mode === "abono" && (
                <View style={{ paddingHorizontal:20 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:16 }}>
                    <TouchableOpacity onPress={() => setMode(null)}>
                      <Ionicons name={ICON.back} size={22} color={C.t3} />
                    </TouchableOpacity>
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>Abono a Deuda</Text>
                  </View>
                  {debts.length === 0 ? (
                    <Text style={{ color:C.t3, textAlign:"center", paddingVertical:20 }}>Sin deudas registradas.</Text>
                  ) : (
                    <>
                      {debts.map(d => {
                        const t = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
                        return (
                          <TouchableOpacity key={d.id} onPress={() => setDebtId(d.id)}
                            style={{ flexDirection:"row", alignItems:"center", gap:10, padding:12,
                              borderRadius:13, borderWidth:1.5, marginBottom:8,
                              borderColor: debtId === d.id ? (d.color || t.color) : C.border,
                              backgroundColor: debtId === d.id ? (d.color || t.color)+"18" : C.card2 }}>
                            <Ionicons name={t.icon} size={20} color={d.color || t.color} />
                            <View style={{ flex:1 }}>
                              <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>{d.name}</Text>
                              <Text style={{ fontSize:10, color:C.t3 }}>Saldo: {money(d.balance, cur)}</Text>
                            </View>
                            {debtId === d.id && <Ionicons name={ICON.check} size={16} color={d.color || t.color} />}
                          </TouchableOpacity>
                        );
                      })}
                      <Input value={amount} onChange={setAmount} placeholder={`Monto del abono (${cur})`} numeric autoFocus={true} />
                      <TouchableOpacity onPress={() => {
                        if (!amount || isNaN(+amount) || !debtId) return;
                        onSaveAbono && onSaveAbono(debtId, +amount, "deuda");
                        handleSuccessAd();
                      }} style={{ backgroundColor:C.violet, borderRadius:14, padding:15, alignItems:"center" }}>
                        <Text style={{ fontSize:14, fontWeight:"800", color:"#fff" }}>Registrar Abono</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
