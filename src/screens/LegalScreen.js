/**
 * FYNX — Pantalla legal
 * Términos y Condiciones + Política de Privacidad
 * Requerido por Google Play Store
 */
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { C } from "../constants/themes";

const TABS = ["Términos", "Privacidad"];

export function LegalScreen({ onClose }) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState(0);
  const contenido = tab === 0 ? (t.legal?.terminos || []) : (t.legal?.privacidad || []);
  const TABS = lang === 'en' ? ["Terms", "Privacy"] : ["Términos", "Privacidad"];

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={{
        flexDirection:"row", alignItems:"center", justifyContent:"space-between",
        paddingHorizontal:20, paddingTop:52, paddingBottom:16,
        borderBottomWidth:1, borderBottomColor:C.border,
      }}>
        <Text style={{ fontSize:18, fontWeight:"700", color:C.t1 }}>
          {tab === 0 ? (lang === 'en' ? "Terms and Conditions" : "Términos y Condiciones") : (lang === 'en' ? "Privacy Policy" : "Política de Privacidad")}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}
            style={{ width:34, height:34, borderRadius:10, backgroundColor:C.card2,
              alignItems:"center", justifyContent:"center" }}>
            <Text style={{ fontSize:16, color:C.t2, fontWeight:"700" }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:"row", paddingHorizontal:20, paddingVertical:12, gap:10 }}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} onPress={() => setTab(i)}
            style={{
              flex:1, paddingVertical:10, borderRadius:12, alignItems:"center",
              backgroundColor: tab === i ? C.mint : C.card2,
              borderWidth:1, borderColor: tab === i ? C.mint : C.border,
            }}>
            <Text style={{ fontSize:13, fontWeight:"700",
              color: tab === i ? "#000" : C.t3 }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:20, paddingBottom:40 }}
      >
        <View style={{
          backgroundColor:C.card2, borderRadius:14, borderWidth:1,
          borderColor:C.border, padding:16, marginBottom:20,
        }}>
          <Text style={{ fontSize:13, fontWeight:"700", color:C.mint, marginBottom:6 }}>
            {tab === 0 ? (lang === 'en' ? "Fynx — Terms of Use" : "Fynx — Términos de Uso") : (lang === 'en' ? "Fynx — Data Privacy" : "Fynx — Privacidad de datos")}
          </Text>
          <Text style={{ fontSize:12, color:C.t3, lineHeight:19 }}>
            {tab === 0
              ? (lang === 'en' ? "Please read these terms carefully before using the app. By using Fynx, you agree to be bound by these terms." : "Lea estos términos detenidamente antes de utilizar la aplicación. Al usar Fynx, acepta estar sujeto a estos términos.")
              : (lang === 'en' ? "Your privacy is critical to us. This document explains how we collect, use, and protect your information." : "Su privacidad es fundamental para nosotros. Este documento explica cómo recopilamos, usamos y protegemos su información.")}
          </Text>
        </View>

        {/* Secciones */}
        {contenido.map((s, i) => (
          <View key={i} style={{ marginBottom:16 }}>
            <Text style={{ fontSize:13, fontWeight:"800", color:C.t1, marginBottom:8 }}>
              {s.titulo}
            </Text>
            <Text style={{ fontSize:12, color:C.t2, lineHeight:20 }}>
              {s.cuerpo}
            </Text>
            {i < contenido.length - 1 && (
              <View style={{ height:1, backgroundColor:C.border, marginTop:16 }} />
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={{ marginTop:16, padding:16, backgroundColor:C.card2,
          borderRadius:14, borderWidth:1, borderColor:C.border, alignItems:"center" }}>
          <Text style={{ fontSize:11, color:C.t3, textAlign:"center", lineHeight:18 }}>
            Fynx v1.0.0 — com.fynx.app{"\n"}
            © 2026 Fynx. {lang === 'en' ? "All rights reserved." : "Todos los derechos reservados."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
