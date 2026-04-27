import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { ICON, CATS } from "../constants";
import { Btn, Input, Toggle, CatIcon, styles } from "../components/base";

export function SettingsModal({ onClose }) {
  const { appState, updateState, isDark, toggleTheme, frenoState, toggleFreno } = useFinance();
  const { user={}, income=[], budgets={} } = appState || {};
  const cur      = user.currency || "RD$";
  const totalInc = income.reduce((a,i) => a+i.amount, 0);
  const [name,       setName]       = useState(user.name || "");
  const [salary,     setSalary]     = useState(totalInc > 0 ? String(totalInc) : "");
  const [savingGoal, setSavingGoal] = useState(String(user.savingGoalPct || 20));
  const [buds,       setBuds]       = useState({ ...budgets });

  function save() {
    const newInc = +salary > 0
      ? [{ id:1, source:"Salario", amount:+salary, date:new Date().toISOString().split("T")[0], type:"fijo" }]
      : income;
    updateState({ user:{ ...user, name:name.trim()||user.name, savingGoalPct:+savingGoal||20 }, income:newInc, budgets:buds });
    onClose();
  }

  return (
    <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"#000000CC", justifyContent:"flex-end" }}>
      <View style={{ backgroundColor:C.card, borderTopLeftRadius:24, borderTopRightRadius:24,
        borderWidth:1, borderColor:C.border, maxHeight:"92%" }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
          padding:18, borderBottomWidth:1, borderBottomColor:C.border }}>
          <Text style={{ fontSize:17, fontWeight:"900", color:C.t1 }}>Configuración</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize:20, color:C.t3, fontWeight:"700" }}>{ICON.close}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding:18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* TEMA */}
          <Text style={[styles.lbl, { color:C.t3, marginBottom:10 }]}>APARIENCIA</Text>
          <View style={{ flexDirection:"row", gap:10, marginBottom:20 }}>
            {[[true,ICON.star,"Oscuro"],[false,ICON.chart,"Claro"]].map(([dark,ic,label]) => (
              <TouchableOpacity key={label} onPress={() => toggleTheme(dark)}
                style={{ flex:1, paddingVertical:14, borderRadius:14, borderWidth:2, alignItems:"center", gap:6,
                  borderColor: isDark===dark?C.mint:C.border, backgroundColor:isDark===dark?C.mintBg2:C.card2 }}>
                <Text style={{ fontSize:22, color:isDark===dark?C.mint:C.t3, fontWeight:"900" }}>{ic}</Text>
                <Text style={{ fontSize:12, fontWeight:"800", color:isDark===dark?C.mint:C.t3 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FRENO */}
          <Text style={[styles.lbl, { color:C.t3, marginBottom:10 }]}>FRENO DE EMERGENCIA</Text>
          <View style={{ backgroundColor:frenoState.active?C.roseBg2:C.card2, borderRadius:16, borderWidth:1,
            borderColor:frenoState.active?C.rose+"50":C.border2, padding:16, marginBottom:20 }}>
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <View style={{ flex:1, marginRight:12 }}>
                <Text style={{ fontSize:13, fontWeight:"800", color:frenoState.active?C.rose:C.t1 }}>
                  {ICON.lock} Bloqueo de 48 horas
                </Text>
                <Text style={{ fontSize:11, color:C.t3, marginTop:3, lineHeight:16 }}>
                  {frenoState.active
                    ? `Activo — ${frenoState.hoursLeft}h restantes. Ocio deshabilitado.`
                    : "Deshabilita Ocio por 48h cuando gastes de más."}
                </Text>
              </View>
              <Toggle value={frenoState.active} onToggle={toggleFreno} color={C.rose} />
            </View>
            {frenoState.active && (
              <View style={{ backgroundColor:C.rose+"18", borderRadius:10, padding:10, marginTop:4 }}>
                <Text style={{ fontSize:11, color:C.rose, fontWeight:"700" }}>
                  {ICON.alert} Categorías bloqueadas: Ocio
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.lbl, { color:C.t3, marginBottom:6 }]}>NOMBRE</Text>
          <Input value={name} onChange={setName} placeholder="Tu nombre" />

          <Text style={[styles.lbl, { color:C.t3, marginTop:12, marginBottom:6 }]}>INGRESO MENSUAL ({cur})</Text>
          <Input value={salary} onChange={setSalary} placeholder="Ej.: 45000" numeric />

          <Text style={[styles.lbl, { color:C.t3, marginTop:12, marginBottom:6 }]}>META DE AHORRO (%)</Text>
          <View style={{ flexDirection:"row", gap:8, marginBottom:18 }}>
            {["10","20","30","40","50"].map(p => (
              <TouchableOpacity key={p} onPress={() => setSavingGoal(p)}
                style={{ flex:1, paddingVertical:10, borderRadius:11, borderWidth:1.5, alignItems:"center",
                  borderColor:savingGoal===p?C.mint:C.border, backgroundColor:savingGoal===p?C.mintBg:C.card2 }}>
                <Text style={{ fontSize:12, fontWeight:"800", color:savingGoal===p?C.mint:C.t3 }}>{p}%</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.lbl, { color:C.t3, marginBottom:10 }]}>LÍMITES DE PRESUPUESTO</Text>
          {Object.keys(CATS).slice(0,6).map(cat => (
            <View key={cat} style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 }}>
              <CatIcon cat={cat} size={34} />
              <View style={{ flex:1 }}>
                <Input value={buds[cat]?String(buds[cat]):""} onChange={v => setBuds({ ...buds, [cat]:+v||0 })}
                  placeholder={`${cat} (0 = sin límite)`} numeric style={{ marginBottom:0 }} />
              </View>
            </View>
          ))}

          <Btn label="Guardar cambios" onPress={save} style={{ marginTop:12, marginBottom:34 }} />
        </ScrollView>
      </View>
    </View>
  );
}
