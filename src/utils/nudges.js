import { CATS } from "../constants";

export const RANKS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
};

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS — 37 insignias agrupadas por categoría temática
// ─────────────────────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = {

  // ── PRIMEROS PASOS ───────────────────────────────────────────────────────
  PRIMER_PASO:     { id: "primer_paso",     title: { es: "Primer Paso",           en: "First Step"          }, desc: { es: "Registraste tu primera transacción.",                                 en: "You logged your first transaction."                }, icon: "footsteps",            color: "#4AFFE7" },
  CAPITALISTA:     { id: "capitalista",     title: { es: "Capitalista",            en: "Capitalist"          }, desc: { es: "Registraste tu primer ingreso.",                                      en: "You logged your first income."                     }, icon: "cash",                 color: "#10B981" },
  DEUDOR_AUDAZ:    { id: "deudor_audaz",    title: { es: "Deudor Audaz",           en: "Bold Debtor"         }, desc: { es: "Registraste tu primera deuda — primer paso para liquidarla.",          en: "You logged your first debt — first step to clear it." }, icon: "card",              color: "#F59E0B" },
  META_INICIAL:    { id: "meta_inicial",    title: { es: "Visionario Inicial",     en: "Early Visionary"     }, desc: { es: "Fijaste tu primera meta de ahorro.",                                  en: "You set your first savings goal."                  }, icon: "flag",                 color: "#A855F7" },
  PRESUPUESTADOR:  { id: "presupuestador",  title: { es: "Presupuestador",         en: "Budgeter"            }, desc: { es: "Configuraste tus presupuestos por primera vez.",                       en: "You set up your budgets for the first time."       }, icon: "calculator",           color: "#06B6D4" },

  // ── RACHAS (STREAKS) ─────────────────────────────────────────────────────
  CONSTANCIA:      { id: "constancia",      title: { es: "Constancia",             en: "Consistency"         }, desc: { es: "7 días seguidos de control financiero.",                              en: "7 consecutive days of financial control."          }, icon: "flame",                color: "#FFA500" },
  DOS_SEMANAS:     { id: "dos_semanas",     title: { es: "Dos Semanas",            en: "Two Weeks"           }, desc: { es: "14 días de disciplina continua.",                                     en: "14 days of continuous discipline."                 }, icon: "calendar-outline",     color: "#FB923C" },
  DISCIPLINA:      { id: "disciplina",      title: { es: "Disciplina Férrea",      en: "Iron Discipline"     }, desc: { es: "30 días de control absoluto.",                                        en: "30 days of absolute control."                      }, icon: "calendar",             color: "#FF4500" },
  MAESTRO_60:      { id: "maestro_60",      title: { es: "Maestro del Hábito",     en: "Habit Master"        }, desc: { es: "60 días — el hábito ya es parte de ti.",                              en: "60 days — the habit is part of you now."           }, icon: "medal-outline",        color: "#EF4444" },
  DEFENSOR:        { id: "defensor",        title: { es: "Defensor del Capital",   en: "Capital Defender"    }, desc: { es: "90 días de disciplina absoluta.",                                     en: "90 days of absolute discipline."                   }, icon: "shield-checkmark",     color: "#3B82F6" },
  MEDIO_YEAR:      { id: "medio_year",      title: { es: "Medio Año Elite",        en: "Half Year Elite"     }, desc: { es: "180 días sin parar. Eres un referente de disciplina.",                en: "180 days non-stop. You are a disciplinary role model." }, icon: "trophy",            color: "#6366F1" },
  IMPARABLE:       { id: "imparable",       title: { es: "Imparable",              en: "Unstoppable"         }, desc: { es: "365 días de control financiero total — un año completo.",               en: "365 days of total financial control — a full year." }, icon: "rocket",              color: "#8B5CF6" },

  // ── VOLUMEN DE REGISTROS ─────────────────────────────────────────────────
  REGISTRADOR_10:  { id: "registrador_10",  title: { es: "Registrador",            en: "Logger"              }, desc: { es: "10 transacciones registradas.",                                       en: "10 transactions logged."                           }, icon: "list",                 color: "#38BDF8" },
  REGISTRADOR_25:  { id: "registrador_25",  title: { es: "Analista Jr.",           en: "Jr. Analyst"         }, desc: { es: "25 transacciones. Vas por el camino correcto.",                       en: "25 transactions. You're on the right track."       }, icon: "stats-chart-outline",  color: "#22D3EE" },
  CENTURION:       { id: "centurion",       title: { es: "Centurión",              en: "Centurion"           }, desc: { es: "100 transacciones registradas.",                                      en: "100 transactions logged."                          }, icon: "layers",               color: "#8B5CF6" },
  MILLAR:          { id: "millar",          title: { es: "El Millar",              en: "The Thousand"        }, desc: { es: "500 transacciones. Historial de élite.",                              en: "500 transactions. Elite-level track record."       }, icon: "server-outline",       color: "#D946EF" },
  FUNDADOR:        { id: "fundador",        title: { es: "Fundador",               en: "Founder"             }, desc: { es: "50 fuentes de ingreso registradas.",                                  en: "50 income sources logged."                         }, icon: "business",             color: "#3B82F6" },

  // ── AHORRO & METAS ───────────────────────────────────────────────────────
  AHORRADOR:       { id: "ahorrador",       title: { es: "Ahorrador Nato",         en: "Natural Saver"       }, desc: { es: "Retienes más del 30% de tus ingresos.",                              en: "You keep over 30% of your income."                 }, icon: "leaf",                 color: "#10B981" },
  SUPER_AHORRADOR: { id: "super_ahorrador", title: { es: "Super Ahorrador",        en: "Super Saver"         }, desc: { es: "Ahorro sostenido por encima del 50% de los ingresos.",                en: "Sustained savings above 50% of income."            }, icon: "diamond-outline",      color: "#34D399" },
  META_50PCT:      { id: "meta_50pct",      title: { es: "Medio Camino",           en: "Halfway There"       }, desc: { es: "Alcanzaste el 50% de una meta de ahorro.",                            en: "You reached 50% of a savings goal."                }, icon: "battery-half-outline", color: "#FCD34D" },
  META_COMPLETA:   { id: "meta_completa",   title: { es: "Meta Cumplida",          en: "Goal Achieved"       }, desc: { es: "¡Completaste una meta de ahorro por completo!",                       en: "You completed a savings goal entirely!"            }, icon: "checkmark-circle",     color: "#4ADE80" },
  META_MAESTRO:    { id: "meta_maestro",    title: { es: "Maestro de Metas",       en: "Goal Master"         }, desc: { es: "Has completado 3 metas de ahorro diferentes.",                        en: "You completed 3 different savings goals."          }, icon: "ribbon",               color: "#86EFAC" },

  // ── DEUDAS ───────────────────────────────────────────────────────────────
  LIQUIDADOR:      { id: "liquidador",      title: { es: "Liquidador",             en: "Liquidator"          }, desc: { es: "Aniquilaste una deuda por completo.",                                 en: "You fully liquidated a debt."                      }, icon: "skull",                color: "#EF4444" },
  DOMADOR_DEUDAS:  { id: "domador_deudas",  title: { es: "Domador de Deudas",      en: "Debt Tamer"          }, desc: { es: "Liquidaste 3 deudas diferentes. Eres imparable.",                     en: "You liquidated 3 different debts. Unstoppable."    }, icon: "hammer-outline",       color: "#FCA5A5" },
  SIN_DEUDAS:      { id: "sin_deudas",      title: { es: "Libre de Deudas",        en: "Debt Free"           }, desc: { es: "Has eliminado todas tus deudas activas. Libertad total.",             en: "All active debts eliminated. Total freedom."       }, icon: "lock-open",            color: "#F87171" },

  // ── PRESUPUESTO & DISCIPLINA ─────────────────────────────────────────────
  ARQUITECTO:      { id: "arquitecto",      title: { es: "Arquitecto Financiero",  en: "Financial Architect" }, desc: { es: "Has estructurado todos tus presupuestos de categoría.",              en: "You structured all your category budgets."         }, icon: "cube",                 color: "#06B6D4" },
  SIN_EXCESOS:     { id: "sin_excesos",     title: { es: "Sin Excesos",            en: "No Overspending"     }, desc: { es: "Un mes completo sin sobrepasar ningún presupuesto.",                  en: "A full month without exceeding any budget."        }, icon: "shield-half-outline",  color: "#67E8F9" },
  MONJE_DIGITAL:   { id: "monje_digital",   title: { es: "Monje Digital",          en: "Digital Monk"        }, desc: { es: "Tres meses seguidos sin exceder ningún límite de presupuesto.",       en: "Three months without exceeding any budget limit."  }, icon: "infinite",             color: "#22D3EE" },

  // ── INGRESOS & INVERSIONES ───────────────────────────────────────────────
  INVERSOR:        { id: "inversor",        title: { es: "Inversor",               en: "Investor"            }, desc: { es: "Registraste tu primera inversión o activo.",                          en: "You logged your first investment or asset."        }, icon: "trending-up",          color: "#FBBF24" },
  MULTI_INGRESO:   { id: "multi_ingreso",   title: { es: "Múltiples Fuentes",      en: "Multiple Streams"    }, desc: { es: "Tienes 3 o más fuentes de ingreso activas.",                          en: "You have 3 or more active income streams."         }, icon: "git-branch-outline",   color: "#F59E0B" },
  INGRESO_PASIVO:  { id: "ingreso_pasivo",  title: { es: "Ingreso Pasivo",         en: "Passive Income"      }, desc: { es: "Tienes ingresos del tipo variable de forma recurrente.",               en: "You have recurring variable-type income."          }, icon: "pulse-outline",        color: "#D97706" },

  // ── SCORE FINANCIERO ─────────────────────────────────────────────────────
  SCORE_60:        { id: "score_60",        title: { es: "Prometedor",             en: "Promising"           }, desc: { es: "Tu Score Financiero superó los 60 puntos.",                           en: "Your Financial Score exceeded 60 points."          }, icon: "star-outline",         color: "#FDA4AF" },
  SCORE_80:        { id: "score_80",        title: { es: "Excelente",              en: "Excellent"           }, desc: { es: "Tu Score Financiero superó los 80 puntos.",                           en: "Your Financial Score exceeded 80 points."          }, icon: "star-half-outline",    color: "#FB7185" },
  PERFECCIONISTA:  { id: "perfeccionista",  title: { es: "Perfeccionista",         en: "Perfectionist"       }, desc: { es: "Score Financiero de 95 o más. Nivel de élite absoluto.",               en: "Financial Score of 95+. Absolute elite level."     }, icon: "ribbon",               color: "#F472B6" },

  // ── RAROS & ESPECIALES ───────────────────────────────────────────────────
  VISIONARIO:      { id: "visionario",      title: { es: "Visionario",             en: "Visionary"           }, desc: { es: "Meta de ahorro proyectada a más de 6 meses en el futuro.",            en: "Savings goal set more than 6 months ahead."        }, icon: "telescope",            color: "#A855F7" },
  MADRUGADOR:      { id: "madrugador",      title: { es: "Madrugador",             en: "Early Bird"          }, desc: { es: "Registraste una transacción antes de las 7am.",                       en: "Transaction logged before 7am."                    }, icon: "sunny-outline",        color: "#FDE68A" },
  NOCTAMBULO:      { id: "noctambulo",      title: { es: "Noctámbulo",             en: "Night Owl"           }, desc: { es: "Registraste una transacción después de las 11pm.",                    en: "Transaction logged after 11pm."                    }, icon: "moon-outline",         color: "#818CF8" },
  TARS_POWER:      { id: "tars_power",      title: { es: "TARS Power",             en: "TARS Power"          }, desc: { es: "Registraste una transacción por voz con TARS AI.",                    en: "You logged a transaction via TARS AI voice."       }, icon: "mic",                  color: "#2DD4BF" },
  ELITE:           { id: "elite",           title: { es: "Status Elite",           en: "Elite Status"        }, desc: { es: "Has desbloqueado el verdadero poder de Fynx Elite.",                  en: "You unlocked the true power of Fynx Elite."        }, icon: "diamond",              color: "#D4AF37" },
};

