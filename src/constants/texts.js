/**
 * TARS — Constantes de texto centralizadas
 * Auditoría RAE: sin errores de acentuación, gramática ni puntuación.
 * Tono: profesional, técnico, sobrio, sin emojis.
 */

// ── Onboarding ────────────────────────────────────────────────────────────────
export const OB = {
  bienvenida: {
    titulo:   "Mi Finanzas",
    subtitulo: "Tu asesor financiero personal.\nInteligente. Privado. Dominicano.",
    cta:      "Comenzar",
  },
  perfil: {
    titulo:   "Tu perfil",
    subtitulo: "¿Cómo te llamas?",
    lblNombre: "NOMBRE",
    lblMoneda: "MONEDA",
    lblMeta:   "META DE AHORRO (%)",
    phNombre:  "Ej.: Erickson",
  },
  ingresos: {
    titulo:    "Tus ingresos",
    subtitulo: "Agrega tus fuentes de ingreso mensual.",
    phFuente:  "Fuente (ej.: Salario, Freelance)",
    phMonto:   "Monto",
    btnAgregar:"Agregar ingreso",
    fijo:      "Fijo",
    variable:  "Variable",
  },
  presupuesto: {
    titulo:    "Presupuesto",
    subtitulo: "Límites mensuales por categoría.",
    phLimite:  "0 = sin límite",
  },
  metas: {
    titulo:    "Primera meta",
    subtitulo: "¿Qué quieres lograr? (opcional)",
    lblQue:    "¿QUÉ QUIERES LOGRAR?",
    lblSimbolo:"SÍMBOLO",
    lblCosto:  "COSTO",
    lblPlazo:  "PLAZO",
    phMeta:    "Ej.: Laptop, Viaje, Fondo de emergencia...",
    phMonto:   "Ej.: 50 000",
    btnAgregar:"Agregar meta",
    plazos: [
      ["4",  "1 mes"],
      ["12", "3 meses"],
      ["24", "6 meses"],
      ["52", "1 año"],
    ],
  },
  fin: {
    titulo:    (nombre) => `Listo, ${nombre || "bienvenido"}.`,
    subtitulo: "Tu ecosistema financiero está configurado.",
    cta:       "Empezar",
  },
  nav: {
    atras:     "Atrás",
    siguiente: "Siguiente",
    finalizar: "Finalizar",
  },
  // Typewriter — secuencias para cada paso
  typewriter: {
    0: "Bienvenido a MiFinanzas.\nAquí tus datos son privados, locales y tuyos.",
    1: "Cuéntame sobre ti.\nEsto personaliza tu experiencia.",
    2: "¿De dónde viene tu dinero?\nRegistrar ingresos es el primer paso.",
    3: "Poner límites es disciplina, no restricción.",
    4: "Una meta transforma el ahorro en motivación.",
    5: "Todo está listo.\nDisciplina financiera de élite, comenzando ahora.",
  },
};

// ── Autenticación ─────────────────────────────────────────────────────────────
export const AUTH = {
  login: {
    titulo:        "Accede a tu cuenta",
    subtitulo:     "Tus datos financieros, disponibles en cualquier dispositivo.",
    lblEmail:      "CORREO ELECTRÓNICO",
    lblPassword:   "CONTRASEÑA",
    phEmail:       "correo@ejemplo.com",
    phPassword:    "Mínimo 6 caracteres",
    btnLogin:      "Iniciar sesión",
    btnRegistro:   "Crear cuenta",
    linkOlvide:    "¿Olvidaste tu contraseña?",
    linkCrear:     "¿No tienes cuenta? Crear una",
    linkTener:     "¿Ya tienes cuenta? Iniciar sesión",
    biometrico:    "Acceder con huella o rostro",
    errCampos:     "Completa todos los campos.",
    errInvalido:   "Correo o contraseña incorrectos.",
    errRed:        "Sin conexión. Verifica tu internet.",
    cargando:      "Verificando...",
  },
  registro: {
    titulo:    "Crea tu cuenta",
    subtitulo: "Protege tu historial financiero en la nube.",
    btnCta:    "Crear cuenta",
    errExiste:  "Este correo ya tiene una cuenta.",
    errDebil:   "La contraseña debe tener al menos 6 caracteres.",
  },
};

