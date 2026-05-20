import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Pressable, Platform, PanResponder, Keyboard, KeyboardAvoidingView, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { ICON, CATS, BLOCKED_CATS, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { Btn, Input, Toggle, haptic } from "./base";
import { F } from "../constants/themes";

import { useEliteAlert } from "../context/AlertContext";

export function FABModal({ visible, onClose, onSaveExpense, onSaveIncome, onSaveAbono, state, frenoActive, setTab, setEstrategiaTab, recoveredAsset, onClearRecoveredAsset }) {
  const cur   = state?.user?.currency || "RD$";
  const goals = state?.goals || [];
  const debts = state?.debts || [];
  const premium = state?.user?.premium || false;
  const { lang } = require("../context/LanguageContext").useLanguage();
  const { showAlert } = useEliteAlert();

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
  const [scanning, setScanning] = useState(false);
  const [showScannerPicker, setShowScannerPicker] = useState(false);
  const [scansLeft, setScansLeft] = useState(3);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("@fynx_receipt_scans").then(val => {
      if (val !== null) setScansLeft(Math.max(0, 3 - parseInt(val, 10)));
    });
  }, []);

  useEffect(() => {
    if (recoveredAsset) {
      processRecoveredAsset(recoveredAsset);
      onClearRecoveredAsset();
    }
  }, [recoveredAsset]);

  const processRecoveredAsset = async (asset) => {
    setErrorMsg("");
    setScanning(true);
    setMode("gasto");
    setGastoStep("cat");
    try {
      const FileSystem = require("expo-file-system");
      const base64Img = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const { queryGemini } = require("../services/gemini");
      const prompt = `Analyze this receipt image. Extract:
      1. amount (number)
      2. category (one of: ${Object.keys(CATS).join(", ")})
      3. description (short merchant name)
      Return ONLY a JSON object: {"amount": 0, "cat": "...", "desc": "..."}`;

      const response = await queryGemini(prompt, base64Img);
      
      const match = response.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON object found in response");
      
      const data = JSON.parse(match[0]);
      
      if (data.amount && data.amount > 0) {
        setAmount(String(data.amount));
        setCat(data.cat || "Otro");
        setDesc(data.desc || "");
        setGastoStep("amount");
        
        if (!premium) {
          const newCount = (3 - scansLeft) + 1;
          await AsyncStorage.setItem("@fynx_receipt_scans", String(newCount));
          setScansLeft(3 - newCount);
        }
      } else {
        throw new Error("Receipt amount was zero or could not be extracted.");
      }
    } catch (e) {
      console.warn("Recovered scan error:", e);
      setErrorMsg(
        lang === 'en' 
          ? "Could not read the recovered receipt. Please check the image and try again, or enter manually." 
          : "No se pudo leer el recibo recuperado. Por favor verifica la imagen e intenta de nuevo, o regístralo manual."
      );
    } finally {
      setScanning(false);
    }
  };

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

  const handleReceiptScan = () => {
    setErrorMsg("");
    if (!premium && scansLeft <= 0 && !__DEV__) {
      setErrorMsg(
        lang === 'en' 
          ? "You've used your 3 free trials. Upgrade to Elite for unlimited scanning!" 
          : "Has agotado tus 3 pruebas gratuitas. ¡Pásate a Élite para escaneos ilimitados!"
      );
      return;
    }

    setShowScannerPicker(true);
  };

  const startScanFlow = async (source) => {
    setShowScannerPicker(false);

    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (e) {
      setErrorMsg(lang === 'en' ? "Image scanner is not available." : "El escáner de imágenes no está disponible.");
      return;
    }

    const hasPermission = await requestPickerPermission(ImagePicker, source);
    if (!hasPermission) return;

    let result;
    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disables high-memory cropping activity
      quality: 0.15, // Drastically compresses image to prevent Out-Of-Memory bridge crashes
      base64: true
    };

    try {
      global.ignoreNextAppLock = true;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (result.canceled) {
        global.ignoreNextAppLock = false;
        return;
      }

      setScanning(true);
      const { queryGemini } = require("../services/gemini");
      const base64Img = result.assets[0].base64;
      const prompt = `Analyze this receipt image. Extract:
      1. amount (number)
      2. category (one of: ${Object.keys(CATS).join(", ")})
      3. description (short merchant name)
      Return ONLY a JSON object: {"amount": 0, "cat": "...", "desc": "..."}`;

      const response = await queryGemini(prompt, base64Img);
      
      const match = response.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON object found in response");
      
      const data = JSON.parse(match[0]);
      
      if (data.amount && data.amount > 0) {
        setAmount(String(data.amount));
        setCat(data.cat || "Otro");
        setDesc(data.desc || "");
        setGastoStep("amount");
        
        if (!premium) {
          const newCount = (3 - scansLeft) + 1;
          await AsyncStorage.setItem("@fynx_receipt_scans", String(newCount));
          setScansLeft(3 - newCount);
        }
      } else {
        throw new Error("Receipt amount was zero or could not be extracted.");
      }
    } catch (e) {
      console.warn("Scan error:", e);
      setErrorMsg(
        lang === 'en' 
          ? "Could not read receipt. Please check the image and try again, or enter manually." 
          : "No se pudo leer el recibo. Por favor verifica la imagen e intenta de nuevo, o regístralo manual."
      );
    } finally {
      setScanning(false);
    }
  };

  const requestPickerPermission = async (ImagePicker, source) => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={{ flex:1, backgroundColor:"#000000BB", justifyContent:"flex-end" }} onPress={onClose}>
          <Animated.View style={{ transform:[{ translateY:slideAnim }] }} onStartShouldSetResponder={() => true}>
            <View style={{ backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28,
              borderWidth:1, borderColor:C.border2, paddingBottom:36 }}>
              
              {/* Handle Swipeable */}
              <View {...panResponder.panHandlers} style={{ width:"100%", alignItems:"center", paddingVertical: 14, marginBottom: 4 }}>
                <View style={{ width:38, height:4, borderRadius:99, backgroundColor:C.border2 }} />
              </View>

              {/* Custom Scanner Picker UI */}
              {showScannerPicker ? (
                <View style={{ paddingHorizontal:20, paddingVertical: 10 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:24 }}>
                    <TouchableOpacity onPress={() => setShowScannerPicker(false)}>
                      <Ionicons name={ICON.back} size={22} color={C.t3} />
                    </TouchableOpacity>
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "Scan Receipt" : "Escanear Recibo"}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: C.t3, marginBottom: 24, textAlign: "center" }}>{lang === 'en' ? "Choose the origin of your receipt image:" : "Elige el origen de la imagen de tu recibo:"}</Text>
                  
                  <TouchableOpacity onPress={() => startScanFlow("camera")} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card2, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.gold + "15", alignItems: "center", justifyContent: "center", marginRight: 16, borderWidth: 1, borderColor: C.gold + "30" }}>
                      <Ionicons name="camera" size={24} color={C.gold} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFF", fontFamily: F.sansB }}>{lang === 'en' ? "Take Photo" : "Cámara (Tomar Foto)"}</Text>
                      <Text style={{ fontSize: 11, color: C.t4, marginTop: 2, fontFamily: F.sans }}>{lang === 'en' ? "Use your camera to scan" : "Usa la cámara para escanear recibo"}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => startScanFlow("gallery")} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card2, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.sky + "15", alignItems: "center", justifyContent: "center", marginRight: 16, borderWidth: 1, borderColor: C.sky + "30" }}>
                      <Ionicons name="images" size={24} color={C.sky} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFF", fontFamily: F.sansB }}>{lang === 'en' ? "Choose from Gallery" : "Galería (Elegir Foto)"}</Text>
                      <Text style={{ fontSize: 11, color: C.t4, marginTop: 2, fontFamily: F.sans }}>{lang === 'en' ? "Select an existing photo" : "Selecciona una imagen guardada"}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Selector de modo */}
                  {!mode && (
                    <View style={{ paddingHorizontal:20 }}>
                      <Text style={{ fontSize:17, fontWeight:"900", color:C.t1, marginBottom:18 }}>{lang === 'en' ? "Log Transaction" : "Registrar movimiento"}</Text>
                  {[
                    ["gasto",   ICON.expense, lang === 'en' ? "Log Expense" : "Registrar Gasto",   lang === 'en' ? "Lunch, gas, shopping..." : "Almuerzo, gasolina, compras...", C.rose  ],
                    ["ingreso", ICON.income,  lang === 'en' ? "Log Income" : "Registrar Ingreso", lang === 'en' ? "Extra salary, freelance..." : "Salario extra, freelance...",    C.mint  ],
                    ["abono",   ICON.debt,    lang === 'en' ? "Debt Payment" : "Abono a Deuda",     lang === 'en' ? "Credit card payment..." : "Pago adelantado a tarjeta...",   C.sky   ],
                    ["compartido", "people",  lang === 'en' ? "Shared Expense" : "Gasto Compartido",  lang === 'en' ? "Split bill with someone..." : "Dividir cuenta con alguien...",  C.gold  ],
                  ].map(([m, ic, label, sub, col]) => (
                    <TouchableOpacity key={m} onPress={() => {
                        if (m === "compartido") {
                          onClose();
                          setTimeout(() => {
                            if (setEstrategiaTab) setEstrategiaTab("compartidas");
                            if (setTab) setTab("estrategia");
                          }, 300);
                        } else {
                          setMode(m);
                        }
                      }}
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
                      {gastoStep === "cat" 
                        ? (lang === 'en' ? "Select Category" : "Selecciona Destino") 
                        : (lang === 'en' ? "Amount to Log" : "Monto a Registrar")}
                    </Text>
                  </View>

                  {frenoActive && (
                    <View style={{ backgroundColor:C.roseBg2, borderRadius:12, borderWidth:1,
                      borderColor:C.rose+"50", padding:12, marginBottom:12, flexDirection:"row", gap:8 }}>
                      <Ionicons name={ICON.lock} size={16} color={C.rose} />
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:12, fontWeight:"800", color:C.rose, fontFamily: F.sansB }}>Freno activo — 48h</Text>
                        <Text style={{ fontSize:10, color:C.t3, marginTop:1, fontFamily: F.sans }}>
                          {lang === 'en' ? "Blocked categories: " : "Categorías bloqueadas: "} 
                          {BLOCKED_CATS.map(c => CATS[c]?.label?.[lang] || c).join(", ")}
                        </Text>
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
                              <Text style={{ fontSize: 9, color: blocked ? C.t4 : C.t2, fontFamily: F.sans }}>{val.label?.[lang] || key}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View>
                      {errorMsg ? (
                        <View style={{ 
                          backgroundColor: "rgba(255, 74, 74, 0.1)", 
                          borderRadius: 12, 
                          borderWidth: 1, 
                          borderColor: "rgba(255, 74, 74, 0.3)", 
                          padding: 10, 
                          marginBottom: 12, 
                          flexDirection: "row", 
                          alignItems: "center", 
                          gap: 8 
                        }}>
                          <Ionicons name="alert-circle" size={16} color="#FF4A4A" />
                          <Text style={{ flex: 1, fontSize: 11, color: C.t2, fontFamily: F.sans }}>{errorMsg}</Text>
                          <TouchableOpacity onPress={() => setErrorMsg("")}>
                            <Ionicons name="close" size={16} color={C.t3} />
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, color: C.t3 }}>{lang === 'en' ? "Details" : "Detalles"}</Text>
                        <TouchableOpacity onPress={handleReceiptScan} disabled={scanning} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.gold + "40" }}>
                          {scanning ? <ActivityIndicator size="small" color={C.gold} /> : <Ionicons name="camera" size={16} color={C.gold} />}
                          <Text style={{ fontSize: 10, fontWeight: "800", color: C.gold }}>{lang === 'en' ? "SCAN RECEIPT" : "ESCANEAR RECIBO"}</Text>
                        </TouchableOpacity>
                      </View>
                      <Input value={desc} onChange={setDesc} placeholder={lang === 'en' ? "Description (e.g. Lunch)" : "Descripción (ej: Almuerzo)"} />
                      <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Amount (${cur})` : `Monto (${cur})`} numeric 
                        style={{ fontSize: 24, height: 60, textAlign: "center", fontFamily: F.mono, color: C.gold }} />

                      {frenoActive && BLOCKED_CATS.includes(cat) ? (
                        <View style={{ backgroundColor:C.t4, borderRadius:14, padding:15, alignItems:"center", opacity:0.5 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Ionicons name={ICON.lock} size={13} color={C.t3} />
                            <Text style={{ fontSize:13, fontWeight:"800", color:C.t3 }}>{lang === 'en' ? "Blocked category" : "Categoría bloqueada"}</Text>
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
                                    <Text style={{ fontSize:12, fontWeight:"800", color:C.gold, fontFamily: F.sansB }}>{lang === 'en' ? "Auto Round-up" : "Redondeo automático"}</Text>
                                    <Text style={{ fontSize:11, color:C.t3, marginTop:2, fontFamily: F.sans }}>{lang === 'en' ? `Send ${cur}${suggestRound} to goal` : `Enviar ${cur}${suggestRound} a meta`}</Text>
                                  </View>
                                </View>
                                <Toggle value={showRound} onToggle={() => setShowRound(v => !v)} />
                              </View>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => { haptic("success"); saveGasto(); }}
                            style={{ backgroundColor:C.gold, borderRadius:12, padding:15, alignItems:"center" }}>
                            <Text style={{ fontSize:14, fontWeight:"800", color:"#000", fontFamily: F.sansB }}>{lang === 'en' ? "Log Expense" : "Registrar Gasto"}</Text>
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
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "Log Income" : "Registrar Ingreso"}</Text>
                  </View>
                  <Input value={incSource} onChange={setIncSource} placeholder={lang === 'en' ? "Source (e.g. Freelance, Bonus)" : "Fuente (ej: Freelance, Bono)"} />
                  <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Amount (${cur})` : `Monto (${cur})`} numeric />
                  <TouchableOpacity onPress={() => {
                    if (!amount || isNaN(+amount)) return;
                    onSaveIncome({ id:Date.now(), source:incSource.trim() || (lang === 'en' ? "Income" : "Ingreso"),
                      amount:+amount, date:new Date().toISOString().split("T")[0], type:"variable" });
                    handleSuccessAd();
                  }} style={{ backgroundColor:C.mint, borderRadius:14, padding:15, alignItems:"center" }}>
                    <Text style={{ fontSize:14, fontWeight:"800", color:"#000" }}>{lang === 'en' ? "Log Income" : "Registrar Ingreso"}</Text>
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
                    <Text style={{ fontSize:16, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "Debt Payment" : "Abono a Deuda"}</Text>
                  </View>
                  {debts.length === 0 ? (
                    <Text style={{ color:C.t3, textAlign:"center", paddingVertical:20 }}>{lang === 'en' ? "No debts logged." : "Sin deudas registradas."}</Text>
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
                              <Text style={{ fontSize:10, color:C.t3 }}>{lang === 'en' ? "Balance: " : "Saldo: "}{money(d.balance, cur)}</Text>
                            </View>
                            {debtId === d.id && <Ionicons name={ICON.check} size={16} color={d.color || t.color} />}
                          </TouchableOpacity>
                        );
                      })}
                      <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Payment amount (${cur})` : `Monto del abono (${cur})`} numeric />
                      <TouchableOpacity onPress={() => {
                        if (!amount || isNaN(+amount) || !debtId) return;
                        onSaveAbono && onSaveAbono(debtId, +amount, "deuda");
                        handleSuccessAd();
                      }} style={{ backgroundColor:C.sky, borderRadius:14, padding:15, alignItems:"center" }}>
                        <Text style={{ fontSize:14, fontWeight:"800", color:"#fff" }}>{lang === 'en' ? "Log Payment" : "Registrar Abono"}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              </>
            )}
            </View>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
