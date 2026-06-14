// ─────────────────────────────────────────────
// FYNX ELITE — Design System v6
// ADN: True Black · Titanium Gold · Electric Violet
// ─────────────────────────────────────────────

export const DARK_THEME = {
  // ── Vacío (Backgrounds) ──────────────────────
  bg:      "#000000",     // True Black OLED — innegociable
  card:    "#080808",     // Surface 1 — cards principales
  card2:   "#0F0F0F",     // Surface 2 — cards secundarias / inputs
  card3:   "#161616",     // Surface 3 — elementos anidados

  // ── Bordes (Profundidad sin sombras) ─────────
  border:  "#1A1A1A",     // Borde sutil base
  border2: "#252525",     // Borde medio

  // ── Titanium Gold (El Valor) ─────────────────
  gold:    "#D4AF37",     // Dorado titanio mate — acento principal
  goldDim: "#A88B3D",     // Gold apagado
  goldBg:  "#D4AF3710",   // Gold bg 6%
  goldBg2: "#D4AF371C",   // Gold bg 11%
  goldGlow:"#D4AF3725",   // Gold glow para bordes énfasis

  // ── Electric Violet (La Energía) ─────────────
  violet:    "#8B5CF6",   // Violeta eléctrico — acciones, botones activos
  violetDim: "#7C3AED",
  violetBg:  "#8B5CF612",
  violetBg2: "#8B5CF628",

  // ── Semánticos ───────────────────────────────
  rose:    "#EF4444",     // Peligro / sobre presupuesto
  roseDim: "#DC2626",
  roseBg:  "#EF444410",
  roseBg2: "#EF44441C",

  sky:     "#38BDF8",     // Info / datos neutros
  skyDim:  "#0EA5E9",
  skyBg:   "#38BDF810",
  skyBg2:  "#38BDF81C",

  green:   "#22C55E",     // Éxito / positivo
  greenBg: "#22C55E10",

  orange:  "#F59E0B",
  orangeBg:"#F59E0B10",

  pink:    "#EC4899",

  // ── Compat: mint → gold (retrocompatibilidad) ──
  mint:    "#D4AF37",
  mintDim: "#A88B3D",
  mintBg:  "#D4AF3710",
  mintBg2: "#D4AF371C",

  // ── Tipografía ───────────────────────────────
  t1:  "#E8E8F0",   // Blanco cálido — títulos
  t2:  "#7A7A8A",   // Gris neutro — body
  t3:  "#4A4A55",   // Gris apagado — labels
  t4:  "#2A2A30",   // Muy tenue — disabled
  t5:  "#151518",   // Casi invisible
};

// ── Fonts ─────────────────────────────────────
export const F = {
  mono:  "JetBrainsMono_400Regular",
  monoB: "JetBrainsMono_700Bold",
  sans:  "Inter_400Regular",
  sansM: "Inter_500Medium",
  sansB: "Inter_700Bold",
};

export const LIGHT_THEME = {
  bg: "#F0F4F8", card: "#FFFFFF", card2: "#F7F9FC", card3: "#EDF0F5",
  border: "#DDE2EA", border2: "#C8D0DC",
  gold: "#B8960A", goldDim: "#9A7E08", goldBg: "#B8960A14", goldBg2: "#B8960A28", goldGlow: "#B8960A30",
  violet: "#7C3AED", violetDim: "#6D28D9", violetBg: "#7C3AED14", violetBg2: "#7C3AED28",
  rose: "#DC2626", roseDim: "#B91C1C", roseBg: "#DC262614", roseBg2: "#DC262628",
  sky: "#0EA5E9", skyDim: "#0284C7", skyBg: "#0EA5E914", skyBg2: "#0EA5E928",
  green: "#059669", greenBg: "#05966914",
  orange: "#D97706", orangeBg: "#D9770614",
  pink: "#DB2777",
  mint: "#B8960A", mintDim: "#9A7E08", mintBg: "#B8960A14", mintBg2: "#B8960A28",
  t1: "#0F172A", t2: "#475569", t3: "#94A3B8", t4: "#CBD5E1", t5: "#E2E8F0",
};

export const SURVIVAL_THEME = {
  bg: "#080204", card: "#120008", card2: "#1A000D", card3: "#1F0010",
  border: "#3A0018", border2: "#4A0020",
  gold: "#FF7043", goldDim: "#E64A19", goldBg: "#FF704312", goldBg2: "#FF704328", goldGlow: "#FF704325",
  violet: "#FF6B9D", violetDim: "#E8557F", violetBg: "#FF6B9D12", violetBg2: "#FF6B9D28",
  rose: "#FF4D6D", roseDim: "#E03358", roseBg: "#FF4D6D12", roseBg2: "#FF4D6D28",
  sky: "#FF6B8A", skyDim: "#E85575", skyBg: "#FF6B8A12", skyBg2: "#FF6B8A28",
  green: "#FF4D6D", greenBg: "#FF4D6D12",
  orange: "#FF7043", orangeBg: "#FF704312",
  pink: "#FF4D8B",
  mint: "#FF7043", mintDim: "#E64A19", mintBg: "#FF704312", mintBg2: "#FF704328",
  t1: "#FFE0E8", t2: "#CC8899", t3: "#7A3344", t4: "#3A1520", t5: "#200A10",
};

// Proxy mutable — se actualiza al cambiar tema
export let C = { ...DARK_THEME };

export function applyTheme(mode) {
  const src = mode === "survival" ? SURVIVAL_THEME : mode === "light" ? LIGHT_THEME : DARK_THEME;
  Object.keys(src).forEach(k => { C[k] = src[k]; });
}

export function getTheme(mode) {
  if (mode === "survival") return SURVIVAL_THEME;
  if (mode === "light")    return LIGHT_THEME;
  return DARK_THEME;
}
