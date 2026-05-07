// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — Modo Prueba (Screenshot Mode)
// Datos ficticios realistas para capturar pantallas de marketing.
// NO modificar datos reales del usuario. Solo se activa desde Ajustes.
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

export const DEMO_STATE = {
  onboarded:      true,
  setupCompleted: true,

  user: {
    name:           "Carlos Méndez",
    email:          "carlos@ejemplo.com",
    currency:       "RD$",
    hourlyRate:     350,
    premium:        true,
    appLockEnabled: false,
  },

  income: [
    { id: 1, source: "Salario Principal",  amount: 85000, type: "fijo",     date: daysAgo(28) },
    { id: 2, source: "Freelance Diseño",   amount: 22000, type: "variable", date: daysAgo(14) },
    { id: 3, source: "Alquiler",           amount: 15000, type: "fijo",     date: daysAgo(1)  },
  ],

  expenses: [
    { id: 101, desc: "Supermercado Nacional",  amount: 4200,  cat: "Alimentación",   date: daysAgo(2)  },
    { id: 102, desc: "Gasolina",               amount: 2800,  cat: "Transporte",     date: daysAgo(3)  },
    { id: 103, desc: "Netflix + Spotify",      amount: 950,   cat: "Suscripciones",  date: daysAgo(5)  },
    { id: 104, desc: "Farmacia Carol",         amount: 1100,  cat: "Salud",          date: daysAgo(6)  },
    { id: 105, desc: "Cena El Mesón",          amount: 3500,  cat: "Ocio",           date: daysAgo(7)  },
    { id: 106, desc: "Panadería Don Juan",     amount: 420,   cat: "Alimentación",   date: daysAgo(8)  },
    { id: 107, desc: "Uber",                   amount: 680,   cat: "Transporte",     date: daysAgo(9)  },
    { id: 108, desc: "Gym Platinum",           amount: 1800,  cat: "Salud",          date: daysAgo(10) },
    { id: 109, desc: "Mercado La Sirena",      amount: 3100,  cat: "Alimentación",   date: daysAgo(11) },
    { id: 110, desc: "Amazon Prime",           amount: 600,   cat: "Suscripciones",  date: daysAgo(12) },
    { id: 111, desc: "Cine Caribbean Cinemas", amount: 1200,  cat: "Ocio",           date: daysAgo(14) },
    { id: 112, desc: "Luz eléctrica EDESUR",   amount: 3800,  cat: "Fijos",          date: daysAgo(15) },
    { id: 113, desc: "Internet Claro",         amount: 1400,  cat: "Fijos",          date: daysAgo(16) },
    { id: 114, desc: "Gasolina PDQ",           amount: 2600,  cat: "Transporte",     date: daysAgo(18) },
  ],

  budgets: {
    "Alimentación":  12000,
    "Transporte":    6000,
    "Ocio":          5000,
    "Suscripciones": 2000,
    "Salud":         4000,
    "Fijos":         8000,
  },

  goals: [
    {
      id: 201,
      name:      "Viaje a Japón",
      icon:      "airplane",
      target:    280000,
      saved:     175000,
      deadline:  new Date(now.getFullYear() + 1, 8, 15).toISOString(),
      frequency: "semanal",
      color:     "#00C6FF",
    },
    {
      id: 202,
      name:      "MacBook Pro",
      icon:      "laptop",
      target:    120000,
      saved:     62000,
      deadline:  new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
      frequency: "semanal",
      color:     "#D4AF37",
    },
    {
      id: 203,
      name:      "Fondo de Emergencia",
      icon:      "shield-checkmark",
      target:    200000,
      saved:     158000,
      deadline:  new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString(),
      frequency: "mensual",
      color:     "#4ADE80",
    },
  ],

  debts: [
    {
      id: 301,
      name:    "Tarjeta Banco Popular",
      balance: 45000,
      rate:    28,
      minPay:  2250,
      dueDay:  15,
    },
    {
      id: 302,
      name:    "Préstamo Personal BHD",
      balance: 120000,
      rate:    18,
      minPay:  6000,
      dueDay:  5,
    },
  ],

  fixedPayments: [
    { id: 401, name: "Apartamento",   amount: 18000, dueDay: 1,  icon: "home"         },
    { id: 402, name: "Luz eléctrica", amount: 3800,  dueDay: 12, icon: "flash"        },
    { id: 403, name: "Internet Claro",amount: 1400,  dueDay: 18, icon: "wifi"         },
    { id: 404, name: "Seguro médico", amount: 4200,  dueDay: 20, icon: "medkit"       },
    { id: 405, name: "Gym Platinum",  amount: 1800,  dueDay: 25, icon: "barbell"      },
  ],

  sharedExpenses: [
    { id: 501, name: "Mike",   balance: 2500,  avatar: null },
    { id: 502, name: "Andrea", balance: -1800, avatar: null },
    { id: 503, name: "Papá",   balance: 4000,  avatar: null },
  ],

  streakDays: [
    daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(3),
    daysAgo(4), daysAgo(5), daysAgo(6), daysAgo(7),
    daysAgo(8), daysAgo(9), daysAgo(10),
  ],

  weeklyHistory: [
    { week: "2025-W10", score: 71 },
    { week: "2025-W11", score: 74 },
    { week: "2025-W12", score: 76 },
    { week: "2025-W13", score: 79 },
    { week: "2025-W14", score: 81 },
  ],

  scoreHistory: {
    [daysAgo(6).slice(0,10)]: 77,
    [daysAgo(5).slice(0,10)]: 78,
    [daysAgo(4).slice(0,10)]: 79,
    [daysAgo(3).slice(0,10)]: 80,
    [daysAgo(2).slice(0,10)]: 80,
    [daysAgo(1).slice(0,10)]: 81,
    [daysAgo(0).slice(0,10)]: 82,
  },

  achievements: ["first_expense", "streak_7", "goal_created", "budget_set"],
};
