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
export function score(expenses, income, budgets, streakDays = [], history = [], lang = 'es') {
  const exp  = (expenses || []).reduce((a, e) => a + e.amount, 0);
  
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
  // - Ahorro: penalización si se gasta más de lo que se ingresa (ahorro negativo)
  // - scoreAhorro puede ser negativo (hasta -50) para hundir el score en sobregiro
  let save = 0;
  if (income > 0) {
    save = ((income - exp) / income) * 100;
  } else if (exp > 0) {
    save = -50; // Penalidad base: gasta sin ingresos registrados
  }
  
  // Permitimos que scoreAhorro sea negativo (hasta -50) para hundir el score si hay sobregiro
  const scoreAhorro = Math.max(-50, Math.min(100, save * 2.5));
  const scorePresupuesto = cats.length === 0 ? 50 : Math.max(0, 100 - (over / cats.length) * 100);

  const s = {
    ahorro:       scoreAhorro,
    presupuesto:  scorePresupuesto,
    consistencia: Math.min(100, ((streakDays || []).length / 15) * 100),
    deuda:        85,
  };

  const base  = Math.round(s.ahorro * .4 + s.presupuesto * .3 + s.consistencia * .2 + s.deuda * .1);
  const total = Math.max(0, Math.min(100, base + disciplinaBonus + reduccionBonus));

  const grade = total >= 85 ? { label: lang === 'en' ? "Excellent" : "Excelente", color: "#10B981", icon: "star" }
              : total >= 70 ? { label: lang === 'en' ? "Good" : "Bueno",     color: "#00E5B0", icon: "checkmark-circle" }
              : total >= 50 ? { label: lang === 'en' ? "Fair" : "Regular",   color: "#D4AF37", icon: "warning" }
              :               { label: lang === 'en' ? "Critical" : "Crítico",   color: "#8A8A8A", icon: "alert-circle" };

  const factors = [];
  if (save >= 20) factors.push({ factor: lang === 'en' ? "Solid Savings" : "Ahorro Sólido", impact: Math.round(s.ahorro * 0.4), type: "positive", icon: "wallet" });
  else if (exp > income && income > 0) factors.push({ factor: lang === 'en' ? "Spending exceeds Income" : "Gasto supera Ingresos", impact: -20, type: "negative", icon: "alert-circle" });
  else if (income === 0) factors.push({ factor: lang === 'en' ? "No Income" : "Sin Ingresos", impact: -10, type: "negative", icon: "cash-outline" });
  
  if (cats.length > 0 && over === 0) factors.push({ factor: lang === 'en' ? "Budget Under Control" : "Presupuesto Controlado", impact: Math.round(s.presupuesto * 0.3), type: "positive", icon: "shield-checkmark" });
  else if (over > 0) factors.push({ factor: lang === 'en' ? `${over} Categories Exceeded` : `${over} Categorías Excedidas`, impact: -Math.round((over/cats.length)*30), type: "negative", icon: "warning" });
  else if (cats.length === 0) factors.push({ factor: lang === 'en' ? "No Budgets" : "Sin Presupuestos", impact: -15, type: "negative", icon: "calculator" });
  
  if (disciplinaBonus > 0) factors.push({ factor: lang === 'en' ? `Active Streak (${streak}d)` : `Racha Activa (${streak}d)`, impact: disciplinaBonus, type: "positive", icon: "flame" });
  if (reduccionBonus > 0) factors.push({ factor: lang === 'en' ? "Reduced Spending" : "Gastos Reducidos", impact: reduccionBonus, type: "positive", icon: "trending-down" });
  if (s.consistencia < 40) factors.push({ factor: lang === 'en' ? "Low Consistency" : "Baja Consistencia", impact: -10, type: "negative", icon: "calendar-outline" });

  factors.sort((a,b) => Math.abs(b.impact) - Math.abs(a.impact));
  const topFactors = factors.slice(0, 3);

  return { total, s, grade, disciplinaBonus, reduccionBonus, factors: topFactors };
}

export function calcScoreTrend(scoreHistory) {
  if (!scoreHistory) return { change: 0, trend: 'neutral' };
  const dates = Object.keys(scoreHistory).sort();
  if (dates.length < 2) return { change: 0, trend: 'neutral' };
  
  const current = Number(scoreHistory[dates[dates.length - 1]]) || 0;
  const now = new Date(dates[dates.length - 1]);
  let pastScore = current;
  
  for (let i = dates.length - 2; i >= 0; i--) {
    const d = new Date(dates[i]);
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    if (diffDays >= 25) {
      pastScore = Number(scoreHistory[dates[i]]) || 0;
      break;
    } else if (i === 0) {
      pastScore = Number(scoreHistory[dates[i]]) || 0;
    }
  }
  
  const change = current - pastScore;
  let pctChange = 0;
  if (pastScore > 0) {
    pctChange = Math.round((change / pastScore) * 100);
  } else if (change > 0) {
    pctChange = 100;
  } else if (change < 0) {
    pctChange = -100;
  }
  
  return {
    change,
    pctChange,
    trend: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
  };
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

export function semaphore(balance, totalInc, sc, lang = 'es') {
  if (sc < 40 || (totalInc > 0 && balance <= totalInc * 0.25))
    return { color: "#F44336", label: lang === 'en' ? "Alert" : "Alerta",     level: "red",    dark: "#0C0002" };
  if (totalInc > 0 && balance <= totalInc * 0.5)
    return { color: "#FFC107", label: lang === 'en' ? "Caution" : "Precaución", level: "yellow", dark: "#0C0900" };
  return   { color: "#4CAF50", label: lang === 'en' ? "Available" : "Disponible", level: "green",  dark: "#001208" };
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

export function streakMessage(streak, registeredToday, lang = 'es') {
  if (!registeredToday && streak === 0)
    return { msg: lang === 'en' ? "Start your streak today" : "Inicia tu racha hoy",              sub: lang === 'en' ? "Log a movement to start" : "Registra un movimiento para comenzar", color: "#55556A" };
  if (!registeredToday && streak > 0)
    return { msg: lang === 'en' ? `Don't lose your ${streak}-day streak` : `No pierdas tu racha de ${streak} días`, sub: lang === 'en' ? "Log before midnight" : "Registra antes de medianoche",    color: "#F44336" };
  if (streak >= 30) return { msg: lang === 'en' ? `${streak} consecutive days` : `${streak} días consecutivos`, sub: lang === 'en' ? "Elite discipline" : "Disciplina de élite",           color: "#D4AF37" };
  if (streak >= 14) return { msg: lang === 'en' ? `${streak} active days` : `${streak} días activos`,      sub: lang === 'en' ? "Two weeks. It's a habit now" : "Dos semanas. Ya es hábito",     color: "#FB923C" };
  if (streak >= 7)  return { msg: lang === 'en' ? `${streak} straight days` : `${streak} días seguidos`,     sub: lang === 'en' ? "A full week" : "Una semana completa",            color: "#00E5B0" };
  if (streak >= 3)  return { msg: lang === 'en' ? `${streak}-day streak` : `${streak} días de racha`,     sub: lang === 'en' ? "Don't break it today" : "No lo rompas hoy",              color: "#00E5B0" };
  return              { msg: lang === 'en' ? "Streak started" : "Racha iniciada",                   sub: lang === 'en' ? "Continue tomorrow" : "Continúa mañana",              color: "#00E5B0" };
}
