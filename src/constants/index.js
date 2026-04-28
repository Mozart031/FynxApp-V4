export const ICON = {
  home:"⌂",strategy:"◈",ai:"◉",profile:"◎",plus:"+",
  settings:"≡",eye:"◉",eyeOff:"◎",back:"‹",close:"×",
  check:"✓",alert:"!",lock:"■",shield:"◆",chart:"▲",
  trend:"↗",trendDown:"↘",stable:"→",fire:"◆",target:"◎",
  cart:"⊞",fuel:"▣",game:"◧",health:"✚",phone:"▤",
  house:"⌂",book:"▦",money:"◈",
  income:"↑",expense:"↓",debt:"◆",goal:"◎",save:"▲",
  ok:"●",warn:"●",danger:"●",trophy:"▲",star:"★",run:"►",
};

export const CATS = {
  Alimentacion:  { icon:"⊞", color:"#00E5B0", label:"Alimentación"  },
  Transporte:    { icon:"▣", color:"#38BDF8", label:"Transporte"    },
  Ocio:          { icon:"◧", color:"#EC4899", label:"Ocio"          },
  Salud:         { icon:"✚", color:"#10B981", label:"Salud"         },
  Suscripciones: { icon:"▤", color:"#A78BFA", label:"Suscripciones" },
  Hogar:         { icon:"⌂", color:"#FB923C", label:"Hogar"         },
  Educacion:     { icon:"▦", color:"#F5B800", label:"Educación"     },
  Otro:          { icon:"◈", color:"#55556A", label:"Otro"          },
};

export const BLOCKED_CATS = ["Ocio"];

export const DEBT_TYPES = [
  { id:"tarjeta",  icon:"◆", label:"Tarjeta",   color:"#FF4D6D" },
  { id:"prestamo", icon:"◈", label:"Préstamo",  color:"#F5B800" },
  { id:"hipoteca", icon:"⌂", label:"Hipoteca",  color:"#38BDF8" },
  { id:"auto",     icon:"▣", label:"Auto",       color:"#10B981" },
  { id:"personal", icon:"▲", label:"Personal",   color:"#A78BFA" },
  { id:"otro",     icon:"◈", label:"Otro",       color:"#FB923C" },
];

export const STORE_KEY   = "mifinanzas_v7";
export const FRENO_KEY   = "mifinanzas_freno_v1";
export const FRENO_HOURS = 48;

export const DEF_BUDGETS = {
  Alimentacion:8000, Transporte:4000, Ocio:3000, Suscripciones:1500,
};