// ── Premium ───────────────────────────────────────────────────────────────────
export const PREMIUM = {
  badgeGratis:   "PLAN GRATUITO",
  badgePremium:  "PLAN PREMIUM",
  btnUpgrade:    "Actualizar a Premium",
  modal: {
    titulo:    "MiFinanzas Premium",
    subtitulo: "Herramientas avanzadas para quienes toman en serio sus finanzas.",
    precio:    "RD$ 175 / mes", // approx 2.99 USD
    cta:       "Suscribirse ahora",
    cerrar:    "No por ahora",
    beneficios: [
      { icono: "analytics-outline", titulo: "Diagnóstico de Score", desc: "Ve exactamente por qué sube o baja tu score y cómo mejorarlo (Drivers de Impacto)." },
      { icono: "infinite-outline", titulo: "Simulador Predictivo Avanzado", desc: "Proyecciones a largo plazo con Confidence Bands y sliders en tiempo real." },
      { icono: "pie-chart-outline", titulo: "Presupuestos por Categoría", desc: "Límites estrictos para cada gasto. Controla cada centavo." },
      { icono: "calendar-outline", titulo: "Pagos Fijos Ilimitados", desc: "Agenda todas tus obligaciones y recibe alertas a tiempo." },
      { icono: "document-text-outline", titulo: "Reportes en PDF", desc: "Exporta tu historial y progreso en formato profesional." },
      { icono: "shield-checkmark-outline", titulo: "Sin interrupciones", desc: "Experiencia inmersiva, 100% libre de publicidad." },
    ],
  },
};

// ── Freno de emergencia ───────────────────────────────────────────────────────
export const FRENO = {
  titulo:      "Freno de emergencia",
  desc:        "Deshabilita Ocio por 48 h cuando gastes de más.",
  activo:      (h) => `Activo — ${h} h restantes. Ocio deshabilitado.`,
  bloqueadas:  "Categorías bloqueadas: Ocio",
};

// ── Modo Supervivencia ────────────────────────────────────────────────────────
export const SURVIVAL = {
  titulo: "MODO SUPERVIVENCIA ACTIVO",
  desc:   "Score por debajo de 40 pts. Revisa tus finanzas de inmediato.",
};

// ── Configuración ─────────────────────────────────────────────────────────────
export const CONFIG = {
  titulo:       "Configuración",
  apariencia:   "APARIENCIA",
  temaOscuro:   "Oscuro",
  temaClaro:    "Claro",
  nombre:       "NOMBRE",
  ingreso:      "INGRESO MENSUAL",
  metaAhorro:   "META DE AHORRO (%)",
  presupuesto:  "LÍMITES DE PRESUPUESTO",
  btnGuardar:   "Guardar cambios",
};

// ── Score ─────────────────────────────────────────────────────────────────────
export const SCORE_LABELS = {
  ahorro:       "Tasa de ahorro",
  presupuesto:  "Control presupuestario",
  consistencia: "Consistencia de registro",
  deuda:        "Gestión de deudas",
};

// ── General ───────────────────────────────────────────────────────────────────
export const GEN = {
  cargando:     "Cargando...",
  sinDatos:     "Sin datos registrados.",
  verTodos:     (n) => `Ver todos (${n})`,
  balanceDisp:  "BALANCE DISPONIBLE",
  tasaAhorro:   "Tasa de ahorro",
  runway:       "Cobertura",
  urgente:      "URGENTE",
  ingresos:     "Ingresos",
  nivel:        "Nivel",
};
