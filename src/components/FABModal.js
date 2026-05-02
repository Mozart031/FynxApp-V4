import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Pressable, KeyboardAvoidingView, Platform, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { ICON, CATS, BLOCKED_CATS, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { Btn, Input, Toggle, haptic } from "./base";
import { F } from "../constants/themes";

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

  const [gastoStep, setGastoStep] = useState("cat");

  const [internalVisible, setInternalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setMode(null); setDesc(""); setAmount(""); setCat("Otro"); setShowRound(false); setGastoStep("cat");
      Animated.spring(slideAnim, { toValue:0, tension:62, friction:11, useNativeDriver:true }).start();
    } else {
      // Animación de caída más rápida (gravedad)
      Animated.timing(slideAnim, { toValue:800, duration:200, useNativeDriver:true }).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  const formatNum = (str) => {
    if (!str) return "";
    const p = str.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return p.join(".");
  };
  const unformatNum = (str) => str.replace(/,/g, "");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (e, gs) => { if (gs.dy > 0) slideAnim.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, tension: 62, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const suggestRound = (() => {
    const n = +amount;
    if (!n || n <= 0) return null;
    const next = Math.ceil(n / 100) * 100;
    return next > n ? next - n : null;
  })();

  const handleSuccessAd = () => {
    // Interstitial ads removed to improve UX
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

  if (!internalVisible) return null;

  return (
    <Modal transparent animationType="none" visible={internalVisible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={{ flex:1, backgroundColor:"#000000BB", justifyContent:"flex-end" }} onPress={onClose}>
          <Animated.View style={{ transform:[{ translateY:slideAnim }] }} onStartShouldSetResponder={() => true}>
            <View style={{ backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28,
              borderWidth:1, borderColor:C.border2, paddingBottom:36 }}>
              
              {/* Handle Swipeable */}
              <View {...panResponder.panHandlers} style={{ width:"100%", alignItems:"center", paddingVertical: 14, marginBottom: 4 }}>
                <View style={{ width:38, height:4, borderRadius:99, backgroundColor:C.border2 }} />
              </View>

              {/* Selector de modo */}
              {!mode && (
                <View style={{ paddingHorizontal:20 }}>
                  <Text style={{ fontSize:17, fontWeight:"900", color:C.t1, marginBottom:18 }}>Registrar movimiento</Text>
                  {[
                    ["gasto",   ICON.expense, "Registrar Gasto",   "Almuerzo, gasolina, compras...", C.rose  ],
                    ["ingreso", ICON.income,  "Registrar Ingreso", "Salario extra, freelance...",    C.mint  ],
                    ["abono",   ICON.debt,    "Abono a Deuda",     "Pago adelantado a tarjeta...",   C.sky   ],
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
                    <TouchableOpacity onPress={() => { haptic(); gastoStep === "amount" ? setGastoStep("cat") : setMode(null); }}>
                      <Ionicons name={ICON.back} size={22} color={C.t3} />
                    </TouchableOpacity>
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1, fontFamily: F.sansB }}>
                      {gastoStep === "cat" ? "Selecciona Destino" : "Monto a Registrar"}
                    </Text>
                  </View>

                  {frenoActive && (
                    <View style={{ backgroundColor:C.roseBg2, borderRadius:12, borderWidth:1,
                      borderColor:C.rose+"50", padding:12, marginBottom:12, flexDirection:"row", gap:8 }}>
                      <Ionicons name={ICON.lock} size={16} color={C.rose} />
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:12, fontWeight:"800", color:C.rose, fontFamily: F.sansB }}>Freno activo — 48h</Text>
                        <Text style={{ fontSize:10, color:C.t3, marginTop:1, fontFamily: F.sans }}>Categorías bloqueadas: {BLOCKED_CATS.join(", ")}</Text>
                      </View>
                    </View>
                  )}

                  {gastoStep === "cat" ? (
                    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 10 }}>
                      <View style={{ width: 280, height: 280, alignItems: "center", justifyContent: "center" }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="cash-outline" size={24} color={C.gold} />
                        </View>
                        
                        {Object.entries(CATS).map(([key, val], i) => {
                          const blocked = frenoActive && BLOCKED_CATS.includes(key);
                          const angle = (i * (360 / 8)) * (Math.PI / 180) - Math.PI / 2;
                          const radius = 100;
                          const x = radius * Math.cos(angle);
                          const y = radius * Math.sin(angle);
                          
                          return (
                            <TouchableOpacity key={key} onPress={() => {
                              if (!blocked) {
                                haptic("light");
                                setCat(key);
                                setGastoStep("amount");
                              }
                            }}
                            style={{
                              position: "absolute",
                              left: 140 + x - 35,
                              top: 140 + y - 35,
                              width: 70, height: 70,
                              alignItems: "center", justifyContent: "center",
                              opacity: blocked ? 0.4 : 1
                            }}>
                              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card2, borderWidth: 1, borderColor: blocked ? C.border : C.goldGlow, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                                {blocked ? <Ionicons name={ICON.lock} size={14} color={C.t4} /> : <Ionicons name={val.icon} size={20} color={C.gold} />}
                              </View>
                              <Text style={{ fontSize: 9, color: blocked ? C.t4 : C.t2, fontFamily: F.sans }}>{key}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Input value={desc} onChange={setDesc} placeholder="Descripción (ej: Almuerzo)" autoFocus={true} />
                      <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={`Monto (${cur})`} numeric 
                        style={{ fontSize: 24, height: 60, textAlign: "center", fontFamily: F.mono, color: C.gold }} />

                      {frenoActive && BLOCKED_CATS.includes(cat) ? (
                        <View style={{ backgroundColor:C.t4, borderRadius:14, padding:15, alignItems:"center", opacity:0.5 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Ionicons name={ICON.lock} size={13} color={C.t3} />
                            <Text style={{ fontSize:13, fontWeight:"800", color:C.t3 }}>Categoría bloqueada</Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          {suggestRound !== null && goals.length > 0 && (
                            <View style={{ backgroundColor:C.card2, borderRadius:12, borderWidth:1,
                              borderColor:C.gold+"30", padding:12, marginBottom:12 }}>
                              <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                                <View style={{ flex:1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Ionicons name={ICON.save} size={16} color={C.gold} />
                                  <View>
                                    <Text style={{ fontSize:12, fontWeight:"800", color:C.gold, fontFamily: F.sansB }}>Redondeo automático</Text>
                                    <Text style={{ fontSize:11, color:C.t3, marginTop:2, fontFamily: F.sans }}>Enviar {cur}{suggestRound} a meta</Text>
                                  </View>
                                </View>
                                <Toggle value={showRound} onToggle={() => setShowRound(v => !v)} />
                              </View>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => { haptic("success"); saveGasto(); }}
                            style={{ backgroundColor:C.gold, borderRadius:12, padding:15, alignItems:"center" }}>
                            <Text style={{ fontSize:14, fontWeight:"800", color:"#000", fontFamily: F.sansB }}>Registrar Gasto</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
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
                  <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={`Monto (${cur})`} numeric />
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
                      <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={`Monto del abono (${cur})`} numeric autoFocus={true} />
                      <TouchableOpacity onPress={() => {
                        if (!amount || isNaN(+amount) || !debtId) return;
                        onSaveAbono && onSaveAbono(debtId, +amount, "deuda");
                        handleSuccessAd();
                      }} style={{ backgroundColor:C.sky, borderRadius:14, padding:15, alignItems:"center" }}>
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
