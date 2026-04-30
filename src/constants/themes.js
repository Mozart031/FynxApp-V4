// ─────────────────────────────────────────────
// TEMAS — Dark / Light / Survival
// ─────────────────────────────────────────────
export const DARK_THEME = {
  bg: "#000000", card: "#0A0A0A", card2: "#121212", card3: "#1A1A1A",
  border: "#262626", border2: "#333333",
  mint: "#00E5B0", mintDim: "#00C49A", mintBg: "#00E5B012", mintBg2: "#00E5B025",
  gold: "#D4AF37", goldDim: "#B8992E", goldBg: "#D4AF3712", goldBg2: "#D4AF3728",
  rose: "#FF4D6D", roseDim: "#E03358", roseBg: "#FF4D6D12", roseBg2: "#FF4D6D28",
  sky: "#38BDF8", skyDim: "#22A8E8", skyBg: "#38BDF812", skyBg2: "#38BDF828",
  violet: "#A78BFA", violetBg: "#A78BFA12",
  green: "#10B981", greenBg: "#10B98112",
  orange: "#FB923C", orangeBg: "#FB923C12",
  pink: "#EC4899",
  t1: "#F0F0FA", t2: "#A0A0A0", t3: "#666666", t4: "#333333", t5: "#1A1A1A",
};

export const LIGHT_THEME = {
  bg: "#F0F4F8", card: "#FFFFFF", card2: "#F7F9FC", card3: "#EDF0F5",
  border: "#DDE2EA", border2: "#C8D0DC",
  mint: "#00B88A", mintDim: "#009A74", mintBg: "#00B88A14", mintBg2: "#00B88A28",
  gold: "#D4920A", goldDim: "#B87E08", goldBg: "#D4920A14", goldBg2: "#D4920A28",
  rose: "#E8274B", roseDim: "#C82040", roseBg: "#E8274B14", roseBg2: "#E8274B28",
  sky: "#0EA5E9", skyDim: "#0284C7", skyBg: "#0EA5E914", skyBg2: "#0EA5E928",
  violet: "#7C3AED", violetBg: "#7C3AED14",
  green: "#059669", greenBg: "#05966914",
  orange: "#EA580C", orangeBg: "#EA580C14",
  pink: "#DB2777",
  t1: "#0F172A", t2: "#475569", t3: "#94A3B8", t4: "#CBD5E1", t5: "#E2E8F0",
};

export const SURVIVAL_THEME = {
  bg: "#080204", card: "#120008", card2: "#1A000D", card3: "#1F0010",
  border: "#3A0018", border2: "#4A0020",
  mint: "#FF4D6D", mintDim: "#E03358", mintBg: "#FF4D6D12", mintBg2: "#FF4D6D25",
  gold: "#FF7043", goldDim: "#E64A19", goldBg: "#FF704312", goldBg2: "#FF704328",
  rose: "#FF4D6D", roseDim: "#E03358", roseBg: "#FF4D6D12", roseBg2: "#FF4D6D28",
  sky: "#FF6B8A", skyDim: "#E85575", skyBg: "#FF6B8A12", skyBg2: "#FF6B8A28",
  violet: "#FF6B9D", violetBg: "#FF6B9D12",
  green: "#FF4D6D", greenBg: "#FF4D6D12",
  orange: "#FF7043", orangeBg: "#FF704312",
  pink: "#FF4D8B",
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
