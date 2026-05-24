import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Pressable, Platform, PanResponder, Keyboard, KeyboardAvoidingView, ActivityIndicator, StyleSheet, Dimensions, Easing, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../constants/themes";
import { ICON, CATS, BLOCKED_CATS, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { Input, Toggle, haptic } from "./base";
import { useEliteAlert } from "../context/AlertContext";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

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
  
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [gastoStep, setGastoStep] = useState("cat");
  const [scanning, setScanning] = useState(false);
  const [showScannerPicker, setShowScannerPicker] = useState(false);
  const [scansLeft, setScansLeft] = useState(3);
  const [errorMsg, setErrorMsg] = useState("");
  const [internalVisible, setInternalVisible] = useState(visible);

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

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setMode(null); setDesc(""); setAmount(""); setCat("Otro"); setShowRound(false); setGastoStep("cat");
      slideAnim.setValue(50); // Empieza ligeramente abajo para un efecto de elevación sutil
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  const closeMenu = () => {
    onClose();
  };

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
          closeMenu();
        } else {
          Animated.timing(slideAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
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
      allowsEditing: false, 
      quality: 0.15, 
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
    closeMenu();
  };

  const MenuItem = ({ icon, label, sub, onPress, color = GOLD }) => (
    <TouchableOpacity onPress={onPress} style={sh.menuItem} activeOpacity={0.7}>
      <View style={[sh.iconBox, { borderColor: color + "45", backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sh.menuLabel}>{label}</Text>
        <Text style={sh.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
    </TouchableOpacity>
  );

  const PanelHeader = ({ title, onBack }) => (
    <View style={sh.panelHeader}>
      <TouchableOpacity onPress={onBack} style={sh.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
      </TouchableOpacity>
      <Text style={sh.panelTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );

  if (!internalVisible) return null;

  return (
    <Modal transparent animationType="none" visible={internalVisible} onRequestClose={closeMenu}>
      <Animated.View pointerEvents={visible ? "auto" : "none"} style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.85)" }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} pointerEvents="box-none">
        <Animated.View style={[sh.contentContainer, { transform: [{ translateY: slideAnim }] }]} pointerEvents="box-none">
          {/* Draggable indicator for closing via swipe */}
          <View {...panResponder.panHandlers} style={{ width: "100%", alignItems: "center", paddingVertical: 14 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <View style={sh.innerContainer}>

              {/* Header */}
              {!mode && !showScannerPicker && (
                <View style={sh.header}>
                  <View>
                    <Text style={sh.brand}>FYNX ELITE</Text>
                    <Text style={sh.versionLine}>{lang === "en" ? "TRANSACTION_LOG ◆ SECURE" : "REGISTRO_TRANSACCIÓN ◆ SEGURO"}</Text>
                  </View>
                  <TouchableOpacity onPress={closeMenu} style={sh.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* ── ESCÁNER ── */}
                {showScannerPicker ? (
                  <View>
                    <PanelHeader title={lang === 'en' ? "SCAN RECEIPT" : "ESCANEAR RECIBO"} onBack={() => setShowScannerPicker(false)} />
                    <Text style={{ fontSize: 13, color: C.t3, marginBottom: 24, fontFamily: F.sans, textAlign: "center" }}>
                      {lang === 'en' ? "Choose the origin of your receipt image:" : "Elige el origen de la imagen de tu recibo:"}
                    </Text>
                    
                    <TouchableOpacity onPress={() => startScanFlow("camera")} style={sh.scannerCard}>
                      <View style={[sh.iconBox, { borderColor: GOLD + "45", backgroundColor: GOLD + "15", marginRight: 16 }]}>
                        <Ionicons name="camera" size={24} color={GOLD} />
                      </View>
                      <View>
                        <Text style={sh.menuLabel}>{lang === 'en' ? "Take Photo" : "Cámara (Tomar Foto)"}</Text>
                        <Text style={sh.menuSub}>{lang === 'en' ? "Use your camera to scan" : "Usa la cámara para escanear recibo"}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => startScanFlow("gallery")} style={sh.scannerCard}>
                      <View style={[sh.iconBox, { borderColor: C.sky + "45", backgroundColor: C.sky + "15", marginRight: 16 }]}>
                        <Ionicons name="images" size={24} color={C.sky} />
                      </View>
                      <View>
                        <Text style={sh.menuLabel}>{lang === 'en' ? "Choose from Gallery" : "Galería (Elegir Foto)"}</Text>
                        <Text style={sh.menuSub}>{lang === 'en' ? "Select an existing photo" : "Selecciona una imagen guardada"}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* ── SELECTOR PRINCIPAL ── */}
                    {!mode && (
                      <View>
                        <View style={sh.sectionLabel}>
                          <View style={sh.sectionLine} />
                          <Text style={sh.sectionText}>{lang === "en" ? "OPERATION_TYPE" : "TIPO_OPERACIÓN"}</Text>
                          <View style={sh.sectionLine} />
                        </View>
                        
                        <MenuItem m="gasto" icon={ICON.expense} label={lang === 'en' ? "Log Expense" : "Registrar Gasto"} sub={lang === 'en' ? "Lunch, gas, shopping..." : "Almuerzo, gasolina, compras..."} color={C.rose} onPress={() => setMode("gasto")} />
                        <MenuItem m="ingreso" icon={ICON.income} label={lang === 'en' ? "Log Income" : "Registrar Ingreso"} sub={lang === 'en' ? "Extra salary, freelance..." : "Salario extra, freelance..."} color={C.mint} onPress={() => setMode("ingreso")} />
                        <MenuItem m="abono" icon={ICON.debt} label={lang === 'en' ? "Debt Payment" : "Abono a Deuda"} sub={lang === 'en' ? "Credit card payment..." : "Pago adelantado a tarjeta..."} color={C.sky} onPress={() => setMode("abono")} />
                        <MenuItem m="compartido" icon="people" label={lang === 'en' ? "Shared Expense" : "Gasto Compartido"} sub={lang === 'en' ? "Split bill with someone..." : "Dividir cuenta con alguien..."} color={GOLD} onPress={() => {
                          closeMenu();
                          setTimeout(() => {
                            if (setEstrategiaTab) setEstrategiaTab("compartidas");
                            if (setTab) setTab("estrategia");
                          }, 300);
                        }} />
                      </View>
                    )}

                    {/* ── MODO GASTO ── */}
                    {mode === "gasto" && (
                      <View>
                        <PanelHeader 
                          title={gastoStep === "cat" ? (lang === 'en' ? "SELECT CATEGORY" : "CLASIFICACIÓN DE EGRESO") : (lang === 'en' ? "TRANSACTION DETAILS" : "DETALLES DE TRANSACCIÓN")} 
                          onBack={() => { haptic(); gastoStep === "amount" ? setGastoStep("cat") : setMode(null); }} 
                        />
                        
                        {frenoActive && (
                          <View style={sh.frenoAlert}>
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
                          <View style={{ flex: 1, minHeight: 300 }}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                              {Object.entries(CATS).map(([key, val]) => {
                                const blocked = frenoActive && BLOCKED_CATS.includes(key);
                                const isSelected = cat === key;
                                const catColor = val.color || GOLD;
                                
                                return (
                                  <TouchableOpacity key={key} activeOpacity={0.7} onPress={() => {
                                    if (!blocked) {
                                      haptic("light");
                                      setCat(key);
                                      setGastoStep("amount");
                                    }
                                  }}
                                  style={[sh.menuItem, { opacity: blocked ? 0.4 : 1, backgroundColor: isSelected ? "rgba(255,255,255,0.05)" : "transparent" }]}>
                                    <View style={[sh.iconBox, { borderColor: blocked ? C.border : catColor + "45", backgroundColor: blocked ? C.card2 : catColor + "15" }]}>
                                      <Ionicons name={blocked ? ICON.lock : val.icon} size={20} color={blocked ? C.t4 : catColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={sh.menuLabel}>{val.label?.[lang] || key}</Text>
                                      {blocked && <Text style={{ fontSize: 10, color: C.rose, marginTop: 2, fontFamily: F.sans }}>{lang === 'en' ? 'Blocked by Freno' : 'Bloqueado por Freno'}</Text>}
                                    </View>
                                    {!blocked && <Ionicons name="chevron-forward" size={18} color={C.t4} />}
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        ) : (
                          <View>
                            {errorMsg ? (
                              <View style={sh.errorAlert}>
                                <Ionicons name="alert-circle" size={16} color="#FF4A4A" />
                                <Text style={{ flex: 1, fontSize: 11, color: C.t2, fontFamily: F.sans }}>{errorMsg}</Text>
                                <TouchableOpacity onPress={() => setErrorMsg("")}><Ionicons name="close" size={16} color={C.t3} /></TouchableOpacity>
                              </View>
                            ) : null}

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 10 }}>
                              <Text style={{ fontSize: 12, color: C.t3, fontFamily: F.mono, letterSpacing: 1 }}>{lang === 'en' ? "DETAILS" : "DETALLES"}</Text>
                              <TouchableOpacity onPress={handleReceiptScan} disabled={scanning} style={sh.scanBtn}>
                                {scanning ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name="camera" size={14} color={GOLD} />}
                                <Text style={sh.scanBtnText}>{lang === 'en' ? "SCAN RECEIPT" : "ESCANEAR RECIBO"}</Text>
                              </TouchableOpacity>
                            </View>

                            <Input value={desc} onChange={setDesc} placeholder={lang === 'en' ? "Description (e.g. Lunch)" : "Descripción (ej: Almuerzo)"} 
                                   style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#FFF" }} placeholderTextColor="rgba(255,255,255,0.3)" />
                            <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Amount (${cur})` : `Monto (${cur})`} numeric 
                              style={{ fontSize: 24, height: 60, textAlign: "center", fontFamily: F.monoB, color: GOLD, backgroundColor: "rgba(255,255,255,0.02)", borderColor: GOLD+"50" }} placeholderTextColor="rgba(212,175,55,0.3)" />

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
                                  <View style={sh.roundCard}>
                                    <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                                      <View style={{ flex:1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <Ionicons name={ICON.save} size={20} color={GOLD} />
                                        <View>
                                          <Text style={{ fontSize:12, fontWeight:"800", color:GOLD, fontFamily: F.sansB }}>{lang === 'en' ? "Auto Round-up" : "Redondeo automático"}</Text>
                                          <Text style={{ fontSize:11, color:C.t2, marginTop:2, fontFamily: F.mono }}>{lang === 'en' ? `Send ${cur}${suggestRound} to goal` : `Enviar ${cur}${suggestRound} a meta`}</Text>
                                        </View>
                                      </View>
                                      <Toggle value={showRound} onToggle={() => setShowRound(v => !v)} />
                                    </View>
                                  </View>
                                )}
                                <TouchableOpacity onPress={() => { haptic("success"); saveGasto(); }} style={sh.primaryBtn}>
                                  <Text style={sh.primaryBtnText}>{lang === 'en' ? "CONFIRM TRANSACTION" : "CONFIRMAR TRANSACCIÓN"}</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    {/* ── MODO INGRESO ── */}
                    {mode === "ingreso" && (
                      <View>
                        <PanelHeader title={lang === 'en' ? "LOG INCOME" : "REGISTRAR INGRESO"} onBack={() => setMode(null)} />
                        <Input value={incSource} onChange={setIncSource} placeholder={lang === 'en' ? "Source (e.g. Freelance, Bonus)" : "Fuente (ej: Freelance, Bono)"} 
                               style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#FFF" }} placeholderTextColor="rgba(255,255,255,0.3)" />
                        <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Amount (${cur})` : `Monto (${cur})`} numeric 
                               style={{ fontSize: 24, height: 60, textAlign: "center", fontFamily: F.monoB, color: C.mint, backgroundColor: "rgba(255,255,255,0.02)", borderColor: C.mint+"50" }} placeholderTextColor="rgba(0,255,157,0.3)" />
                        <TouchableOpacity onPress={() => {
                          if (!amount || isNaN(+amount)) return;
                          onSaveIncome({ id:Date.now(), source:incSource.trim() || (lang === 'en' ? "Income" : "Ingreso"), amount:+amount, date:new Date().toISOString().split("T")[0], type:"variable" });
                          closeMenu();
                        }} style={[sh.primaryBtn, { backgroundColor: C.mint }]}>
                          <Text style={[sh.primaryBtnText, { color: "#000" }]}>{lang === 'en' ? "CONFIRM INCOME" : "CONFIRMAR INGRESO"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ── MODO ABONO ── */}
                    {mode === "abono" && (
                      <View>
                        <PanelHeader title={lang === 'en' ? "DEBT PAYMENT" : "ABONO A DEUDA"} onBack={() => setMode(null)} />
                        {debts.length === 0 ? (
                          <Text style={{ color:C.t3, textAlign:"center", paddingVertical:30, fontFamily: F.mono }}>{lang === 'en' ? "No liabilities registered." : "Sin pasivos registrados."}</Text>
                        ) : (
                          <>
                            {debts.map(d => {
                              const t = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
                              const isSel = debtId === d.id;
                              const dColor = d.color || t.color;
                              return (
                                <TouchableOpacity key={d.id} onPress={() => setDebtId(d.id)}
                                  style={[sh.menuItem, { 
                                    backgroundColor: isSel ? dColor+"15" : "rgba(255,255,255,0.03)", 
                                    borderWidth: 1, borderColor: isSel ? dColor+"50" : "rgba(255,255,255,0.05)",
                                    borderRadius: 14, marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16 
                                  }]}>
                                  <View style={[sh.iconBox, { borderColor: dColor+"30", backgroundColor: dColor+"10", marginRight: 14, width: 40, height: 40 }]}>
                                    <Ionicons name={t.icon} size={18} color={dColor} />
                                  </View>
                                  <View style={{ flex:1 }}>
                                    <Text style={sh.menuLabel}>{d.name}</Text>
                                    <Text style={sh.menuSub}>{lang === 'en' ? "Balance: " : "Saldo: "}{money(d.balance, cur)}</Text>
                                  </View>
                                  {isSel ? <Ionicons name={ICON.check} size={20} color={dColor} /> : <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }} />}
                                </TouchableOpacity>
                              );
                            })}
                            <Input value={formatNum(amount)} onChange={v => setAmount(unformatNum(v))} placeholder={lang === 'en' ? `Payment amount (${cur})` : `Monto del abono (${cur})`} numeric 
                               style={{ fontSize: 24, height: 60, textAlign: "center", fontFamily: F.monoB, color: C.sky, backgroundColor: "rgba(255,255,255,0.02)", borderColor: C.sky+"50", marginTop: 10 }} placeholderTextColor="rgba(0,191,255,0.3)" />
                            
                            <TouchableOpacity onPress={() => {
                              if (!amount || isNaN(+amount) || !debtId) return;
                              onSaveAbono && onSaveAbono(debtId, +amount, "deuda");
                              closeMenu();
                            }} style={[sh.primaryBtn, { backgroundColor: C.sky }]}>
                              <Text style={[sh.primaryBtnText, { color: "#FFF" }]}>{lang === 'en' ? "CONFIRM PAYMENT" : "CONFIRMAR ABONO"}</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sh = StyleSheet.create({
  contentContainer: { flex: 1, justifyContent: "flex-end", marginTop: 70 },
  innerContainer: { paddingHorizontal: 24, flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 30 },
  brand: { fontFamily: F.monoB, fontSize: 20, color: GOLD, letterSpacing: 5 },
  versionLine: { fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: 1 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, marginTop: 16 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  sectionText: { fontFamily: F.monoB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2 },
  
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  iconBox: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 14 },
  menuLabel: { fontFamily: F.monoB, fontSize: 15, color: "#FFF", marginBottom: 2 },
  menuSub: { fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.35)" },
  
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  panelTitle: { fontFamily: F.monoB, fontSize: 13, color: "#FFF", letterSpacing: 2 },
  
  frenoAlert: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", padding: 12, marginBottom: 16, flexDirection: "row", gap: 10 },
  errorAlert: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", padding: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GOLD + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: GOLD + "40" },
  scanBtnText: { fontSize: 9, fontFamily: F.monoB, color: GOLD, letterSpacing: 1 },
  
  scannerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  roundCard: { backgroundColor: "rgba(212,175,55,0.05)", borderRadius: 12, borderWidth: 1, borderColor: GOLD+"30", padding: 16, marginBottom: 16 },
  
  primaryBtn: { backgroundColor: GOLD, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 10 },
  primaryBtnText: { fontSize: 13, fontFamily: F.monoB, color: "#000", letterSpacing: 1 },
});
