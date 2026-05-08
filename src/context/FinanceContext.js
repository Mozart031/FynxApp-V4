import React, { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePersistence } from "../hooks/usePersistence";
import { useTheme }       from "../hooks/useTheme";
import { score, calcRunway, semaphore, calcScoreTrend } from "../utils/finance";
import { DARK_THEME } from "../constants/themes";
import { checkAchievements } from "../utils/nudges";
import { usePostHog } from 'posthog-react-native';
import { DEMO_STATE } from "../constants/demoData";

const DEMO_KEY = "@fynx_demo_mode";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { appState, setAppState, updateState, frenoState, toggleFreno } = usePersistence();
  const { isDark, isSurvival, themeKey, T, toggleTheme } = useTheme(appState);
  const posthog = usePostHog();

  // ── Demo Mode ────────────────────────────────────────────────────────────
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(DEMO_KEY).then(v => {
      if (v === "1") setIsDemoMode(true);
    }).catch(() => {});
  }, []);

  const toggleDemoMode = React.useCallback(async () => {
    setIsDemoMode(prev => {
      const next = !prev;
      AsyncStorage.setItem(DEMO_KEY, next ? "1" : "0").catch(() => {});
      return next;
    });
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // Métricas derivadas — calculadas una vez, disponibles en toda la app
  const derived = React.useMemo(() => {
    const income   = appState?.income   || [];
    const expenses = appState?.expenses || [];
    const budgets  = appState?.budgets  || {};
    const totalInc = income.reduce((a, i) => a + i.amount, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const balance  = totalInc - totalExp;
    const savePct  = totalInc > 0 ? Math.round((balance / totalInc) * 100) : 0;
    const { total: sc, s: scoreBreak, grade, disciplinaBonus, reduccionBonus, factors } = score(
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
      grade:          grade       || { label:"Sin datos", color:"#666666", icon:"○" },
      runway:         runway      || null,
      sem:            sem         || { color:"#666666", label:"Sin datos", level:"gray", dark:"#000000" },
      disciplinaBonus:disciplinaBonus || 0,
      reduccionBonus: reduccionBonus  || 0,
      factors:        factors         || [],
      scoreTrend:     calcScoreTrend(appState?.scoreHistory)
    };
  }, [appState?.income, appState?.expenses, appState?.budgets, appState?.scoreHistory]);

  // Daily Score Persistence (Fase 1)
  React.useEffect(() => {
    if (appState && derived.sc > 0) {
      const today = new Date().toISOString().split("T")[0];
      const history = appState.scoreHistory || {};
      if (history[today] !== derived.sc) {
        // Usa setTimeout para evitar warnings de React por updates en cascada durante el render
        setTimeout(() => {
          updateState({ scoreHistory: { ...history, [today]: derived.sc } });
        }, 0);
      }
    }
  }, [derived.sc, appState?.scoreHistory]);

  const [newAchievements, setNewAchievements] = React.useState([]);

  // Check achievements
  React.useEffect(() => {
    if (!appState) return;
    const unlockedIds = appState.achievements || [];
    const newlyUnlocked = checkAchievements(appState, unlockedIds);
    if (newlyUnlocked.length > 0) {
      setTimeout(() => {
        updateState({ achievements: [...unlockedIds, ...newlyUnlocked.map(a => a.id)] });
        setNewAchievements(prev => [...prev, ...newlyUnlocked]);
      }, 0);
    }
  }, [appState]);

  const clearNewAchievements = React.useCallback(() => {
    setNewAchievements([]);
  }, []);

  const addExpenseWithStreak = React.useCallback((e) => {
    posthog?.capture('gasto_registrado', { monto: e.amount, categoria: e.cat });
    const today  = new Date().toISOString().split("T")[0];
    const streak = appState?.streakDays || [];
    updateState({
      expenses:   [e, ...(appState?.expenses || [])],
      streakDays: streak.includes(today) ? streak : [...streak, today],
    });
  }, [appState, posthog]);

  const deleteExpense = React.useCallback((id) => {
    updateState({ expenses: (appState?.expenses || []).filter(e => e.id !== id) });
  }, [appState]);

  const updateIncome = React.useCallback((inc) => {
    updateState({ income: inc });
  }, []);

  const onboardingDone = React.useCallback((data) => {
    setAppState(data);
  }, []);

  const enhancedAppState = React.useMemo(() => {
    // Demo mode: usar datos ficticios sin tocar datos reales
    if (isDemoMode) return { ...DEMO_STATE, onboarded: true, setupCompleted: true };
    if (appState?.user && appState.user.email === "ericksonp032102@gmail.com") {
      return { ...appState, user: { ...appState.user, premium: true } };
    }
    return appState;
  }, [appState, isDemoMode]);

  const ctxValue = React.useMemo(() => ({
    appState: enhancedAppState, setAppState, updateState, derived,
    frenoState, toggleFreno,
    isDark, isSurvival, themeKey, T: T || DARK_THEME, toggleTheme,
    addExpenseWithStreak, deleteExpense, updateIncome, onboardingDone,
    newAchievements, clearNewAchievements,
    isDemoMode, toggleDemoMode,
  }), [enhancedAppState, derived, frenoState, isDark, isSurvival, themeKey, T, addExpenseWithStreak, deleteExpense, updateIncome, onboardingDone, newAchievements, clearNewAchievements, isDemoMode, toggleDemoMode]);

  return (
    <FinanceContext.Provider value={ctxValue}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be inside FinanceProvider");
  return ctx;
}
