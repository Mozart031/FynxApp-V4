import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "../context/FinanceContext";
import { C } from "../constants/themes";
import { ICON } from "../constants";
import { money, nlp } from "../utils/formatters";
import { lifeHours, calcRunway } from "../utils/finance";
import { styles } from "../components/base";
import { PremiumModal } from "../components/PremiumModal";

const AI_QUERY_KEY = "@fynx_ai_queries";
const FREE_LIMIT   = 3;

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || "";

export function ChatScreen() {
  const { appState, derived, addExpenseWithStreak } = useFinance();
  const { user={}, income=[], debts=[], budgets={}, goals=[], expenses:allExp=[] } = appState || {};
  const { balance=0, totalInc=0, totalExp=0 } = derived;
  const cur = user.currency || "RD$";

  const buildContext = () => {
    const ct = {};
    allExp.forEach(e => { ct[e.cat] = (ct[e.cat]||0) + e.amount; });
    const runway  = calcRunway(balance, allExp);
    const savePct = totalInc > 0 ? Math.round((balance/totalInc)*100) : 0;
    const debtInt = debts.reduce((a,d) => a+(d.balance*d.rate/100/12), 0);
    return `Eres TARS, asesor financiero de élite de ${user.name} en República Dominicana.
Moneda: ${cur}. Fecha: ${new Date().toLocaleDateString("es-DO",{weekday:"long",day:"numeric",month:"long"})}.
Balance: ${money(balance,cur)} | Ingresos: ${money(totalInc,cur)} | Gastos: ${money(totalExp,cur)} | Ahorro: ${savePct}%
Runway: ${runway??"N/A"} días | Intereses/mes: ${money(Math.round(debtInt),cur)}
Categorías: ${JSON.stringify(ct)}
Deudas: ${debts.map(d=>`${d.name}: ${money(d.balance,cur)} al ${d.rate}%`).join(", ")||"ninguna"}
Metas: ${goals?.map(g=>`${g.name}: ${Math.round((g.saved/g.target)*100)}%`).join(", ")||"ninguna"}
REGLAS: Responde en español dominicano coloquial. Máximo 3 párrafos cortos. Si gasto de lujo >RD$2000 en Ocio, menciona horas de trabajo. Si runway<30 días, advierte. Sé brutalmente honesto pero motivador.`;
  };

  const WELCOME = `Buenas, ${user.name||""}. Soy TARS.\n\nBalance: ${money(balance,cur)}\nAhorro: ${totalInc>0?Math.round((balance/totalInc)*100):0}%\n\nPuedo ayudarte con:\n• "Gasté 800 en gasolina"\n• "¿Cuánto llevo en comida?"\n• "Analiza mis finanzas"`;

  const [msgs,    setMsgs]    = useState([{ bot:true, text:WELCOME }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCount, setAiCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const scroll = useRef(null);
  const premium = appState?.user?.premium || false;

  // Cargar contador de consultas IA al montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AI_QUERY_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const currentMonth = new Date().toISOString().slice(0, 7);
          // Reset mensual
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
      const hoursMsg = hours && hours >= 2 ? `\n${ICON.run} Eso equivale a ${hours}h de trabajo.` : "";
      const budLim   = budgets[parsed.cat];
      const spent    = allExp.filter(e=>e.cat===parsed.cat).reduce((a,e)=>a+e.amount,0)+parsed.amount;
      const budMsg   = budLim ? `\n${ICON.chart} ${parsed.cat}: ${money(spent,cur)} de ${money(budLim,cur)}` : "";
      setLoading(false);
      setMsgs(m => [...m, { bot:true, text:`Registrado.\n\n${parsed.desc}\n${money(parsed.amount,cur)} · ${parsed.cat} · ${parsed.date}${hoursMsg}${budMsg}` }]);
      return;
    }

    const catMatch = Object.keys(budgets).find(k => low.includes(k.toLowerCase()));
    if (/cuánto|cuanto|llevo|gast[eé] en|total/.test(low) && catMatch) {
      const spent = allExp.filter(e=>e.cat===catMatch).reduce((a,e)=>a+e.amount,0);
      const bud   = budgets[catMatch];
      const pct   = bud ? Math.round((spent/bud)*100) : null;
      setLoading(false);
      setMsgs(m => [...m, { bot:true, text:`${catMatch} este mes:\n\n${money(spent,cur)} gastados${bud?` de ${money(bud,cur)} (${pct}%)`:""}\n\n${pct>90?"Casi al límite.":pct>70?"Vigila el gasto.":"Dentro del presupuesto."}` }]);
      return;
    }

    // Contar el intento de consulta IA (gratis o API)
    if (!premium) await incrementAiCount();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":API_KEY, "anthropic-version":"2023-06-01" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, system:buildContext(), messages:[{ role:"user", content:msg }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setMsgs(m => [...m, { bot:true, text:data.content?.[0]?.text||"Sin respuesta." }]);
    } catch {
      const savePct = totalInc>0 ? Math.round((balance/totalInc)*100) : 0;
      const runway  = calcRunway(balance, allExp);
      let fallback  = "TARS sin conexión.\n\n";
      if (/analiza|resumen|cómo estoy|como estoy/.test(low)) {
        fallback += `Balance: ${money(balance,cur)}\nAhorro: ${savePct}%${runway?`\nRunway: ${runway} días`:""}\n`;
        fallback += savePct>=20 ? "\nVas excelente." : "\nAhorro bajo. Revisa Ocio.";
      } else if (parsed.amount) {
        const hours = lifeHours(parsed.amount, totalInc);
        fallback += hours ? `${money(parsed.amount,cur)} = ${hours}h de trabajo.\n¿Vale ${hours} horas de tu vida?` : "Agrega tu API key para respuestas completas.";
      } else {
        fallback += "Agrega tu API key de console.anthropic.com para activar la IA.";
      }
      setMsgs(m => [...m, { bot:true, text:fallback }]);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between",
        paddingHorizontal:16, paddingTop:12, paddingBottom:10, borderBottomWidth:1, borderBottomColor:C.border }}>
        <View>
          <Text style={{ fontSize:9, color:C.t3, letterSpacing:2.5, fontWeight:"700" }}>ASISTENTE</Text>
          <Text style={{ fontSize:19, fontWeight:"900", color:C.t1, letterSpacing:-0.4 }}>
            TARS <Text style={{ color:C.mint }}>IA</Text>
          </Text>
        </View>
        <View style={{ flexDirection:"row", gap:8, alignItems:"center" }}>
          {!premium && (
            <View style={{ backgroundColor:C.goldBg, borderRadius:8, borderWidth:1, borderColor:C.gold+"40", paddingHorizontal:8, paddingVertical:4 }}>
              <Text style={{ fontSize:10, fontWeight:"700", color:C.gold }}>{Math.max(FREE_LIMIT - aiCount, 0)}/{FREE_LIMIT} gratis</Text>
            </View>
          )}
          <View style={{ backgroundColor:C.mintBg2, borderRadius:10, borderWidth:1, borderColor:C.mint+"40", paddingHorizontal:10, paddingVertical:6 }}>
            <Text style={{ fontSize:12, fontWeight:"700", color:C.mint }}>{money(balance,cur)}</Text>
            <Text style={{ fontSize:9, color:C.t3, textAlign:"center" }}>disponible</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={90}>
        <ScrollView ref={scroll} style={{ flex:1 }} contentContainerStyle={{ padding:14, paddingBottom:16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated:true })}>
          {msgs.map((m, i) => (
            <View key={i} style={{ marginBottom:10, alignItems:m.bot?"flex-start":"flex-end" }}>
              {m.bot ? (
                <View style={{ flexDirection:"row", alignItems:"flex-end", gap:8 }}>
                  <View style={{ width:26, height:26, borderRadius:8, backgroundColor:C.mintBg2,
                    borderWidth:1, borderColor:C.mint+"40", alignItems:"center", justifyContent:"center", marginBottom:2 }}>
                    <Ionicons name={ICON.ai} size={14} color={C.mint} />
                  </View>
                  <View style={{ maxWidth:"80%", padding:12, borderRadius:16, borderBottomLeftRadius:4,
                    backgroundColor:C.card, borderWidth:1, borderColor:C.border2 }}>
                    <Text style={{ fontSize:13, color:C.t1, lineHeight:21 }}>{m.text}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ maxWidth:"80%", padding:12, borderRadius:16, borderBottomRightRadius:4, backgroundColor:C.mint }}>
                  <Text style={{ fontSize:13, color:"#000", lineHeight:21, fontWeight:"600" }}>{m.text}</Text>
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 }}>
              <View style={{ width:26, height:26, borderRadius:8, backgroundColor:C.mintBg2, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name={ICON.ai} size={14} color={C.mint} />
              </View>
              <View style={{ backgroundColor:C.card, borderRadius:12, borderWidth:1, borderColor:C.border2, padding:12, flexDirection:"row", gap:5 }}>
                {[0,1,2].map(j => <View key={j} style={{ width:6, height:6, borderRadius:3, backgroundColor:C.mint, opacity:0.5 }} />)}
              </View>
            </View>
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal:14, paddingBottom:6, maxHeight:44 }}>
          <View style={{ flexDirection:"row", gap:8 }}>
            {["Analiza mis finanzas","¿Cuánto llevo en comida?","Consejo para ahorrar","¿Cómo están mis deudas?"].map(s => (
              <TouchableOpacity key={s} onPress={() => setInput(s)}
                style={{ paddingHorizontal:12, paddingVertical:7, backgroundColor:C.card2, borderRadius:10, borderWidth:1, borderColor:C.border2 }}>
                <Text style={{ fontSize:11, color:C.t2, fontWeight:"600" }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {!canUseAI ? (
          /* Paywall — límite de consultas alcanzado */
          <View style={{ padding:14, paddingBottom:20, backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.border }}>
            <View style={{ backgroundColor:C.goldBg2, borderRadius:16, borderWidth:1.5, borderColor:C.gold+"50", padding:18, alignItems:"center" }}>
              <Ionicons name="diamond" size={24} color={C.gold} style={{ marginBottom:8 }} />
              <Text style={{ fontSize:14, fontWeight:"800", color:C.gold, marginBottom:6 }}>Consultas agotadas</Text>
              <Text style={{ fontSize:12, color:C.t2, textAlign:"center", lineHeight:18, marginBottom:14 }}>
                Has usado tus {FREE_LIMIT} consultas gratuitas este mes.{"\n"}Desbloquea consultas ilimitadas con Premium.
              </Text>
              <TouchableOpacity onPress={() => setShowPremium(true)}
                style={{ backgroundColor:C.gold, borderRadius:12, paddingVertical:12, paddingHorizontal:28,
                  shadowColor:C.gold, shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:10 }}>
                <Text style={{ fontSize:13, fontWeight:"900", color:"#000" }}>Desbloquear TARS IA</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection:"row", gap:10, padding:14, paddingBottom:20,
            backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.border }}>
            <TextInput style={[styles.input, { flex:1, marginBottom:0, backgroundColor:C.card2, borderColor:C.border2, color:C.t1 }]}
              placeholder="Escribe un gasto o pregunta a TARS..."
              placeholderTextColor={C.t3} value={input} onChangeText={setInput}
              onSubmitEditing={send} returnKeyType="send" multiline maxHeight={90} />
            <TouchableOpacity onPress={send} disabled={loading}
              style={{ width:46, height:46, backgroundColor:loading?C.t4:C.mint, borderRadius:13,
                alignItems:"center", justifyContent:"center",
                shadowColor:C.mint, shadowOffset:{width:0,height:3}, shadowOpacity:0.35, shadowRadius:8 }}>
              <Ionicons name={ICON.income} size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onSuscribir={(plan, success) => {
          setShowPremium(false);
          if (success) {
            // Premium activado — reset no necesario, canUseAI será true
          }
        }}
      />
    </SafeAreaView>
  );
}
