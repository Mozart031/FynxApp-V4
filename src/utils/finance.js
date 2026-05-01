import { DAY, DAYS_IN_MONTH } from "./formatters";

// ── lastNDays — PRD fix: siempre retorna array válido ────────────────────────
export function lastNDays(n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// ── Score con multiplicador adaptativo (PRD v4.0) ────────────────────────────
export function score(expenses, income, budgets, streakDays = [], history = []) {
  const exp  = (expenses || []).reduce((a, e) => a + e.amount, 0);
  const save = income > 0 ? ((income - exp) / income) * 100 : 0;
  
  const ct   = {};
  (expenses || []).forEach(e => { 
    const key = e.category || e.cat; 
    if (key) ct[key] = (ct[key] || 0) + e.amount; 
  });
  
  const cats = Object.entries(budgets || {});
  const over = cats.filter(([k, l]) => l > 0 && (ct[k] || 0) > l).length;

  // Disciplina financiera: bono si 7 días consecutivos de racha
  const streak = calcStreak(streakDays || []);
  const disciplinaBonus = streak >= 7 ? 10 : streak >= 3 ? 5 : 0;

  // Aprendizaje adaptativo: bono si redujo gastos variables 2 semanas
  const reduccionBonus = _calcReduccionBonus(history);

  // Optimización de evaluación: 
  // - Ahorro: penalización extrema si se gasta más de lo que se ingresa (ahorro negativo)
  // - Presupuesto: si no tiene presupuestos, sufre penalidad (incentivo Elite)
  const scoreAhorro = exp > income ? 0 : Math.min(100, Math.max(0, save * 2.5));
  const scorePresupuesto = cats.length === 0 ? 50 : Math.max(0, 100 - (over / cats.length) * 100);

  const s = {
    ahorro:       scoreAhorro,
    presupuesto:  scorePresupuesto,
    consistencia: Math.min(100, ((expenses || []).length / 15) * 100),
    deuda:        85,
  };

  const base  = Math.round(s.ahorro * .4 + s.presupuesto * .3 + s.consistencia * .2 + s.deuda * .1);
  const total = Math.min(100, base + disciplinaBonus + reduccionBonus);

  const grade = total >= 85 ? { label: "Excelente", color: "#10B981", icon: "star" }
              : total >= 70 ? { label: "Bueno",     color: "#00E5B0", icon: "checkmark-circle" }
              : total >= 50 ? { label: "Regular",   color: "#D4AF37", icon: "warning" }
              :               { label: "Crítico",   color: "#FF4D6D", icon: "alert-circle" };

  return { total, s, grade, disciplinaBonus, reduccionBonus };
}

// Analiza historial: ¿redujo gastos variables 2 semanas consecutivas?
function _calcReduccionBonus(history) {
  if (!history || history.length < 2) return 0;
  try {
    const VARIABLES = ["Ocio", "Entretenimiento", "Ropa", "Salidas"];
    const semanas = history.slice(-2);
    const [anterior, actual] = semanas.map(s =>
      (s.expenses || [])
        .filter(e => VARIABLES.includes(e.category || e.cat))
        .reduce((a, e) => a + e.amount, 0)
    );
    return anterior > 0 && actual < anterior ? 5 : 0;
  } catch { return 0; }
}

// ── Predictor Avanzado: Modelo predictivo de Fin de Mes ───────────────────
export function predictMonthEnd(appState) {
  const { expenses = [], income = [], reminders = [] } = appState || {};
  const currentMonth = new Date().toISOString().slice(0,7);
  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
  
  const totalInc = income.reduce((a, i) => a + i.amount, 0);
  if (totalInc <= 0) return { balEOM: 0, dailyAvg: 0, runOut: null, pctSpent: 0, projected: 0 };

  const reminderTitles = reminders.map(r => (r.name || r.title || "").toLowerCase());
  const fixedExpenses = currentMonthExpenses.filter(e => 
    reminderTitles.includes((e.name||e.title||"").toLowerCase()) || 
    e.amount > totalInc * 0.25 // Pagos extremadamente grandes asumen ser fijos
  );
  const variableExpenses = currentMonthExpenses.filter(e => !fixedExpenses.includes(e));

  const totalFixedPaid = fixedExpenses.reduce((a, e) => a + e.amount, 0);
  const totalVarPaid = variableExpenses.reduce((a, e) => a + e.amount, 0);
  
  const pendingReminders = reminders.filter(r => r.active && r.paidMonth !== currentMonth).reduce((a, r) => a + r.amount, 0);

  const variableDailyBurn = totalVarPaid / Math.max(DAY, 1);
  const projectedVariable = totalVarPaid + (variableDailyBurn * (DAYS_IN_MONTH - DAY));
  const projectedTotal = totalFixedPaid + pendingReminders + projectedVariable;
  
  const balEOM = totalInc - projectedTotal;
  const pctSpent = Math.min((projectedTotal / Math.max(totalInc,1)) * 100, 120);
  
  let runOut = null;
  if (balEOM < 0) {
    const remainingForVariable = totalInc - totalFixedPaid - pendingReminders;
    if (remainingForVariable <= 0) {
      runOut = DAY; 
    } else if (variableDailyBurn > 0) {
      runOut = Math.min(DAYS_IN_MONTH, Math.round(DAY + (remainingForVariable - totalVarPaid) / variableDailyBurn));
    }
  }

  return { balEOM, dailyAvg: variableDailyBurn, runOut, pctSpent, projected: projectedTotal };
}

export function payoffMonths(balance, rate, payment) {
  const r = rate / 100 / 12;
  if (payment <= r * balance) return Infinity;
  if (r === 0) return Math.ceil(balance / payment);
  return Math.ceil(Math.log(payment / (payment - r * balance)) / Math.log(1 + r));
}

export function calcRunway(balance, expenses) {
  if (!expenses || expenses.length === 0) return null;
  const dailyBurn = expenses.reduce((a, e) => a + e.amount, 0) / Math.max(DAY, 1);
  if (dailyBurn <= 0) return null;
  return Math.floor(balance / dailyBurn);
}

export function lifeHours(amount, monthlyIncome) {
  if (!monthlyIncome || monthlyIncome <= 0) return null;
  return Math.round(amount / (monthlyIncome / (22 * 8)));
}

export function semaphore(balance, totalInc, sc) {
  if (sc < 40 || (totalInc > 0 && balance <= totalInc * 0.25))
    return { color: "#F44336", label: "Alerta",     level: "red",    dark: "#0C0002" };
  if (totalInc > 0 && balance <= totalInc * 0.5)
    return { color: "#FFC107", label: "Precaución", level: "yellow", dark: "#0C0900" };
  return   { color: "#4CAF50", label: "Disponible", level: "green",  dark: "#001208" };
}

export function calcStreak(streakDays) {
  if (!streakDays || streakDays.length === 0) return 0;
  try {
    const sorted = Array.from(new Set(streakDays)).sort().reverse();
    let streak = 0, check = new Date();
    check.setHours(0, 0, 0, 0);
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i]);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((check - d) / 86400000);
      if (diff === 0 || diff === streak) { streak++; check = d; }
      else if (diff > 1) break;
    }
    return streak;
  } catch { return 0; }
}

export function streakMessage(streak, registeredToday) {
  if (!registeredToday && streak === 0)
    return { msg: "Inicia tu racha hoy",              sub: "Registra un movimiento para comenzar", color: "#55556A" };
  if (!registeredToday && streak > 0)
    return { msg: `No pierdas tu racha de ${streak} días`, sub: "Registra antes de medianoche",    color: "#F44336" };
  if (streak >= 30) return { msg: `${streak} días consecutivos`, sub: "Disciplina de élite",           color: "#D4AF37" };
  if (streak >= 14) return { msg: `${streak} días activos`,      sub: "Dos semanas. Ya es hábito",     color: "#FB923C" };
  if (streak >= 7)  return { msg: `${streak} días seguidos`,     sub: "Una semana completa",            color: "#00E5B0" };
  if (streak >= 3)  return { msg: `${streak} días de racha`,     sub: "No lo rompas hoy",              color: "#00E5B0" };
  return              { msg: "Racha iniciada",                   sub: "Continúa mañana",              color: "#00E5B0" };
}
