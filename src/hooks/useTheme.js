import { useState, useEffect, useRef } from "react";
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

  // Aplicar tema permanentemente en oscuro
  useEffect(() => {
    _apply("dark");
  }, []);

  // Detectar modo supervivencia reactivamente
  const prevSurvivalInputRef = useRef(null);
  if (appState?.expenses && appState?.income && appState?.budgets) {
    const totalInc = (appState.income || []).reduce((a, i) => a + i.amount, 0);
    const { total: sc } = score(appState.expenses || [], totalInc, appState.budgets || {});
    const survival = sc < 40;
    const inputKey = `${appState.expenses.length}-${totalInc}-${Object.keys(appState.budgets).length}`;
    if (inputKey !== prevSurvivalInputRef.current && survival !== isSurvival) {
      setIsSurvival(survival);
      _apply(isDark ? "dark" : "light");
    }
    prevSurvivalInputRef.current = inputKey;
  }

  function toggleTheme(dark) {
    setIsDark(dark);
    if (!isSurvival) {
      _apply(dark ? "dark" : "light");
    }
  }

  return { isDark, isSurvival, themeKey, T, toggleTheme };
}
