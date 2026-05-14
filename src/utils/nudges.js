import { CATS } from "../constants";

export const RANKS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
};

export const ACHIEVEMENTS = {
  PRIMER_PASO: { id: "primer_paso", title: { es: "Primer Paso", en: "First Step" }, desc: { es: "Has registrado tu primer movimiento.", en: "You logged your first transaction." }, icon: "footsteps", color: "#4AFFE7" }, // mint
  CAPITALISTA: { id: "capitalista", title: { es: "Capitalista", en: "Capitalist" }, desc: { es: "Has registrado tu primer ingreso.", en: "You logged your first income." }, icon: "cash", color: "#10B981" }, // green
  CONSTANCIA: { id: "constancia", title: { es: "Constancia", en: "Consistency" }, desc: { es: "Mantuviste una racha de 7 días.", en: "You kept a 7-day streak." }, icon: "flame", color: "#FFA500" }, // orange
  DISCIPLINA: { id: "disciplina", title: { es: "Disciplina Férrea", en: "Iron Discipline" }, desc: { es: "Alcanzaste 30 días de control.", en: "Reached 30 days of control." }, icon: "calendar", color: "#FF4500" }, // red-orange
  DEFENSOR: { id: "defensor", title: { es: "Defensor del Capital", en: "Capital Defender" }, desc: { es: "90 días de disciplina absoluta.", en: "90 days of absolute discipline." }, icon: "shield-checkmark", color: "#3B82F6" }, // blue
  IMPARABLE: { id: "imparable", title: { es: "Imparable", en: "Unstoppable" }, desc: { es: "Un año entero de control financiero.", en: "A whole year of financial control." }, icon: "rocket", color: "#8B5CF6" }, // violet
  ARQUITECTO: { id: "arquitecto", title: { es: "Arquitecto Financiero", en: "Financial Architect" }, desc: { es: "Has estructurado tus presupuestos.", en: "You have structured your budgets." }, icon: "cube", color: "#06B6D4" }, // sky
  ESTRATEGA: { id: "estratega", title: { es: "Estratega", en: "Strategist" }, desc: { es: "Has fijado una meta de ahorro.", en: "You set a savings goal." }, icon: "flag", color: "#F59E0B" }, // amber
  LIQUIDADOR: { id: "liquidador", title: { es: "Liquidador", en: "Liquidator" }, desc: { es: "Has aniquilado una deuda por completo.", en: "You fully liquidated a debt." }, icon: "skull", color: "#EF4444" }, // rose
  AHORRADOR: { id: "ahorrador", title: { es: "Ahorrador Nato", en: "Natural Saver" }, desc: { es: "Estás reteniendo más del 30% de tus ingresos.", en: "You're keeping over 30% of your income." }, icon: "leaf", color: "#10B981" }, // green
  INVERSOR: { id: "inversor", title: { es: "Inversor", en: "Investor" }, desc: { es: "Has registrado tu primera inversión.", en: "You logged your first investment." }, icon: "trending-up", color: "#FBBF24" }, // gold variant
  CENTURION: { id: "centurion", title: { es: "Centurión", en: "Centurion" }, desc: { es: "Has registrado 100 movimientos.", en: "You logged 100 transactions." }, icon: "layers", color: "#8B5CF6" }, // violet
  FUNDADOR: { id: "fundador", title: { es: "Fundador", en: "Founder" }, desc: { es: "Has registrado 50 ingresos.", en: "You logged 50 incomes." }, icon: "business", color: "#3B82F6" }, // blue
  PERFECCIONISTA: { id: "perfeccionista", title: { es: "Perfeccionista", en: "Perfectionist" }, desc: { es: "Score Financiero casi perfecto.", en: "Near-perfect Financial Score." }, icon: "ribbon", color: "#F472B6" }, // pink
  VISIONARIO: { id: "visionario", title: { es: "Visionario", en: "Visionary" }, desc: { es: "Proyectando libertad a largo plazo.", en: "Projecting long-term freedom." }, icon: "telescope", color: "#A855F7" }, // purple
  ELITE: { id: "elite", title: { es: "Status Elite", en: "Elite Status" }, desc: { es: "Has desbloqueado el verdadero poder de Fynx.", en: "You unlocked the true power of Fynx." }, icon: "diamond", color: "#D4AF37" }, // gold
};

/**
 * Determina el Rango de Élite basado en el comportamiento
 */
export function calculateRank(appState, derived) {
  if (!appState) return RANKS.BRONZE;

  const streak = appState.streakDays?.length || 0;
  
  // Condición GOLD: Meta significativa completada
  // Significativa = (Monto > 3x Ingreso Promedio) O (Duración >= 6 meses / 24 semanas)
  const avgIncome = derived?.totalInc || 0; // Podría mejorarse con un promedio histórico real
  const hasSignificantGoal = (appState.goals || []).some(g => {
    if (g.saved < g.target) return false; // Debe estar completada
    
    const isHighValue = avgIncome > 0 && g.target >= (avgIncome * 3);
    const isLongTerm = g.weeks >= 24;
    
    return isHighValue || isLongTerm;
  });

  if (hasSignificantGoal) {
    return RANKS.GOLD;
  }

  // Condición SILVER: Constancia
  if (streak >= 30) {
    return RANKS.SILVER;
  }

  return RANKS.BRONZE;
}

/**
 * Comprueba hitos de comportamiento no desbloqueados previamente
 */
