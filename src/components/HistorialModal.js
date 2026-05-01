import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import { useEliteAlert } from "../context/AlertContext";
import { C } from "../constants/themes";
import { ICON, CATS } from "../constants";
import { money } from "../utils/formatters";
import { CatIcon, Tag } from "./base";

export function HistorialModal({ visible, onClose, expenses, onDelete, cur }) {
  const { lang } = useLanguage();
  const { showAlert } = useEliteAlert();
  const [filterCat, setFilterCat] = useState(lang === 'en' ? "All" : "Todos");
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue:0, tension:60, friction:12, useNativeDriver:true }).start();
    else Animated.timing(slideAnim, { toValue:600, duration:220, useNativeDriver:true }).start();
  }, [visible]);

  if (!visible) return null;
  const cats     = [lang === 'en' ? "All" : "Todos", ...Object.keys(CATS)];
  const filtered = (filterCat === "Todos" || filterCat === "All") ? expenses : expenses.filter(e => e.cat === filterCat);
  const total    = filtered.reduce((a, e) => a + e.amount, 0);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"#000000CC" }}>
        <Animated.View style={{ flex:1, marginTop:60, backgroundColor:C.bg,
          borderTopLeftRadius:26, borderTopRightRadius:26,
          borderWidth:1, borderColor:C.border2, transform:[{ translateY:slideAnim }] }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
            padding:18, borderBottomWidth:1, borderBottomColor:C.border }}>
            <View>
              <Text style={{ fontSize:18, fontWeight:"900", color:C.t1 }}>{lang === 'en' ? "History" : "Historial"}</Text>
              <Text style={{ fontSize:11, color:C.t3, marginTop:2 }}>{filtered.length} {lang === 'en' ? "transactions" : "movimientos"} · {money(total, cur)}</Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ width:34, height:34, borderRadius:11, backgroundColor:C.card2, alignItems:"center", justifyContent:"center" }}>
              <Ionicons name={ICON.close} size={20} color={C.t2} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal:16, paddingVertical:10, maxHeight:50 }}>
            <View style={{ flexDirection:"row", gap:8 }}>
              {cats.map(c => {
                const info = CATS[c]; const active = filterCat === c; const col = info?.color || C.mint;
                return (
                  <TouchableOpacity key={c} onPress={() => setFilterCat(c)}
                    style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:10, borderWidth:1.5,
                      borderColor: active ? col : C.border, backgroundColor: active ? col+"22" : C.card2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      {info && <Ionicons name={info.icon} size={12} color={active ? col : C.t3} />}
                      <Text style={{ fontSize:11, fontWeight:"700", color: active ? col : C.t3 }}>
                        {c}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
            {filtered.length === 0 ? (
              <View style={{ alignItems:"center", paddingVertical:48 }}>
                <Ionicons name={ICON.chart} size={40} color={C.t3} style={{ marginBottom:12 }} />
                <Text style={{ fontSize:14, color:C.t3 }}>{lang === 'en' ? "No records" : "Sin registros"}</Text>
              </View>
            ) : filtered.map((e, i) => {
              const info = CATS[e.cat] || CATS["Otro"];
              return (
                <View key={e.id}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:10 }}>
                    <CatIcon cat={e.cat} size={42} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:13, fontWeight:"700", color:C.t1 }} numberOfLines={1}>{e.desc}</Text>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:2 }}>
                        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:info.color }} />
                        <Text style={{ fontSize:10, color:C.t3 }}>{e.cat} · {e.date}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize:13, fontWeight:"800", color:C.rose }}>-{money(e.amount, cur)}</Text>
                    <TouchableOpacity onPress={() => showAlert(lang === 'en' ? "Delete" : "Eliminar", lang === 'en' ? `Delete "${e.desc}"?` : `¿Eliminar "${e.desc}"?`, [
                      { text: lang === 'en' ? "Cancel" : "Cancelar", style:"cancel" },
                      { text: lang === 'en' ? "Delete" : "Eliminar", style:"destructive", onPress:() => onDelete(e.id) },
                    ], "warning")} style={{ padding:8 }}>
                      <Ionicons name={ICON.close} size={20} color={C.t4} />
                    </TouchableOpacity>
                  </View>
                  {i < filtered.length - 1 && <View style={{ height:1, backgroundColor:C.border, marginLeft:54 }} />}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