/**
 * Determina el Rango de Élite basado en el comportamiento
 */
export function calculateRank(appState, derived) {
  if (!appState) return RANKS.BRONZE;

  const streak = appState.streakDays?.length || 0;
  
  // Condición GOLD: Meta significativa completada
  const avgIncome = derived?.totalInc || 0;
  const hasSignificantGoal = (appState.goals || []).some(g => {
    if (g.saved < g.target) return false;
    const isHighValue = avgIncome > 0 && g.target >= (avgIncome * 3);
    const isLongTerm = g.weeks >= 24;
    return isHighValue || isLongTerm;
  });

  if (hasSignificantGoal) return RANKS.GOLD;
  if (streak >= 30) return RANKS.SILVER;
  return RANKS.BRONZE;
}

/**
 * Comprueba hitos de comportamiento no desbloqueados previamente
 */
export function checkAchievements(appState, unlockedIds = []) {
  if (!appState) return [];
  const newlyUnlocked = [];

  const streak      = appState.streakDays?.length || 0;
  const expenses    = appState.expenses || [];
  const income      = appState.income || [];
  const budgets     = Object.keys(appState.budgets || {});
  const goals       = appState.goals || [];
  const debts       = appState.debts || [];
  const esPremium   = appState.user?.premium || false;
  const totalInc    = income.reduce((a, b) => a + b.amount, 0);
  const totalExp    = expenses.reduce((a, b) => a + b.amount, 0);
  const savePct     = totalInc > 0 ? (totalInc - totalExp) / totalInc : 0;

  const has    = (key) => unlockedIds.includes(ACHIEVEMENTS[key].id);
  const unlock = (key) => newlyUnlocked.push(ACHIEVEMENTS[key]);

  // ── PRIMEROS PASOS ───────────────────────────────────────────────────────
  if (!has("PRIMER_PASO")    && expenses.length > 0)                 unlock("PRIMER_PASO");
  if (!has("CAPITALISTA")    && income.length > 0)                   unlock("CAPITALISTA");
  if (!has("DEUDOR_AUDAZ")   && debts.length > 0)                    unlock("DEUDOR_AUDAZ");
  if (!has("META_INICIAL")   && goals.length > 0)                    unlock("META_INICIAL");
  if (!has("PRESUPUESTADOR") && budgets.length >= 3)                 unlock("PRESUPUESTADOR");

  // ── RACHAS ───────────────────────────────────────────────────────────────
  if (!has("CONSTANCIA")   && streak >= 7)                           unlock("CONSTANCIA");
  if (!has("DOS_SEMANAS")  && streak >= 14)                          unlock("DOS_SEMANAS");
  if (!has("DISCIPLINA")   && streak >= 30)                          unlock("DISCIPLINA");
  if (!has("MAESTRO_60")   && streak >= 60)                          unlock("MAESTRO_60");
  if (!has("DEFENSOR")     && streak >= 90)                          unlock("DEFENSOR");
  if (!has("MEDIO_YEAR")   && streak >= 180)                         unlock("MEDIO_YEAR");
  if (!has("IMPARABLE")    && streak >= 365)                         unlock("IMPARABLE");

  // ── VOLUMEN DE REGISTROS ─────────────────────────────────────────────────
  if (!has("REGISTRADOR_10") && expenses.length >= 10)              unlock("REGISTRADOR_10");
  if (!has("REGISTRADOR_25") && expenses.length >= 25)              unlock("REGISTRADOR_25");
  if (!has("CENTURION")      && expenses.length >= 100)             unlock("CENTURION");
  if (!has("MILLAR")         && expenses.length >= 500)             unlock("MILLAR");
  if (!has("FUNDADOR")       && income.length >= 50)                unlock("FUNDADOR");

  // ── AHORRO & METAS ───────────────────────────────────────────────────────
  if (!has("AHORRADOR")       && totalInc > 0 && savePct >= 0.30)  unlock("AHORRADOR");
  if (!has("SUPER_AHORRADOR") && totalInc > 0 && savePct >= 0.50)  unlock("SUPER_AHORRADOR");

  if (!has("META_50PCT")) {
    const halfwayGoal = goals.some(g => g.target > 0 && (g.saved / g.target) >= 0.5 && (g.saved / g.target) < 1);
    if (halfwayGoal) unlock("META_50PCT");
  }
  if (!has("META_COMPLETA")) {
    const completedGoal = goals.some(g => g.target > 0 && (g.saved || 0) >= g.target);
    if (completedGoal) unlock("META_COMPLETA");
  }
  if (!has("META_MAESTRO")) {
    const completedCount = goals.filter(g => g.target > 0 && (g.saved || 0) >= g.target).length;
    if (completedCount >= 3) unlock("META_MAESTRO");
  }

  // ── DEUDAS ───────────────────────────────────────────────────────────────
  const liquidatedDebts = debts.filter(d => d.total > 0 && (d.balance || 0) <= 0);
  if (!has("LIQUIDADOR")     && liquidatedDebts.length >= 1)        unlock("LIQUIDADOR");
  if (!has("DOMADOR_DEUDAS") && liquidatedDebts.length >= 3)        unlock("DOMADOR_DEUDAS");
  if (!has("SIN_DEUDAS")     && debts.length > 0 && liquidatedDebts.length === debts.length) unlock("SIN_DEUDAS");

  // ── PRESUPUESTO & DISCIPLINA ─────────────────────────────────────────────
  if (!has("ARQUITECTO") && budgets.length >= 4)                    unlock("ARQUITECTO");

  // SIN_EXCESOS y MONJE_DIGITAL requieren historial mensual — se delegan a FinanceContext

  // ── INGRESOS & INVERSIONES ───────────────────────────────────────────────
  if (!has("INVERSOR")) {
    const hasInvestment = expenses.some(e => {
      const cat = (e.cat || "").toLowerCase();
      return cat.includes("inversion") || cat.includes("invest") || cat.includes("crypto") || cat.includes("acciones") || cat.includes("bolsa");
    });
    if (hasInvestment) unlock("INVERSOR");
  }
  if (!has("MULTI_INGRESO") && income.length >= 3) {
    const uniqueSources = new Set(income.map(i => i.source)).size;
    if (uniqueSources >= 3) unlock("MULTI_INGRESO");
  }
  if (!has("INGRESO_PASIVO")) {
    const variableCount = income.filter(i => i.type === "variable").length;
    if (variableCount >= 2) unlock("INGRESO_PASIVO");
  }

  // ── SCORE FINANCIERO ─────────────────────────────────────────────────────
  if (!has("SCORE_60") || !has("SCORE_80") || !has("PERFECCIONISTA")) {
    try {
      const { score } = require("./finance");
      const { total } = score(expenses, totalInc, appState.budgets || {}, appState.streakDays || [], [], "es");
      if (!has("SCORE_60")       && total >= 60) unlock("SCORE_60");
      if (!has("SCORE_80")       && total >= 80) unlock("SCORE_80");
      if (!has("PERFECCIONISTA") && total >= 95) unlock("PERFECCIONISTA");
    } catch (_) {}
  }

  // ── RAROS & ESPECIALES ───────────────────────────────────────────────────
  if (!has("VISIONARIO") && goals.some(g => g.weeks >= 24))         unlock("VISIONARIO");
  if (!has("ELITE")      && esPremium)                               unlock("ELITE");

  // MADRUGADOR, NOCTAMBULO y TARS_POWER se desbloquean desde los puntos de acción
  // (ChatScreen y HomeScreen) llamando directamente a FinanceContext.unlockAchievement()

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
