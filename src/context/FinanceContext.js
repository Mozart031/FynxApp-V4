import React, { createContext, useContext } from "react";
import { usePersistence } from "../hooks/usePersistence";
import { useTheme }       from "../hooks/useTheme";
import { score, calcRunway, semaphore } from "../utils/finance";
import { DARK_THEME } from "../constants/themes";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { appState, setAppState, updateState, frenoState, toggleFreno } = usePersistence();
  const { isDark, isSurvival, themeKey, T, toggleTheme } = useTheme(appState);

  // Métricas derivadas — calculadas una vez, disponibles en toda la app
  const derived = React.useMemo(() => {
    const income   = appState?.income   || [];
    const expenses = appState?.expenses || [];
    const budgets  = appState?.budgets  || {};
    const totalInc = income.reduce((a, i) => a + i.amount, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const balance  = totalInc - totalExp;
    const savePct  = totalInc > 0 ? Math.round((balance / totalInc) * 100) : 0;
    const { total: sc, s: scoreBreak, grade, disciplinaBonus, reduccionBonus } = score(
      expenses, totalInc, budgets,
      appState?.streakDays || [],
      appState?.weeklyHistory || []
    );
    const runway   = calcRunway(balance, expenses);
    const sem      = semaphore(balance, totalInc, sc);
    return { 
      totalInc:       totalInc    || 0,
      totalExp:       totalExp    || 0,
      balance:        balance     || 0,
      savePct:        savePct     || 0,
      sc:             sc          || 0,
      scoreBreak:     scoreBreak  || {},
      grade:          grade       || { label:"Sin datos", color:"#555566", icon:"○" },
      runway:         runway      || null,
      sem:            sem         || { color:"#555566", label:"Sin datos", level:"gray", dark:"#0A0A12" },
      disciplinaBonus:disciplinaBonus || 0,
      reduccionBonus: reduccionBonus  || 0,
    };
  }, [appState?.income, appState?.expenses, appState?.budgets]);

  function addExpenseWithStreak(e) {
    const today  = new Date().toISOString().split("T")[0];
    const streak = appState.streakDays || [];
    updateState({
      expenses:   [e, ...(appState.expenses || [])],
      streakDays: streak.includes(today) ? streak : [...streak, today],
    });
  }

  function deleteExpense(id) {
    updateState({ expenses: (appState.expenses || []).filter(e => e.id !== id) });
  }

  function updateIncome(inc) {
    updateState({ income: inc });
  }

  function onboardingDone(data) {
    setAppState(data);
  }

  return (
    <FinanceContext.Provider value={{
      appState, setAppState, updateState, derived,
      frenoState, toggleFreno,
      isDark, isSurvival, themeKey, T: T || DARK_THEME, toggleTheme,
      addExpenseWithStreak, deleteExpense, updateIncome, onboardingDone,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be inside FinanceProvider");
  return ctx;
}
