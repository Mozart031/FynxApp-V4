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

const TERMINOS = [
  {
    titulo: "1. Aceptación de los términos",
    cuerpo: "Al descargar, instalar o utilizar la aplicación Fynx, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.",
  },
  {
    titulo: "2. Descripción del servicio",
    cuerpo: "Fynx es una aplicación de gestión financiera personal que permite registrar ingresos, gastos, metas de ahorro y analizar hábitos financieros mediante un sistema de puntuación adaptativo. La aplicación opera tanto en modo local como con sincronización en la nube a través de Firebase.",
  },
  {
    titulo: "3. Cuenta de usuario",
    cuerpo: "Para acceder a las funciones de sincronización en la nube, debe crear una cuenta con un correo electrónico válido y una contraseña. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta.",
  },
  {
    titulo: "4. Uso aceptable",
    cuerpo: "Usted se compromete a utilizar Fynx únicamente para fines personales y legítimos de gestión financiera. Queda prohibido el uso de la aplicación para actividades fraudulentas, ilegales o que perjudiquen a terceros.",
  },
  {
    titulo: "5. Datos financieros",
    cuerpo: "Los datos financieros que ingrese en Fynx son de su exclusiva propiedad. Fynx no comparte, vende ni utiliza sus datos financieros con fines comerciales. La información se almacena localmente y, si opta por la sincronización, en servidores seguros de Firebase (Google).",
  },
  {
    titulo: "6. Plan Premium",
    cuerpo: "Fynx ofrece una suscripción Premium con funcionalidades adicionales, incluyendo eliminación de publicidad, exportación de reportes PDF y herramientas avanzadas de predicción. La suscripción se renueva automáticamente salvo que sea cancelada con al menos 24 horas de anticipación al período de renovación.",
  },
  {
    titulo: "7. Limitación de responsabilidad",
    cuerpo: "Fynx es una herramienta de apoyo a la gestión financiera personal. Las recomendaciones generadas por la aplicación son orientativas y no constituyen asesoramiento financiero profesional. Fynx no se responsabiliza por decisiones financieras tomadas con base en la información proporcionada por la aplicación.",
  },
  {
    titulo: "8. Modificaciones",
    cuerpo: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación. El uso continuado de Fynx tras la publicación de cambios constituye su aceptación de los nuevos términos.",
  },
  {
    titulo: "9. Contacto",
    cuerpo: "Para consultas relacionadas con estos términos, puede contactarnos a través de: soporte@fynxelite.app",
  },
];

const PRIVACIDAD = [
  {
    titulo: "1. Información que recopilamos",
    cuerpo: "Fynx recopila la siguiente información: (a) Datos de cuenta: correo electrónico y contraseña cifrada para autenticación. (b) Datos financieros: transacciones, ingresos, gastos, metas y presupuestos que usted ingrese voluntariamente. (c) Datos de uso: métricas anónimas de rendimiento de la aplicación.",
  },
  {
    titulo: "2. Cómo usamos su información",
    cuerpo: "Utilizamos su información exclusivamente para: proporcionar y mejorar el servicio de Fynx, sincronizar sus datos entre dispositivos, calcular su Score Fynx y generar reportes financieros personalizados. No vendemos ni compartimos su información personal con terceros con fines publicitarios.",
  },
  {
    titulo: "3. Firebase y Google",
    cuerpo: "Fynx utiliza Firebase (Google LLC) para autenticación y almacenamiento en la nube. Google procesa los datos de acuerdo con su Política de Privacidad. Los datos se almacenan en servidores ubicados en Estados Unidos con cifrado en tránsito y en reposo.",
  },
  {
    titulo: "4. Almacenamiento local",
    cuerpo: "La mayoría de sus datos financieros se almacenan localmente en su dispositivo mediante AsyncStorage. Si desinstala la aplicación, estos datos se eliminarán permanentemente del dispositivo. Los datos sincronizados en la nube permanecen hasta que solicite su eliminación.",
  },
  {
    titulo: "5. Seguridad",
    cuerpo: "Implementamos medidas técnicas y organizativas para proteger su información: cifrado de contraseñas, comunicaciones HTTPS, autenticación Firebase y, opcionalmente, acceso biométrico. Sin embargo, ningún sistema de seguridad es infalible.",
  },
  {
    titulo: "6. Sus derechos",
    cuerpo: "Usted tiene derecho a: acceder a sus datos personales, corregir información inexacta, solicitar la eliminación de su cuenta y datos asociados, exportar su historial financiero (función Premium) y retirar su consentimiento para el procesamiento de datos en cualquier momento.",
  },
  {
    titulo: "7. Menores de edad",
    cuerpo: "Fynx no está dirigida a menores de 16 años. No recopilamos conscientemente información de menores. Si detectamos que hemos recopilado datos de un menor, procederemos a eliminarlos de forma inmediata.",
  },
  {
    titulo: "8. Cambios en la política",
    cuerpo: "Notificaremos cualquier cambio significativo en esta política a través de la aplicación con al menos 30 días de anticipación. El uso continuado del servicio implica la aceptación de la política actualizada.",
  },
  {
    titulo: "9. Contacto",
    cuerpo: "Para ejercer sus derechos o realizar consultas sobre privacidad: privacidad@fynxelite.app\n\nÚltima actualización: abril 2026",
  },
];

export function LegalScreen({ onClose }) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState(0);
  const contenido = tab === 0 ? TERMINOS : PRIVACIDAD;
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
