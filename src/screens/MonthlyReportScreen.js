import React, { useMemo, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions,
  StyleSheet, Animated, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useFinance } from "../context/FinanceContext";
import { useLanguage } from "../context/LanguageContext";
import { CATS, DEBT_TYPES } from "../constants";
import { money } from "../utils/formatters";
import { C, F } from "../constants/themes";

const { width } = Dimensions.get("window");
const MONTH_NAMES = {
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};

// ── Micro components ─────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color = C.gold }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 20 }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + "20", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "40" }}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={{ fontFamily: F.monoB, fontSize: 10, color, letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value, sub, color = C.t1 }) {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2, letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontFamily: F.monoB, fontSize: 16, color, letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2, marginTop: 3 }}>{sub}</Text> : null}
    </View>
  );
}

function ProgressBar({ pct, color, height = 6, bgColor = "rgba(255,255,255,0.06)" }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: bgColor, overflow: "hidden" }}>
      <View style={{ width: `${clamped}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

function BudgetRow({ cat, spent, budget, cur, lang }) {
  const info = CATS[cat] || { icon: "cube-outline", color: C.t2, label: { es: cat, en: cat } };
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const over = spent > budget && budget > 0;
  const color = over ? "#FF4D6D" : pct > 75 ? "#F5B800" : info.color;

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: info.color + "20", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={info.icon} size={11} color={info.color} />
          </View>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }}>{info.label[lang] || cat}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: F.monoB, fontSize: 12, color }}>
            {money(spent, cur)}
          </Text>
          {budget > 0 && (
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>
              / {money(budget, cur)} · {Math.round(pct)}%
            </Text>
          )}
        </View>
      </View>
      {budget > 0 && <ProgressBar pct={pct} color={color} />}
    </View>
  );
}

function ExpenseRow({ item, cur, lang }) {
  const info = CATS[item.cat] || { icon: "cube-outline", color: C.t2, label: { es: item.cat, en: item.cat } };
  const d = new Date(item.date || item.createdAt);
  const dateStr = isNaN(d) ? "" : `${d.getDate()}/${d.getMonth() + 1}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.04)" }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: info.color + "18", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Ionicons name={info.icon} size={13} color={info.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }} numberOfLines={1}>{item.desc || item.name || info.label[lang]}</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>{dateStr} · {info.label[lang] || item.cat}</Text>
      </View>
      <Text style={{ fontFamily: F.monoB, fontSize: 12, color: "#FF4D6D" }}>-{money(item.amount, cur)}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function MonthlyReportScreen({ onClose }) {
  const { appState, derived, T } = useFinance();
  const { lang } = useLanguage();
  const TH = T || C;

  const { expenses = [], income = [], budgets = {}, user = {}, goals = [], debts = [], reminders = [] } = appState || {};
  const { totalInc = 0, totalExp = 0, savePct = 0, sc = 0 } = derived || {};
  const cur = user.currency || "RD$";
  const balance = totalInc - totalExp;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const monthLabel = MONTH_NAMES[lang]?.[now.getMonth()] || "";

  // Filter current month
  const monthExp = useMemo(() =>
    expenses.filter(e => (e.date || e.createdAt || "").startsWith(currentMonth)),
    [expenses, currentMonth]
  );
  const monthInc = useMemo(() =>
    income.filter(i => (i.date || i.createdAt || "").startsWith(currentMonth)),
    [income, currentMonth]
  );

  // Category totals
  const catTotals = useMemo(() => {
    const ct = {};
    monthExp.forEach(e => { ct[e.cat] = (ct[e.cat] || 0) + e.amount; });
    return ct;
  }, [monthExp]);

  // Sorted by amount desc for recent
  const recentExp = useMemo(() => [...monthExp].sort((a, b) => {
    const da = new Date(b.date || b.createdAt || 0);
    const db = new Date(a.date || a.createdAt || 0);
    return da - db;
  }).slice(0, 12), [monthExp]);

  const budgetCats = useMemo(() =>
    Object.keys({ ...catTotals, ...budgets })
      .sort((a, b) => (catTotals[b] || 0) - (catTotals[a] || 0)),
    [catTotals, budgets]
  );

  const scoreColor = sc >= 80 ? C.gold : sc >= 60 ? "#00E5B0" : sc >= 40 ? "#F5B800" : "#FF4D6D";
  const balanceColor = balance >= 0 ? "#00E5B0" : "#FF4D6D";

  const totalDebt = (debts || []).reduce((a, d) => a + (d.balance || d.monto || 0), 0);
  const totalGoalSaved = (goals || []).reduce((a, g) => a + (g.saved || 0), 0);
  const totalGoalTarget = (goals || []).reduce((a, g) => a + (g.target || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
          <View>
            <Text style={{ fontFamily: F.monoB, fontSize: 10, color: C.gold, letterSpacing: 2 }}>
              {lang === "en" ? "MONTHLY REPORT" : "REPORTE MENSUAL"}
            </Text>
            <Text style={{ fontFamily: F.monoB, fontSize: 20, color: C.t1, letterSpacing: -0.5, marginTop: 2 }}>
              {monthLabel} {now.getFullYear()}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={18} color={C.t3} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>

        {/* ── RESUMEN GENERAL ─────────────────────────────────────── */}
        <SectionHeader icon="pulse-outline" label={lang === "en" ? "OVERVIEW" : "RESUMEN GENERAL"} color={C.gold} />

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <StatCard label={lang === "en" ? "INCOME" : "INGRESOS"} value={money(totalInc, cur)} color="#00E5B0" />
          <StatCard label={lang === "en" ? "EXPENSES" : "GASTOS"} value={money(totalExp, cur)} color="#FF4D6D" />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
          <StatCard
            label={lang === "en" ? "BALANCE" : "BALANCE"}
            value={money(Math.abs(balance), cur)}
            sub={balance >= 0 ? (lang === "en" ? "▲ Positive" : "▲ Positivo") : (lang === "en" ? "▼ Deficit" : "▼ Déficit")}
            color={balanceColor}
          />
          <StatCard
            label={lang === "en" ? "SAVED" : "AHORRADO"}
            value={`${Math.round(Math.max(0, savePct))}%`}
            sub={lang === "en" ? "of income" : "del ingreso"}
            color={savePct >= 20 ? "#00E5B0" : savePct >= 10 ? "#F5B800" : "#FF4D6D"}
          />
        </View>

        {/* Score bar */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14, marginTop: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2, letterSpacing: 1 }}>
              {lang === "en" ? "FINANCIAL HEALTH SCORE" : "SCORE DE SALUD FINANCIERA"}
            </Text>
            <Text style={{ fontFamily: F.monoB, fontSize: 18, color: scoreColor }}>{sc}</Text>
          </View>
          <ProgressBar pct={sc} color={scoreColor} height={8} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            {[0, 40, 70, 85, 100].map(v => (
              <Text key={v} style={{ fontFamily: F.mono, fontSize: 8, color: C.t2 }}>{v}</Text>
            ))}
          </View>
        </View>

        {/* ── PRESUPUESTO vs GASTO ─────────────────────────────────── */}
        <SectionHeader icon="bar-chart-outline" label={lang === "en" ? "BUDGET VS ACTUAL" : "PRESUPUESTO VS GASTO"} color="#38BDF8" />

        {budgetCats.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Ionicons name="calculator-outline" size={28} color={C.t2} />
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t2, marginTop: 8, textAlign: "center" }}>
              {lang === "en" ? "No budget configured. Set budgets in Strategy." : "Sin presupuesto configurado. Configura presupuestos en Estrategia."}
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
            {budgetCats.map(cat => (
              <BudgetRow
                key={cat}
                cat={cat}
                spent={catTotals[cat] || 0}
                budget={budgets[cat] || 0}
                cur={cur}
                lang={lang}
              />
            ))}
          </View>
        )}

        {/* ── INGRESOS ─────────────────────────────────────────────── */}
        <SectionHeader icon="trending-up-outline" label={lang === "en" ? "INCOME SOURCES" : "FUENTES DE INGRESO"} color="#00E5B0" />

        <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
          {monthInc.length === 0 ? (
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t2, textAlign: "center", paddingVertical: 8 }}>
              {lang === "en" ? "No income logged this month." : "Sin ingresos registrados este mes."}
            </Text>
          ) : monthInc.map((inc, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: i < monthInc.length - 1 ? 1 : 0, borderColor: "rgba(255,255,255,0.04)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#00E5B020", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="cash-outline" size={13} color="#00E5B0" />
                </View>
                <View>
                  <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }}>{inc.source || inc.name || (lang === "en" ? "Income" : "Ingreso")}</Text>
                  <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>{inc.type || (lang === "en" ? "Fixed" : "Fijo")}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: F.monoB, fontSize: 13, color: "#00E5B0" }}>+{money(inc.amount, cur)}</Text>
            </View>
          ))}
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)", flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: F.monoB, fontSize: 10, color: C.t2, letterSpacing: 1 }}>TOTAL</Text>
            <Text style={{ fontFamily: F.monoB, fontSize: 14, color: "#00E5B0" }}>{money(totalInc, cur)}</Text>
          </View>
        </View>

        {/* ── METAS DE AHORRO ──────────────────────────────────────── */}
        {goals.length > 0 && (
          <>
            <SectionHeader icon="flag-outline" label={lang === "en" ? "SAVINGS GOALS" : "METAS DE AHORRO"} color={C.gold} />
            <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
              {goals.map((g, i) => {
                const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
                return (
                  <View key={i} style={{ marginBottom: i < goals.length - 1 ? 16 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }}>{g.name}</Text>
                      <Text style={{ fontFamily: F.monoB, fontSize: 11, color: C.gold }}>{Math.round(Math.min(pct, 100))}%</Text>
                    </View>
                    <ProgressBar pct={pct} color={C.gold} height={7} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>{money(g.saved || 0, cur)}</Text>
                      <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>{money(g.target || 0, cur)}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: F.monoB, fontSize: 10, color: C.t2, letterSpacing: 1 }}>TOTAL</Text>
                <Text style={{ fontFamily: F.monoB, fontSize: 13, color: C.gold }}>{money(totalGoalSaved, cur)} / {money(totalGoalTarget, cur)}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── DEUDAS ───────────────────────────────────────────────── */}
        {debts.length > 0 && (
          <>
            <SectionHeader icon="card-outline" label={lang === "en" ? "DEBTS" : "DEUDAS"} color="#FF4D6D" />
            <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
              {debts.map((d, i) => {
                const info = DEBT_TYPES.find(x => x.id === d.type) || DEBT_TYPES[5];
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: i < debts.length - 1 ? 1 : 0, borderColor: "rgba(255,255,255,0.04)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: info.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={info.icon} size={13} color={info.color} />
                      </View>
                      <View>
                        <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }}>{d.name}</Text>
                        <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>
                          {d.rate ? `${d.rate}% · ` : ""}{info.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: F.monoB, fontSize: 12, color: "#FF4D6D" }}>{money(d.balance || d.monto || 0, cur)}</Text>
                  </View>
                );
              })}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: F.monoB, fontSize: 10, color: C.t2, letterSpacing: 1 }}>TOTAL</Text>
                <Text style={{ fontFamily: F.monoB, fontSize: 13, color: "#FF4D6D" }}>{money(totalDebt, cur)}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── PAGOS FIJOS ──────────────────────────────────────────── */}
        {reminders.length > 0 && (
          <>
            <SectionHeader icon="calendar-outline" label={lang === "en" ? "FIXED PAYMENTS" : "PAGOS FIJOS"} color="#A78BFA" />
            <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 }}>
              {reminders.filter(r => r.active).map((r, i, arr) => {
                const paid = r.paidMonth === currentMonth;
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderColor: "rgba(255,255,255,0.04)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: paid ? "#00E5B020" : "#A78BFA20", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={paid ? "checkmark-circle" : "time-outline"} size={13} color={paid ? "#00E5B0" : "#A78BFA"} />
                      </View>
                      <View>
                        <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t1 }}>{r.name}</Text>
                        <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2 }}>
                          {lang === "en" ? "Day" : "Día"} {r.day} · {paid ? (lang === "en" ? "Paid" : "Pagado") : (lang === "en" ? "Pending" : "Pendiente")}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: F.monoB, fontSize: 12, color: paid ? "#00E5B0" : "#A78BFA" }}>
                      {money(r.amount || 0, cur)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── MOVIMIENTOS DEL MES ──────────────────────────────────── */}
        <SectionHeader icon="receipt-outline" label={lang === "en" ? "TRANSACTIONS" : "MOVIMIENTOS DEL MES"} color={C.t2} />
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.t2, marginBottom: 10, marginTop: -8 }}>
          {monthExp.length} {lang === "en" ? "expenses this month" : "gastos registrados este mes"}
        </Text>

        <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8 }}>
          {recentExp.length === 0 ? (
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.t2, textAlign: "center", paddingVertical: 16 }}>
              {lang === "en" ? "No expenses recorded." : "Sin gastos registrados."}
            </Text>
          ) : recentExp.map((item, i) => (
            <ExpenseRow key={i} item={item} cur={cur} lang={lang} />
          ))}
        </View>

        {/* Footer note */}
        <View style={{ marginTop: 20, padding: 14, backgroundColor: C.gold + "08", borderRadius: 14, borderWidth: 1, borderColor: C.gold + "20", flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <Ionicons name="hardware-chip-outline" size={16} color={C.gold} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontFamily: F.sans, fontSize: 12, color: C.t2, lineHeight: 18 }}>
            {lang === "en"
              ? "This report updates in real time with each transaction you log. The more you register, the more accurate your analysis."
              : "Este reporte se actualiza en tiempo real con cada movimiento que registras. Cuanto más registres, más preciso es el análisis."}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
