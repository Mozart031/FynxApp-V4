import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Animated } from "react-native";
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
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { useFirstVisit } from "../hooks/useFirstVisit";
import { VoiceConfirmCard } from "../components/VoiceConfirmCard";

const AI_QUERY_KEY = "@fynx_ai_queries";
const FREE_LIMIT   = 3; // 3 consultas gratuitas de prueba
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

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
  const { appState, derived, addExpenseWithStreak, updateState } = useFinance();
  const { t, lang } = useLanguage();
  const { user={}, income=[], debts=[], budgets=[], goals=[], expenses:allExp=[] } = appState || {};
  const { balance=0, totalInc=0, totalExp=0 } = derived;
  const cur = user.currency || "RD$";

  const buildContext = () => {
    const ct = {};
    allExp.forEach(e => { ct[e.cat] = (ct[e.cat]||0) + e.amount; });
    const runway  = calcRunway(balance, allExp);
    const savePct = totalInc > 0 ? Math.round((balance/totalInc)*100) : 0;
    const debtInt = debts.reduce((a,d) => a + (d.balance * d.rate / 100 / 12), 0);
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

  const [msgs,    setMsgs]    = useState([{ bot:true, text:WELCOME, isNew:false }]);
  const [pendingVoice, setPendingVoice] = useState(null); // datos de voz pendientes de confirmación
  const [isOnline, setIsOnline] = useState(true);
  const { isRecording, isProcessing, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const { isFirstVisit, markVisited } = useFirstVisit("chat");
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setMsgs(prev => {
      const newMsgs = [...prev];
      newMsgs[0] = { bot: true, text: WELCOME, isNew: false };
      return newMsgs;
    });
  }, [lang, balance, totalInc]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCount, setAiCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const scroll = useRef(null);
  const premium = appState?.user?.premium || false;

  // Detectar conectividad al montar
  useEffect(() => {
    fetch("https://www.google.com", { method: "HEAD", cache: "no-cache" })
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));
  }, []);

  // Animación pulsante del mic cuando está grabando
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.stopAnimation();
      micPulse.setValue(1);
    }
  }, [isRecording]);

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

  // ── VOICE: grabar, transcribir y analizar con Gemini ─────────────────────
  const handleVoicePress = async () => {
    if (!canUseAI) { setShowPremium(true); return; }
    if (isRecording) {
      const base64 = await stopRecording();
      if (!base64) return;
      setLoading(true);
      const promptVoz = lang === "en"
        ? `You are TARS. The user recorded an audio note about a financial transaction.
Analyze it and return ONLY a valid JSON object (no markdown, no backticks) with these fields:
{
  "type": "expense" or "income",
  "desc": "short description",
  "amount": numeric value (no currency symbols),
  "category": one of [Food, Transport, Services, Health, Education, Entertainment, Clothing, Leisure, Others],
  "transcription": "exact transcription of what the user said"
}
If the audio is inaudible or unrelated to finances, return: {"error": "unrecognized"}`
        : `Eres TARS. El usuario grabó una nota de voz sobre una transacción financiera.
Analízala y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin backticks) con estos campos:
{
  "type": "gasto" o "ingreso",
  "desc": "descripción corta",
  "amount": valor numérico (sin símbolos de moneda),
  "category": una de [Comida, Transporte, Servicios, Salud, Educación, Entretenimiento, Ropa, Ocio, Otros],
  "transcription": "transcripción exacta de lo que dijo el usuario"
}
Si el audio es inaudible o no está relacionado con finanzas, devuelve: {"error": "no_reconocido"}`;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptVoz },
                { inlineData: { mimeType: "audio/mp4", data: base64 } }
              ]
            }]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Limpiar posibles backticks que Gemini a veces añade
        const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.error) {
          setMsgs(m => [...m, { bot:true, text: lang === "en" ? "I couldn't understand the audio. Please try again." : "No pude entender el audio. Intenta de nuevo.", isNew:true }]);
        } else {
          setPendingVoice(parsed);
          setMsgs(m => [...m, { bot:true, text: "__VOICE_CONFIRM__", isNew:false, voiceData: parsed }]);
        }
      } catch (e) {
        setMsgs(m => [...m, { bot:true, text: lang === "en" ? `<VOICE ERROR>\n${e.message}` : `<ERROR DE VOZ>\n${e.message}`, isNew:true }]);
      }
      setLoading(false);
    } else {
      await startRecording();
    }
  };

  const handleVoiceConfirm = ({ type, desc, amount, category }) => {
    const date = new Date().toISOString().split("T")[0];
    if (type === "gasto" || type === "expense") {
      addExpenseWithStreak({ id:Date.now(), desc, amount, cat: category, date });
    } else {
      updateState({ income: [...(appState.income||[]), { id:Date.now(), source:desc, amount, type:"variable", date }] });
    }
    const label = (type === "gasto" || type === "expense")
      ? (lang === "en" ? "expense" : "gasto")
      : (lang === "en" ? "income" : "ingreso");
    setMsgs(m => m.map(msg =>
      msg.voiceData === pendingVoice
        ? { bot:true, text: lang === "en" ? `✅ ${label.charAt(0).toUpperCase()+label.slice(1)} saved: ${cur}${amount.toLocaleString()}` : `✅ ${label.charAt(0).toUpperCase()+label.slice(1)} guardado: ${cur}${amount.toLocaleString()}`, isNew:true }
        : msg
    ));
    setPendingVoice(null);
  };

  const handleVoiceCancel = () => {
    setMsgs(m => m.filter(msg => msg.text !== "__VOICE_CONFIRM__"));
    setPendingVoice(null);
  };


  return (
    <SafeAreaView edges={["top"]} style={{ flex:1, backgroundColor:"#000" }}>
      {/* BANNER OFFLINE */}
      {!isOnline && (
        <View style={{ backgroundColor:"#2A1800", borderBottomWidth:1, borderBottomColor:"#F59E0B40", paddingHorizontal:16, paddingVertical:8, flexDirection:"row", alignItems:"center", gap:8 }}>
          <Ionicons name="flash-outline" size={14} color="#F59E0B" />
          <Text style={{ fontSize:11, color:"#F59E0B", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight:"600" }}>
            {lang === 'en' ? "TARS in local mode — basic responses available" : "TARS en modo local — respuestas básicas disponibles"}
          </Text>
        </View>
      )}
      {/* BANNER PRIMERA VISITA */}
      {isFirstVisit && (
        <TouchableOpacity onPress={markVisited}
          style={{ backgroundColor:C.mint+"12", borderBottomWidth:1, borderBottomColor:C.mint+"30", paddingHorizontal:16, paddingVertical:10, flexDirection:"row", alignItems:"center", gap:10 }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.mint} />
          <Text style={{ flex:1, fontSize:12, color:C.mint, lineHeight:18 }}>
            {lang === 'en'
              ? "Talk to TARS in natural language. Try: 'Analyze my finances' or tap the mic to record a transaction."
              : "Habla con TARS en lenguaje natural. Prueba: 'Analiza mis finanzas' o toca el mic para registrar una transacción."}
          </Text>
          <Ionicons name="close-outline" size={18} color={C.mint} />
        </TouchableOpacity>
      )}
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

      <KeyboardAvoidingView 
        style={{ flex:1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <ScrollView ref={scroll} style={{ flex:1 }} contentContainerStyle={{ padding:14, paddingBottom:20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated:true })}>
          
          <Text style={{ fontSize:10, color:C.t3, textAlign:"center", marginBottom:20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            {"=== SECURE CONNECTION ESTABLISHED ==="}
          </Text>

          {msgs.map((m, i) => {
            const screenW = Dimensions.get('window').width;
            // Card de confirmación de voz
            if (m.text === "__VOICE_CONFIRM__" && m.voiceData) {
              return (
                <View key={i} style={{ marginBottom:16 }}>
                  <VoiceConfirmCard
                    parsed={m.voiceData}
                    cur={cur}
                    lang={lang}
                    onConfirm={handleVoiceConfirm}
                    onCancel={handleVoiceCancel}
                  />
                </View>
              );
            }
            return (
              <View key={i} style={{ marginBottom:16 }}>
                {m.bot ? (
                  <View style={{ width:"90%", paddingLeft:12, borderLeftWidth:2, borderLeftColor:C.mint }}>
                    <Text style={{ fontSize:9, color:C.mint, marginBottom:4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight:"700", letterSpacing:1 }}>TARS //</Text>
                    <TypeWriterText isNew={m.isNew} text={m.text} style={{ fontSize:13, color:C.t2, lineHeight:22, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} />
                  </View>
                ) : (
                  <View style={{ alignSelf:"flex-end", width: Math.min(screenW * 0.78, 320), padding:12, borderRadius:8, backgroundColor:"rgba(255,255,255,0.05)", borderWidth:1, borderColor:"rgba(255,255,255,0.1)" }}>
                    <Text style={{ fontSize:13, color:C.t1, lineHeight:20 }}>{m.text}</Text>
                  </View>
                )}
              </View>
            );
          })}
          {loading && (
            <View style={{ width:"90%", paddingLeft:12, borderLeftWidth:2, borderLeftColor:C.mint, marginTop:10 }}>
              <Text style={{ fontSize:9, color:C.mint, marginBottom:4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight:"700", letterSpacing:1 }}>TARS //</Text>
              <Text style={{ fontSize:13, color:C.mint, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>_processing<Text style={{opacity:0.5}}>...</Text></Text>
            </View>
          )}
        </ScrollView>

        {/* EMPY STATE / SUGERENCIAS */}
        {msgs.length === 1 && (
          <View style={{ paddingHorizontal: 20, marginTop: 40, alignItems: "center" }}>
            <Ionicons name="hardware-chip-outline" size={32} color={C.gold+"60"} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 13, color: C.t3, textAlign: "center", marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
              {lang === 'en' ? 'TARS SYSTEM READY.\nSELECT A COMMAND TO INITIATE:' : 'SISTEMA TARS LISTO.\nSELECCIONA UN COMANDO PARA INICIAR:'}
            </Text>
            
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {(lang === 'en' 
                ? [
                    { t: "Analyze my finances", i: "analytics-outline" },
                    { t: "How much have I spent on food?", i: "fast-food-outline" },
                    { t: "Tips to save money", i: "bulb-outline" },
                    { t: "How are my debts?", i: "card-outline" }
                  ]
                : [
                    { t: "Analiza mis finanzas", i: "analytics-outline" },
                    { t: "¿Cuánto llevo en comida?", i: "fast-food-outline" },
                    { t: "Consejo para ahorrar", i: "bulb-outline" },
                    { t: "¿Cómo están mis deudas?", i: "card-outline" }
                  ]
              ).map((s, idx) => (
                <TouchableOpacity key={s.t} onPress={() => setInput(s.t)}
                  style={{ width: "45%", padding: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: C.gold+"30", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={s.i} size={18} color={C.gold} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 11, color: C.gold, textAlign: "center", fontWeight: "700" }}>{s.t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!canUseAI && (
          /* Paywall banner — NO reemplaza el input, se muestra encima */
          <View style={{ paddingHorizontal:16, paddingTop:12, backgroundColor:"#000", borderTopWidth:1, borderTopColor:C.gold+"30" }}>
            <View style={{ backgroundColor:"rgba(201,168,76,0.08)", borderRadius:8, borderWidth:1, borderColor:C.gold+"50", padding:14, flexDirection:"row", alignItems:"center", gap:12 }}>
              <Ionicons name="lock-closed" size={18} color={C.gold} />
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:11, fontWeight:"800", color:C.gold, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing:1 }}>[ ACCESS_DENIED ]</Text>
                <Text style={{ fontSize:10, color:C.t3, marginTop:2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {lang === 'en' ? `${FREE_LIMIT}/${FREE_LIMIT} free queries used.` : `${FREE_LIMIT}/${FREE_LIMIT} consultas gratuitas usadas.`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPremium(true)}
                style={{ backgroundColor:C.gold, borderRadius:6, paddingVertical:8, paddingHorizontal:12 }}>
                <Text style={{ fontSize:10, fontWeight:"900", color:"#000", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>ELITE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input + Mic — altura FIJA siempre para evitar bug de salto */}
        <View style={{ flexDirection:"row", gap:8, padding:14, paddingBottom:10, backgroundColor:"#000", borderTopWidth: canUseAI ? 1 : 0, borderTopColor:C.border2, opacity: canUseAI ? 1 : 0.3 }}>
          <View style={{ flex:1, backgroundColor:"rgba(255,255,255,0.05)", borderRadius:6, borderWidth:1, borderColor:C.mint+"40", flexDirection:"row", alignItems:"center", paddingHorizontal:12 }}>
            <Text style={{ color:C.mint, fontWeight:"900", marginRight:8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{">"}</Text>
            <TextInput style={{ flex:1, height:46, color:C.t1, fontSize:13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              placeholder={lang === 'en' ? "Enter command or expense..." : "Ingresa comando o gasto..."}
              placeholderTextColor={C.t4} value={input} onChangeText={setInput}
              onSubmitEditing={canUseAI ? send : undefined} returnKeyType="send"
              editable={canUseAI && !isRecording} />
          </View>

          {/* Botón de micrófono */}
          <Animated.View style={{ transform:[{ scale: micPulse }] }}>
            <TouchableOpacity
              onPress={handleVoicePress}
              disabled={isProcessing || loading}
              style={{
                width:46, height:46, borderRadius:6,
                backgroundColor: isRecording ? C.rose : "rgba(0,0,0,0.8)",
                borderWidth:1, borderColor: isRecording ? C.rose : C.mint+"80",
                alignItems:"center", justifyContent:"center",
              }}>
              <Ionicons
                name={isRecording ? "stop" : isProcessing ? "hourglass-outline" : "mic-outline"}
                size={18}
                color={isRecording ? "#fff" : isProcessing ? C.t3 : C.mint}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Botón de envío de texto */}
          <TouchableOpacity onPress={canUseAI ? send : () => setShowPremium(true)} disabled={loading || isRecording}
            style={{ width:46, height:46, backgroundColor:loading?C.t4:"rgba(0,0,0,0.8)", borderRadius:6, borderWidth:1, borderColor:loading?C.t4:canUseAI?C.mint:C.gold, alignItems:"center", justifyContent:"center" }}>
            <Ionicons name={canUseAI ? "send" : "lock-closed"} size={16} color={loading?"#000":canUseAI?C.mint:C.gold} />
          </TouchableOpacity>
        </View>
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
