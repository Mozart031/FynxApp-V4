import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { money } from "../utils/formatters";
import { useEliteAlert } from "../context/AlertContext";
import { Btn, Input, Tag } from "./base";

export function IngresosModal({ visible, onClose, income, onSave, cur }) {
  const [list,   setList]   = useState(income);
  const [adding, setAdding] = useState(false);
  const [form,   setForm]   = useState({ source:"", amount:"", type:"fijo", frequency: "mensual", payDays: [30] });
  const { showAlert } = useEliteAlert();
  const { lang } = require("../context/LanguageContext").useLanguage();
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => { setList(income); }, [income]);
  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue:0, tension:60, friction:12, useNativeDriver:true }).start();
    else Animated.timing(slideAnim, { toValue:600, duration:220, useNativeDriver:true }).start();
  }, [visible]);

  if (!visible) return null;
  const total = list.reduce((a, i) => a + i.amount, 0);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"#000000CC" }}>
        <Animated.View style={{ flex:1, marginTop:60, backgroundColor:C.bg,
          borderTopLeftRadius:26, borderTopRightRadius:26, borderWidth:1, borderColor:C.border2,
          transform:[{ translateY:slideAnim }] }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
            padding:18, borderBottomWidth:1, borderBottomColor:C.border }}>
            <View>
              <Text style={{ fontSize:18, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "Income" : "Ingresos"}</Text>
              <Text style={{ fontSize:11, color:C.mint, marginTop:2, fontWeight:"700" }}>Total: {money(total, cur)}/{lang === 'en' ? "mo" : "mes"}</Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ width:34, height:34, borderRadius:11, backgroundColor:C.card2, alignItems:"center", justifyContent:"center" }}>
              <Ionicons name={ICON.close} size={20} color={C.t2} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
            {list.map(inc => (
              <View key={inc.id} style={{ flexDirection:"row", alignItems:"center", gap:12, marginBottom:10,
                backgroundColor:C.card2, borderRadius:14, borderWidth:1, borderColor:C.border2, padding:14 }}>
                <View style={{ width:42, height:42, borderRadius:13, backgroundColor:C.mintBg2, alignItems:"center", justifyContent:"center" }}>
                  <Ionicons name={ICON.income} size={22} color={C.mint} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }}>{inc.source}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <Tag label={inc.type === "fijo" ? (lang === 'en' ? "Fixed" : "Fijo") : (lang === 'en' ? "Variable" : "Variable")} color={inc.type === "fijo" ? C.mint : C.gold} size="sm" />
                    {inc.type === "fijo" && inc.frequency && (
                      <Tag label={lang === 'en' ? inc.frequency : (inc.frequency === 'mensual' ? 'Mensual' : inc.frequency === 'quincenal' ? 'Quincenal' : 'Semanal')} color={C.sky} size="sm" />
                    )}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize:14, fontWeight:"800", color:C.mint }}>{money(inc.amount, cur)}</Text>
                  {inc.type === "fijo" && inc.frequency === "quincenal" && (
                    <Text style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{money(inc.amount * 2, cur)} /mo</Text>
                  )}
                  {inc.type === "fijo" && inc.frequency === "semanal" && (
                    <Text style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{money(inc.amount * 4, cur)} /mo</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => { 
                  showAlert(lang === 'en' ? "Delete Income" : "Eliminar Ingreso", lang === 'en' ? `Are you sure you want to delete ${inc.source}?` : `¿Seguro que deseas eliminar el ingreso de ${inc.source}?`, [
                    { text: lang === 'en' ? "Cancel" : "Cancelar", style: "cancel" },
                    { text: lang === 'en' ? "Delete" : "Eliminar", style: "destructive", onPress: () => {
                        const u = list.filter(x => x.id !== inc.id); setList(u); onSave(u); 
                    }}
                  ], "warning");
                }}>
                  <Ionicons name={ICON.close} size={24} color={C.t4} />
                </TouchableOpacity>
              </View>
            ))}
            {adding ? (
              <View style={{ backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border2, padding:16 }}>
                
                {/* TIPO DE INGRESO */}
                <Text style={{ fontSize: 11, color: C.t2, marginBottom: 8, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>{lang === 'en' ? "Income Type" : "Tipo de Ingreso"}</Text>
                <View style={{ flexDirection:"row", gap:12, marginBottom:20 }}>
                  {[["fijo", lang === 'en' ? "Fixed" : "Fijo"], ["variable", lang === 'en' ? "Variable" : "Variable"]].map(([t,l]) => (
                    <TouchableOpacity key={t} onPress={() => setForm({ ...form, type:t })}
                      style={{ flex:1, paddingVertical:12, borderRadius:14, borderWidth:1.5, alignItems:"center",
                        borderColor: form.type === t ? C.mint : C.border2, backgroundColor: form.type === t ? C.mintBg : C.card2 }}>
                      <Text style={{ fontSize:12, fontWeight:"800", color: form.type === t ? C.mint : C.t3 }}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* FRECUENCIA DE PAGO */}
                {form.type === "fijo" && (
                  <View style={{ marginBottom: 20, backgroundColor: C.card2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border2 }}>
                    <Text style={{ fontSize: 11, color: C.t2, marginBottom: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>{lang === 'en' ? "Payment Frequency" : "Frecuencia de Pago"}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {[
                        { id: "mensual", label: lang === 'en' ? "Monthly" : "Mensual", days: [30] },
                        { id: "quincenal", label: lang === 'en' ? "Bi-weekly" : "Quincenal", days: [15, 30] },
                        { id: "semanal", label: lang === 'en' ? "Weekly" : "Semanal", days: [5] /* Friday */ }
                      ].map(freq => (
                        <TouchableOpacity key={freq.id} onPress={() => setForm({ ...form, frequency: freq.id, payDays: freq.days })}
                          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center",
                            borderColor: form.frequency === freq.id ? C.mint : C.border2, backgroundColor: form.frequency === freq.id ? C.mint + "15" : C.card }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: form.frequency === freq.id ? C.mint : C.t3 }}>{freq.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
                      <Ionicons name="information-circle" size={14} color={C.t4} />
                      <Text style={{ fontSize: 10, color: C.t3, flex: 1 }}>
                        {form.frequency === "mensual" && (lang === 'en' ? "You receive this amount once a month (Day 30)." : "Recibes este monto 1 vez al mes (Día 30).")}
                        {form.frequency === "quincenal" && (lang === 'en' ? "You receive this amount twice a month (Days 15 and 30)." : "Recibes este monto 2 veces al mes (Días 15 y 30).")}
                        {form.frequency === "semanal" && (lang === 'en' ? "You receive this amount every week." : "Recibes este monto cada semana.")}
                      </Text>
                    </View>
                  </View>
                )}

                {/* DETALLES */}
                <Text style={{ fontSize: 11, color: C.t2, marginBottom: 8, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>{lang === 'en' ? "Details" : "Detalles"}</Text>
                <Input value={form.source} onChange={v => setForm({ ...form, source:v })} placeholder={lang === 'en' ? "Source (e.g. Salary)" : "Nombre (ej: Salario)"} />
                <Input value={form.amount} onChange={v => setForm({ ...form, amount:v })} placeholder={lang === 'en' ? `Amount per period (${cur})` : `Monto por período (${cur})`} numeric />

                <View style={{ flexDirection:"row", gap:12, marginTop: 10 }}>
                  <Btn label={lang === 'en' ? "Cancel" : "Cancelar"} onPress={() => setAdding(false)} ghost style={{ flex:1 }} />
                  <Btn label={lang === 'en' ? "Save" : "Guardar"} onPress={() => {
                    if (!form.source || !form.amount) return;
                    let monthlyAmount = +form.amount;
                    if (form.type === "fijo") {
                      if (form.frequency === "quincenal") monthlyAmount = (+form.amount) * 2;
                      if (form.frequency === "semanal") monthlyAmount = (+form.amount) * 4;
                    }
                    const updated = [...list, { id:Date.now(), source:form.source, amount:+form.amount,
                      date:new Date().toISOString().split("T")[0], type:form.type, 
                      frequency: form.type === "fijo" ? form.frequency : "variable",
                      payDays: form.type === "fijo" ? form.payDays : [],
                      monthlyAmount: monthlyAmount
                    }];
                    setList(updated); onSave(updated);
                    setForm({ source:"", amount:"", type:"fijo", frequency: "mensual", payDays: [30] }); setAdding(false);
                  }} style={{ flex:2 }} />
                </View>
              </View>
            ) : <Btn label={lang === 'en' ? "+ Add income" : "+ Agregar ingreso"} onPress={() => setAdding(true)} ghost />}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
