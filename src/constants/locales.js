import { S as es } from "./strings";

export const en = {
  ...es,
  cargando: "Loading...",
  guardar: "Save",
  cancelar: "Cancel",
  eliminar: "Delete",
  aceptar: "Accept",
  cerrar: "Close",
  atras: "Back",
  siguiente: "Next",
  finalizar: "Finish",
  sinDatos: "No data recorded.",
  
  auth: {
    ...es.auth,
    titulo: "Welcome to Fynx",
    subtitulo: "Your personal financial assistant.",
    lblEmail: "EMAIL ADDRESS",
    lblPassword: "PASSWORD",
    btnEntrar: "Log In",
    btnRegistrar: "Create Account",
  },
  
  dash: {
    ...es.dash,
    titulo: "Home",
    balanceNeto: "NET BALANCE",
    ingresos: "Income",
    gastos: "Expenses",
    tasaAhorro: "Savings Rate",
    cobertura: "Coverage",
  },

  tx: {
    ...es.tx,
    titulo: "Transactions",
    nueva: "New Transaction",
    tipoGasto: "Expense",
    tipoIngreso: "Income",
  },

  config: {
    ...es.config,
    titulo: "Settings",
    apariencia: "APPEARANCE",
    temaOscuro: "Dark",
    temaClaro: "Light",
    btnGuardar: "Save Changes",
    cerrarSesion: "Log Out",
  }
};

export const locales = {
  es,
  en
};