export function checkAchievements(appState, unlockedIds = []) {
  if (!appState) return [];
  const newlyUnlocked = [];

  const streak = appState.streakDays?.length || 0;
  const expenses = appState.expenses || [];
  const income = appState.income || [];
  const budgets = Object.keys(appState.budgets || {});
  const goals = appState.goals || [];
  const debts = appState.debts || [];
  const esPremium = appState.user?.premium || false;

  const hasUnlocked = (key) => unlockedIds.includes(ACHIEVEMENTS[key].id);
  const unlock = (key) => newlyUnlocked.push(ACHIEVEMENTS[key]);

  if (!hasUnlocked("PRIMER_PASO") && expenses.length > 0) unlock("PRIMER_PASO");
  if (!hasUnlocked("CAPITALISTA") && income.length > 0) unlock("CAPITALISTA");
  if (!hasUnlocked("CENTURION") && expenses.length >= 100) unlock("CENTURION");
  if (!hasUnlocked("FUNDADOR") && income.length >= 50) unlock("FUNDADOR");
  
  if (!hasUnlocked("CONSTANCIA") && streak >= 7) unlock("CONSTANCIA");
  if (!hasUnlocked("DISCIPLINA") && streak >= 30) unlock("DISCIPLINA");
  if (!hasUnlocked("DEFENSOR") && streak >= 90) unlock("DEFENSOR");
  if (!hasUnlocked("IMPARABLE") && streak >= 365) unlock("IMPARABLE");

  if (!hasUnlocked("ARQUITECTO") && budgets.length >= 4) unlock("ARQUITECTO");
  
  if (!hasUnlocked("ESTRATEGA") && goals.length > 0) unlock("ESTRATEGA");

  if (!hasUnlocked("LIQUIDADOR") && debts.some(d => d.balance <= 0 && d.total > 0)) unlock("LIQUIDADOR");

  if (!hasUnlocked("INVERSOR")) {
    const hasInvestment = expenses.some(e => {
      const cat = (e.cat || "").toLowerCase();
      return cat.includes("inversion") || cat.includes("invest") || cat.includes("crypto") || cat.includes("acciones") || cat.includes("bolsa");
    });
    if (hasInvestment) unlock("INVERSOR");
  }

  if (!hasUnlocked("ELITE") && esPremium) unlock("ELITE");

  if (!hasUnlocked("AHORRADOR")) {
    const totalInc = income.reduce((a, b) => a + b.amount, 0);
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    if (totalInc > 0 && ((totalInc - totalExp) / totalInc) >= 0.3) {
      unlock("AHORRADOR");
    }
  }

  // Perfeccionista: Score >= 95 (approx calculable here if needed, or we just import score function)
  if (!hasUnlocked("PERFECCIONISTA")) {
    const totalInc = income.reduce((a, b) => a + b.amount, 0);
    const { score } = require("./finance");
    const { total } = score(expenses, totalInc, appState.budgets || {}, appState.streakDays || [], [], "es");
    if (total >= 95) unlock("PERFECCIONISTA");
  }

  // Visionario: Se desbloquea manualmente o si tiene un goal proyectado a más de 24 semanas
  if (!hasUnlocked("VISIONARIO") && goals.some(g => g.weeks >= 24)) unlock("VISIONARIO");

  return newlyUnlocked;
}

/**
 * Genera un Insight de TARS basado en datos reales del mes actual vs anterior
 */
export function generateTarsInsight(appState, derived, lang = 'es') {
  if (!appState || !derived) return null;

  const { expenses = [], weeklyHistory = [] } = appState;
  
  // Si no hay suficiente data histórica, damos un insight de Burn Rate
  if (derived.totalExp > 0 && derived.totalInc > 0 && derived.balance > 0) {
    const savePct = Math.round((derived.balance / derived.totalInc) * 100);
    if (savePct > 30) {
      return lang === 'en' 
        ? `Your capital burn rate has dropped significantly. You are retaining ${savePct}% of what you generate.`
        : `Tu velocidad de quema de capital ha bajado considerablemente. Estás reteniendo el ${savePct}% de lo generado.`;
    }
  }

  // Intentar encontrar una categoría que haya bajado respecto al historial reciente
  if (weeklyHistory.length >= 2) {
    const recent = expenses.slice(0, 20); 
    const cats = {};
    recent.forEach(e => {
      const key = e.cat || e.category;
      if (key) cats[key] = (cats[key] || 0) + e.amount;
    });
    
    const sortedCats = Object.entries(cats).sort((a,b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const topCatKey = sortedCats[0][0];
      const translatedCat = CATS[topCatKey]?.label?.[lang] || topCatKey;
      const budget = appState?.budgets?.[topCatKey];
      if (budget && cats[topCatKey] < budget * 0.5) {
        return lang === 'en'
          ? `Your control over "${translatedCat}" is optimal this period. That retained capital is already working for you.`
          : `Tu control sobre "${translatedCat}" es óptimo este periodo. Ese capital retenido ya trabaja a tu favor.`;
      }
    }
  }

  // Fallback analítico general
  if (derived.sc >= 80) {
    return lang === 'en'
      ? "Your operating parameters are elite. Maintain current discipline to ensure long-term projections."
      : "Tus parámetros operativos son de élite. Mantén la disciplina actual para asegurar proyecciones a largo plazo.";
  } else if (derived.sc < 50) {
    return lang === 'en'
      ? "Structural capital leaks detected. It is recommended to immediately re-evaluate fixed budgets."
      : "Detectando fugas de capital estructurales. Se recomienda reevaluar inmediatamente los presupuestos fijos.";
  }

  return lang === 'en'
    ? "Systems are stable. Logging consistency is your greatest asset right now."
    : "Los sistemas están estables. La consistencia en el registro es tu mayor activo ahora mismo.";
}
