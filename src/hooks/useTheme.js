import { useState, useEffect } from "react";
import { applyTheme, getTheme, DARK_THEME } from "../constants/themes";
import { score } from "../utils/finance";

export function useTheme(appState) {
  const [isDark,     setIsDark]     = useState(true);
  const [isSurvival, setIsSurvival] = useState(false);
  const [themeKey,   setThemeKey]   = useState(0);
  // Objeto de tema reactivo — los componentes deben leer T en lugar de C
  const [T, setT] = useState(DARK_THEME);

  function _apply(mode) {
    applyTheme(mode);
    setT({ ...getTheme(mode) });
    setThemeKey(k => k + 1);
  }

  // Aplicar tema cuando cambia isDark (solo si no estamos en survival)
  useEffect(() => {
    if (!isSurvival) {
      _apply(isDark ? "dark" : "light");
    }
  }, [isDark]);

  // Detectar modo supervivencia reactivamente
  useEffect(() => {
    if (!appState?.expenses || !appState?.income || !appState?.budgets) return;
    const totalInc = (appState.income || []).reduce((a, i) => a + i.amount, 0);
    const { total: sc } = score(appState.expenses || [], totalInc, appState.budgets || {});
    const survival = sc < 40;
    if (survival !== isSurvival) {
      setIsSurvival(survival);
      // Modo supervivencia solo cambia el tema si el score baja de 40,
      // pero al salir de él respeta la preferencia isDark del usuario
      _apply(survival ? "survival" : isDark ? "dark" : "light");
    }
  }, [appState?.expenses, appState?.income, appState?.budgets]);

  function toggleTheme(dark) {
    setIsDark(dark);
    if (!isSurvival) {
      _apply(dark ? "dark" : "light");
    }
  }

  return { isDark, isSurvival, themeKey, T, toggleTheme };
}
