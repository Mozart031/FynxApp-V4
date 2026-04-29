export const ICON = {
  home:"home-outline",strategy:"bar-chart-outline",ai:"chatbubbles-outline",profile:"person-outline",plus:"add",
  settings:"settings-outline",eye:"eye-outline",eyeOff:"eye-off-outline",back:"chevron-back-outline",close:"close-outline",
  check:"checkmark",alert:"alert-circle-outline",lock:"lock-closed-outline",shield:"shield-checkmark-outline",chart:"pie-chart-outline",
  trend:"trending-up-outline",trendDown:"trending-down-outline",stable:"remove-outline",fire:"flame-outline",target:"flag-outline",
  cart:"cart-outline",fuel:"car-outline",game:"game-controller-outline",health:"medkit-outline",phone:"phone-portrait-outline",
  house:"home-outline",book:"book-outline",money:"cash-outline",
  income:"arrow-up-outline",expense:"arrow-down-outline",debt:"card-outline",goal:"flag-outline",save:"wallet-outline",
  ok:"checkmark-circle-outline",warn:"warning-outline",danger:"alert-circle-outline",trophy:"trophy-outline",star:"star-outline",run:"play-outline",
};

export const CATS = {
  Alimentacion:  { icon:"restaurant-outline", color:"#00E5B0", label:"Alimentación"  },
  Transporte:    { icon:"car-outline", color:"#38BDF8", label:"Transporte"    },
  Ocio:          { icon:"game-controller-outline", color:"#EC4899", label:"Ocio"          },
  Salud:         { icon:"medkit-outline", color:"#10B981", label:"Salud"         },
  Suscripciones: { icon:"phone-portrait-outline", color:"#A78BFA", label:"Suscripciones" },
  Hogar:         { icon:"home-outline", color:"#FB923C", label:"Hogar"         },
  Educacion:     { icon:"book-outline", color:"#F5B800", label:"Educación"     },
  Otro:          { icon:"cube-outline", color:"#55556A", label:"Otro"          },
};

export const BLOCKED_CATS = ["Ocio"];

export const DEBT_TYPES = [
  { id:"tarjeta",  icon:"card-outline", label:"Tarjeta",   color:"#FF4D6D" },
  { id:"prestamo", icon:"cash-outline", label:"Préstamo",  color:"#F5B800" },
  { id:"hipoteca", icon:"home-outline", label:"Hipoteca",  color:"#38BDF8" },
  { id:"auto",     icon:"car-outline", label:"Auto",       color:"#10B981" },
  { id:"personal", icon:"person-outline", label:"Personal",   color:"#A78BFA" },
  { id:"otro",     icon:"cube-outline", label:"Otro",       color:"#FB923C" },
];

export const STORE_KEY   = "mifinanzas_v7";
export const FRENO_KEY   = "mifinanzas_freno_v1";
export const FRENO_HOURS = 48;

export const DEF_BUDGETS = {
  Alimentacion:8000, Transporte:4000, Ocio:3000, Suscripciones:1500,
};
