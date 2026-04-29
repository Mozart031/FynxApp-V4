import { DAY } from "./formatters";

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
  (expenses || []).forEach(e => { ct[e.cat] = (ct[e.cat] || 0) + e.amount; });
  const cats = Object.entries(budgets || {});
  const over = cats.filter(([k, l]) => l > 0 && (ct[k] || 0) > l).length;

  // Disciplina financiera: bono si 7 días consecutivos de racha
  const streak = calcStreak(streakDays || []);
  const disciplinaBonus = streak >= 7 ? 10 : streak >= 3 ? 5 : 0;

  // Aprendizaje adaptativo: bono si redujo gastos variables 2 semanas
  const reduccionBonus = _calcReduccionBonus(history);

  const s = {
    ahorro:       Math.min(100, Math.max(0, save * 2.5)),
    presupuesto:  cats.length ? Math.max(0, 100 - (over / cats.length) * 100) : 80,
    consistencia: Math.min(100, ((expenses || []).length / 15) * 100),
    deuda:        85,
  };

  const base  = Math.round(s.ahorro * .4 + s.presupuesto * .3 + s.consistencia * .2 + s.deuda * .1);
  const total = Math.min(100, base + disciplinaBonus + reduccionBonus);

  const grade = total >= 85 ? { label: "Excelente", color: "#10B981", icon: "star" }
              : total >= 70 ? { label: "Bueno",     color: "#00E5B0", icon: "checkmark-circle" }
              : total >= 50 ? { label: "Regular",   color: "#F5B800", icon: "warning" }
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
        .filter(e => VARIABLES.includes(e.cat))
        .reduce((a, e) => a + e.amount, 0)
    );
    return anterior > 0 && actual < anterior ? 5 : 0;
  } catch { return 0; }
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
  if (streak >= 30) return { msg: `${streak} días consecutivos`, sub: "Disciplina de élite",           color: "#F5B800" };
  if (streak >= 14) return { msg: `${streak} días activos`,      sub: "Dos semanas. Ya es hábito",     color: "#FB923C" };
  if (streak >= 7)  return { msg: `${streak} días seguidos`,     sub: "Una semana completa",            color: "#00E5B0" };
  if (streak >= 3)  return { msg: `${streak} días de racha`,     sub: "No lo rompas hoy",              color: "#00E5B0" };
  return              { msg: "Racha iniciada",                   sub: "Continúa mañana",              color: "#00E5B0" };
}
