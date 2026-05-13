import { CATS } from "../constants";

export const RANKS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
};

export const ACHIEVEMENTS = {
  ARQUITECTO: { id: "arquitecto", title: { es: "Arquitecto Financiero", en: "Financial Architect" }, desc: { es: "Has estructurado tus presupuestos.", en: "You have structured your budgets." }, icon: "cube" },
  DEFENSOR: { id: "defensor", title: { es: "Defensor del Capital", en: "Capital Defender" }, desc: { es: "Gastos bajo control absoluto.", en: "Spending under absolute control." }, icon: "shield-checkmark" },
  VISIONARIO: { id: "visionario", title: { es: "Visionario", en: "Visionary" }, desc: { es: "Proyectando libertad a largo plazo.", en: "Projecting long-term freedom." }, icon: "telescope" },
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

  // Arquitecto Financiero: Tiene presupuestos configurados para al menos 4 categorías
  if (!unlockedIds.includes(ACHIEVEMENTS.ARQUITECTO.id)) {
    const budgetCount = Object.keys(appState.budgets || {}).length;
    if (budgetCount >= 4) {
      newlyUnlocked.push(ACHIEVEMENTS.ARQUITECTO);
    }
  }

  // Defensor del Capital: Racha mayor a 90 días o un Score perfecto
  if (!unlockedIds.includes(ACHIEVEMENTS.DEFENSOR.id)) {
    const streak = appState.streakDays?.length || 0;
    if (streak >= 90) { // Alternativa proxy para "3 meses seguidos de control"
      newlyUnlocked.push(ACHIEVEMENTS.DEFENSOR);
    }
  }

  // Visionario: Se desbloquea manualmente desde la UI cuando se usa el Predictor, 
  // pero lo exponemos aquí para tener la definición completa.

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
      const budget = appState.budgets?.[topCatKey];
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
