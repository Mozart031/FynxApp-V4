export const RANKS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
};

export const ACHIEVEMENTS = {
  ARQUITECTO: { id: "arquitecto", title: "Arquitecto Financiero", desc: "Has estructurado tus presupuestos.", icon: "cube" },
  DEFENSOR: { id: "defensor", title: "Defensor del Capital", desc: "Gastos bajo control absoluto.", icon: "shield-checkmark" },
  VISIONARIO: { id: "visionario", title: "Visionario", desc: "Proyectando libertad a largo plazo.", icon: "telescope" },
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
export function generateTarsInsight(appState, derived) {
  if (!appState || !derived) return null;

  const { expenses = [], weeklyHistory = [] } = appState;
  
  // Si no hay suficiente data histórica, damos un insight de Burn Rate
  if (derived.totalExp > 0 && derived.totalInc > 0 && derived.balance > 0) {
    const savePct = Math.round((derived.balance / derived.totalInc) * 100);
    if (savePct > 30) {
      return `Tu velocidad de quema de capital ha bajado considerablemente. Estás reteniendo el ${savePct}% de lo generado.`;
    }
  }

  // Intentar encontrar una categoría que haya bajado respecto al historial reciente
  if (weeklyHistory.length >= 2) {
    // Esto es simplificado. En un escenario real cruzaríamos mes actual vs mes anterior exacto.
    const recent = expenses.slice(0, 20); // gastos muy recientes
    const cats = {};
    recent.forEach(e => cats[e.cat] = (cats[e.cat] || 0) + e.amount);
    
    // Buscar categoría principal
    const sortedCats = Object.entries(cats).sort((a,b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const topCat = sortedCats[0][0];
      const budget = appState.budgets?.[topCat];
      if (budget && cats[topCat] < budget * 0.5) {
        return `Tu control sobre "${topCat}" es óptimo este periodo. Ese capital retenido ya trabaja a tu favor.`;
      }
    }
  }

  // Fallback analítico general
  if (derived.sc >= 80) {
    return "Tus parámetros operativos son de élite. Mantén la disciplina actual para asegurar proyecciones a largo plazo.";
  } else if (derived.sc < 50) {
    return "Detectando fugas de capital estructurales. Se recomienda reevaluar inmediatamente los presupuestos fijos.";
  }

  return "Los sistemas están estables. La consistencia en el registro es tu mayor activo ahora mismo.";
}
