import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { money, nlp } from "../utils/formatters";
import { lifeHours, calcRunway } from "../utils/finance";
import { styles } from "../components/base";
import { PremiumModal } from "../components/PremiumModal";
import { BlurView } from "expo-blur";

const AI_QUERY_KEY = "@fynx_ai_queries";
const FREE_LIMIT   = 5; // 5 consultas gratuitas por mes
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyBrhr4u7crhCBHvjHn_iobXwL43LOcM4qs";

const TypeWriterText = ({ text, style, isNew }) => {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 10); // Velocidad rápida
    return () => clearInterval(interval);
  }, [text, isNew]);

  return (
    <Text style={style}>
      {displayedText}
      {isNew && displayedText.length < text.length ? <Text style={{ color:C.mint }}> █</Text> : ""}
    </Text>
  );
};

export function ChatScreen() {
  const { appState, derived, addExpenseWithStreak } = useFinance();
  const { t, lang } = useLanguage();
  const { user={}, income=[], debts=[], budgets=[], goals=[], expenses:allExp=[] } = appState || {};
  const { balance=0, totalInc=0, totalExp=0 } = derived;
  const cur = user.currency || "RD$";

  const buildContext = () => {
    const ct = {};
    allExp.forEach(e => { ct[e.cat] = (ct[e.cat]||0) + e.amount; });
    const runway  = calcRunway(balance, allExp);
    const savePct = totalInc > 0 ? Math.round((balance/totalInc)*100) : 0;
    const debtInt = debts.reduce((a,d) => a+(d.balance*d.rate/100/12), 0);
    const dateString = lang === 'en' ? new Date().toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long"}) : new Date().toLocaleDateString("es-DO",{weekday:"long",day:"numeric",month:"long"});
    return lang === 'en' 
      ? `You are TARS, ${user.name}'s elite financial advisor.
Currency: ${cur}. Date: ${dateString}.
Balance: ${money(balance,cur)} | Income: ${money(totalInc,cur)} | Expenses: ${money(totalExp,cur)} | Savings: ${savePct}%
Runway: ${runway??"N/A"} days | Interest/mo: ${money(Math.round(debtInt),cur)}
Categories: ${JSON.stringify(ct)}
Debts: ${debts.map(d=>`${d.name}: ${money(d.balance,cur)} at ${d.rate}%`).join(", ")||"none"}
Goals: ${goals?.map(g=>`${g.name}: ${Math.round((g.saved/g.target)*100)}%`).join(", ")||"none"}
RULES: Respond in a colloquial, friendly but professional English tone. Max 3 short paragraphs. If a luxury expense >$2000 in Leisure, mention working hours. If runway<30 days, warn. Be brutally honest but motivating.`
      : `Eres TARS, asesor financiero de élite de ${user.name} en República Dominicana.
Moneda: ${cur}. Fecha: ${dateString}.
Balance: ${money(balance,cur)} | Ingresos: ${money(totalInc,cur)} | Gastos: ${money(totalExp,cur)} | Ahorro: ${savePct}%
Runway: ${runway??"N/A"} días | Intereses/mes: ${money(Math.round(debtInt),cur)}
Categorías: ${JSON.stringify(ct)}
Deudas: ${debts.map(d=>`${d.name}: ${money(d.balance,cur)} al ${d.rate}%`).join(", ")||"ninguna"}
Metas: ${goals?.map(g=>`${g.name}: ${Math.round((g.saved/g.target)*100)}%`).join(", ")||"ninguna"}
REGLAS: Responde en español dominicano coloquial. Máximo 3 párrafos cortos. Si gasto de lujo >RD$2000 en Ocio, menciona horas de trabajo. Si runway<30 días, advierte. Sé brutalmente honesto pero motivador.`;
  };

  const WELCOME = lang === 'en' 
    ? `Hello, ${user.name||""}. I am TARS.\n\nBalance: ${money(balance,cur)}\nSavings: ${totalInc>0?Math.round((balance/totalInc)*100):0}%\n\nI can help you with:\n• "I spent 800 on gas"\n• "How much have I spent on food?"\n• "Analyze my finances"`
    : `Buenas, ${user.name||""}. Soy TARS.\n\nBalance: ${money(balance,cur)}\nAhorro: ${totalInc>0?Math.round((balance/totalInc)*100):0}%\n\nPuedo ayudarte con:\n• "Gasté 800 en gasolina"\n• "¿Cuánto llevo en comida?"\n• "Analiza mis finanzas"`;

  // Marcar el welcome como viejo para que no se anime cada vez que montas
  const [msgs,    setMsgs]    = useState([{ bot:true, text:WELCOME, isNew:false }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCount, setAiCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const scroll = useRef(null);
  const premium = appState?.user?.premium || false;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AI_QUERY_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const currentMonth = new Date().toISOString().slice(0, 7);
          if (data.month === currentMonth) {
            setAiCount(data.count);
          } else {
            await AsyncStorage.setItem(AI_QUERY_KEY, JSON.stringify({ count: 0, month: currentMonth }));
          }
        }
      } catch(e) { /* ignore */ }
    })();
  }, []);

  const incrementAiCount = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const next = aiCount + 1;
    setAiCount(next);
    await AsyncStorage.setItem(AI_QUERY_KEY, JSON.stringify({ count: next, month: currentMonth }));
  };

  const canUseAI = premium || aiCount < FREE_LIMIT;

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMsgs(m => [...m, { bot:false, text:msg }]);
    setLoading(true);
    const low    = msg.toLowerCase();
    const parsed = nlp(msg);
    const isEntry = /gast[eé]|pagu[eé]|compr[eé]|sali[oó]/.test(low);

    if (isEntry && parsed.amount) {
      const newE = { id:Date.now(), desc:parsed.desc, amount:parsed.amount, cat:parsed.cat, date:parsed.date };
      addExpenseWithStreak(newE);
      const hours    = lifeHours(parsed.amount, totalInc);
      const hoursMsg = hours && hours >= 2 ? `\n\n[INFO]: Equivale a ${hours}h de trabajo.` : "";
      const budLim   = budgets[parsed.cat];
      const spent    = allExp.filter(e=>e.cat===parsed.cat).reduce((a,e)=>a+e.amount,0)+parsed.amount;
      const budMsg   = budLim ? `\n[PRESUPUESTO]: ${parsed.cat}: ${money(spent,cur)} / ${money(budLim,cur)}` : "";
      setLoading(false);
      setMsgs(m => [...m, { bot:true, text:`<REGISTRO CONFIRMADO>\n\n${parsed.desc}\nMONTO: ${money(parsed.amount,cur)}\nCAT: ${parsed.cat}${hoursMsg}${budMsg}`, isNew:true }]);
      return;
    }

    const catMatch = Object.keys(budgets).find(k => low.includes(k.toLowerCase()));
    if (/cuánto|cuanto|llevo|gast[eé] en|total/.test(low) && catMatch) {
      const spent = allExp.filter(e=>e.cat===catMatch).reduce((a,e)=>a+e.amount,0);
      const bud   = budgets[catMatch];
      const pct   = bud ? Math.round((spent/bud)*100) : null;
      setLoading(false);
      setMsgs(m => [...m, { bot:true, text:`<CONSULTA DE CATEGORÍA: ${catMatch}>\n\nGastado: ${money(spent,cur)}${bud?`\nLímite: ${money(bud,cur)} (${pct}%)`:""}\n\nESTADO: ${pct>90?"CRÍTICO. Casi al límite.":pct>70?"ADVERTENCIA. Vigila el gasto.":"ESTABLE. Dentro del presupuesto."}`, isNew:true }]);
      return;
    }

    if (!premium) await incrementAiCount();

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ 
          systemInstruction: { parts: [{ text: buildContext() }] },
          contents: [{ parts: [{ text: msg }] }] 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: Sin respuesta.";
      setMsgs(m => [...m, { bot:true, text:reply, isNew:true }]);
    } catch (err) {
      const savePct = totalInc>0 ? Math.round((balance/totalInc)*100) : 0;
      const runway  = calcRunway(balance, allExp);
      let fallback  = "<SISTEMA OFFLINE>\nConexión a servidor TARS interrumpida.\n\n";
      if (/analiza|resumen|cómo estoy|como estoy/.test(low)) {
        fallback += `BALANCE ACTUAL: ${money(balance,cur)}\nTASA DE AHORRO: ${savePct}%${runway?`\nRUNWAY: ${runway} días`:""}\n`;
        fallback += savePct>=20 ? "\nESTADO: Óptimo." : "\nESTADO: Crítico. Ahorro bajo.";
      } else if (parsed.amount) {
        const hours = lifeHours(parsed.amount, totalInc);
        fallback += hours ? `${money(parsed.amount,cur)} equivale a ${hours}h de tu vida.\nRequiere autorización mental.` : "IA desactivada. Agrega API key.";
      } else {
        fallback += `Inyecta API key de Gemini en el archivo .env para restaurar enlace IA.\n\nDETALLE DEL ERROR: ${err.message}`;
      }
      setMsgs(m => [...m, { bot:true, text:fallback, isNew:true }]);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#000" }}>
      {/* HEADER TERMINAL */}
      <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between",
        paddingHorizontal:16, paddingTop:12, paddingBottom:10, borderBottomWidth:1, borderBottomColor:C.gold+"20" }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
          <View style={{ width:8, height:8, borderRadius:4, backgroundColor:C.mint, shadowColor:C.mint, shadowOpacity:0.8, shadowRadius:4, shadowOffset:{width:0,height:0} }} />
          <View>
            <Text style={{ fontSize:9, color:C.mint, letterSpacing:3, fontWeight:"800", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>TARS.SYS</Text>
            <Text style={{ fontSize:15, fontWeight:"900", color:C.t1, letterSpacing:1 }}>
              CORE <Text style={{ color:C.gold }}>AI</Text>
            </Text>
          </View>
        </View>
        <View style={{ flexDirection:"row", gap:8, alignItems:"center" }}>
          {!premium && (
            <View style={{ backgroundColor:"rgba(0,0,0,0.5)", borderRadius:4, borderWidth:1, borderColor:C.gold+"40", paddingHorizontal:8, paddingVertical:4 }}>
              <Text style={{ fontSize:9, fontWeight:"700", color:C.gold, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>[{Math.max(FREE_LIMIT - aiCount, 0)}/{FREE_LIMIT}] FR</Text>
            </View>
          )}
          <View style={{ backgroundColor:"transparent", borderBottomWidth:1, borderBottomColor:C.mint, paddingHorizontal:4, paddingVertical:4 }}>
            <Text style={{ fontSize:11, fontWeight:"800", color:C.mint, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>BAL: {money(balance,cur)}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={90}>
        <ScrollView ref={scroll} style={{ flex:1 }} contentContainerStyle={{ padding:14, paddingBottom:20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated:true })}>
          
          <Text style={{ fontSize:10, color:C.t3, textAlign:"center", marginBottom:20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            {"=== SECURE CONNECTION ESTABLISHED ==="}
          </Text>

          {msgs.map((m, i) => (
            <View key={i} style={{ marginBottom:16, alignItems:m.bot?"flex-start":"flex-end" }}>
              {m.bot ? (
                <View style={{ width:"90%", paddingLeft:12, borderLeftWidth:2, borderLeftColor:C.mint }}>
                  <Text style={{ fontSize:9, color:C.mint, marginBottom:4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight:"700", letterSpacing:1 }}>TARS //</Text>
                  <TypeWriterText isNew={m.isNew} text={m.text} style={{ fontSize:13, color:C.t2, lineHeight:22, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} />
                </View>
              ) : (
                <View style={{ maxWidth:"80%", padding:12, borderRadius:8, backgroundColor:"rgba(255,255,255,0.05)", borderWidth:1, borderColor:"rgba(255,255,255,0.1)" }}>
                  <Text style={{ fontSize:13, color:C.t1, lineHeight:20 }}>{m.text}</Text>
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={{ width:"90%", paddingLeft:12, borderLeftWidth:2, borderLeftColor:C.mint, marginTop:10 }}>
              <Text style={{ fontSize:9, color:C.mint, marginBottom:4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight:"700", letterSpacing:1 }}>TARS //</Text>
              <Text style={{ fontSize:13, color:C.mint, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>_processing<Text style={{opacity:0.5}}>...</Text></Text>
            </View>
          )}
        </ScrollView>

        {/* CHIP SUGERENCIAS */}
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal:14 }}>
            {(lang === 'en' 
              ? ["Analyze my finances", "How much have I spent on food?", "Tips to save money", "How are my debts?"]
              : ["Analiza mis finanzas", "¿Cuánto llevo en comida?", "Consejo para ahorrar", "¿Cómo están mis deudas?"]
            ).map((s, idx) => (
              <TouchableOpacity key={s} onPress={() => setInput(s)}
                style={{ marginRight: 10, paddingHorizontal:14, paddingVertical:10, backgroundColor:"rgba(0,0,0,0.6)", borderRadius:8, borderWidth:1, borderColor:C.gold+"40" }}>
                <Text style={{ fontSize:12, color:C.gold, fontWeight:"700", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{">"} {s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!canUseAI ? (
          /* Paywall — límite de consultas alcanzado */
          <View style={{ padding:16, paddingBottom:24, backgroundColor:"#000", borderTopWidth:1, borderTopColor:C.gold+"30" }}>
            <View style={{ backgroundColor:"rgba(201,168,76,0.1)", borderRadius:8, borderWidth:1, borderColor:C.gold+"50", padding:18, alignItems:"center" }}>
              <Text style={{ fontSize:12, fontWeight:"800", color:C.gold, marginBottom:6, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing:1 }}>[ ERROR: ACCESS_DENIED ]</Text>
              <Text style={{ fontSize:11, color:C.t2, textAlign:"center", lineHeight:18, marginBottom:16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {lang === 'en' ? `Free queries exhausted (${FREE_LIMIT}/${FREE_LIMIT}).\nElite authorization required to continue link.` : `Consultas gratuitas agotadas (${FREE_LIMIT}/${FREE_LIMIT}).\nAutorización Elite requerida para continuar enlace.`}
              </Text>
              <TouchableOpacity onPress={() => setShowPremium(true)}
                style={{ backgroundColor:C.gold, borderRadius:4, paddingVertical:10, paddingHorizontal:24 }}>
                <Text style={{ fontSize:12, fontWeight:"900", color:"#000", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{lang === 'en' ? "INITIATE OVERRIDE (PREMIUM)" : "INICIAR OVERRIDE (PREMIUM)"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection:"row", gap:10, padding:14, paddingBottom:24, backgroundColor:"#000", borderTopWidth:1, borderTopColor:C.border2 }}>
            <View style={{ flex:1, backgroundColor:"rgba(255,255,255,0.05)", borderRadius:6, borderWidth:1, borderColor:C.mint+"40", flexDirection:"row", alignItems:"center", paddingHorizontal:12 }}>
              <Text style={{ color:C.mint, fontWeight:"900", marginRight:8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{">"}</Text>
              <TextInput style={{ flex:1, height:46, color:C.t1, fontSize:13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                placeholder={lang === 'en' ? "Enter command or expense..." : "Ingresa comando o gasto..."}
                placeholderTextColor={C.t4} value={input} onChangeText={setInput}
                onSubmitEditing={send} returnKeyType="send" />
            </View>
            <TouchableOpacity onPress={send} disabled={loading}
              style={{ width:46, height:46, backgroundColor:loading?C.t4:"rgba(0,0,0,0.8)", borderRadius:6, borderWidth:1, borderColor:loading?C.t4:C.mint, alignItems:"center", justifyContent:"center" }}>
              <Ionicons name="send" size={16} color={loading?"#000":C.mint} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          if (success) {
            updateState({ user: { ...user, premium: true } });
          }
          setShowPremium(false);
        }}
      />
    </SafeAreaView>
  );
}
