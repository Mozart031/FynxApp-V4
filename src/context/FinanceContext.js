import React, { createContext, useContext } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePersistence } from "../hooks/usePersistence";
import { useTheme } from "../hooks/useTheme";
import { score, calcRunway, semaphore, calcScoreTrend } from "../utils/finance";
import { DARK_THEME } from "../constants/themes";
import { checkAchievements } from "../utils/nudges";
import { usePostHog } from 'posthog-react-native';
import { DEMO_STATE } from "../constants/demoData";
import { haptic, setHapticsEnabled } from "../components/base";
import { useLanguage } from "./LanguageContext";

const DEMO_KEY = "@fynx_demo_mode";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { appState, setAppState, updateState, frenoState, toggleFreno } = usePersistence();
  const { isDark, isSurvival, themeKey, T, toggleTheme } = useTheme(appState);
  const posthog = usePostHog();
  const { lang, countryCode } = useLanguage();

  // ── Auto-save country code for admin geographic map ──────────────────────
  React.useEffect(() => {
    if (appState?.user && countryCode && countryCode !== "XX" && !appState.user.countryCode) {
      updateState({ user: { ...appState.user, countryCode } });
    }
  }, [countryCode, appState?.user?.countryCode]);

  // ── Sync Haptics Setting ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (appState?.user) {
      setHapticsEnabled(appState.user.hapticsEnabled !== false);
    }
  }, [appState?.user?.hapticsEnabled]);

  // ── Smart Notifications Scheduling ─────────────────────────────────────────
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        import("../services/notifications").then(notif => {
          notif.scheduleSmartNotifications(appState, derived);
        });
      }
    });
    return () => {
      subscription.remove();
    };
  }, [appState, derived]);

  // ── Demo Mode ────────────────────────────────────────────────────────────
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(DEMO_KEY).then(v => {
      if (v === "1") setIsDemoMode(true);
    }).catch(() => { });
  }, []);

  const toggleDemoMode = React.useCallback(async () => {
    setIsDemoMode(prev => {
      const next = !prev;
      AsyncStorage.setItem(DEMO_KEY, next ? "1" : "0").catch(() => { });
      return next;
    });
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // Métricas derivadas — en modo demo usa DEMO_STATE para que presupuestos y métricas sean correctos
  const stateForDerived = isDemoMode ? DEMO_STATE : appState;
  const derived = React.useMemo(() => {
    const income = stateForDerived?.income || [];
    const expenses = stateForDerived?.expenses || [];
    const budgets = stateForDerived?.budgets || {};
    const todayDate = new Date().getDate();
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth();

    const projectedInc = income.reduce((a, i) => a + (i.monthlyAmount || i.amount), 0);
    
    const availableInc = income.reduce((a, i) => {
      if (i.type !== "fijo") return a + i.amount;
      
      let count = 0;
      if (i.frequency === "semanal") {
        const targetDay = i.payDays?.[0] || 5; // Default Friday
        for (let d = 1; d <= todayDate; d++) {
          if (new Date(currentYear, currentMonthNum, d).getDay() === targetDay) {
            count++;
          }
        }
      } else {
        (i.payDays || []).forEach(d => {
          if (todayDate >= d) count++;
        });
      }
      return a + (count * i.amount);
    }, 0);

    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const balance = availableInc - totalExp; // Balance real en el bolsillo hoy
    const savePct = projectedInc > 0 ? Math.round(((projectedInc - totalExp) / projectedInc) * 100) : 0;
    
    // El score y los presupuestos siguen usando el ingreso PROYECTADO del mes para no penalizar a destiempo
    const { total: sc, s: scoreBreak, grade, disciplinaBonus, reduccionBonus, factors } = score(
      expenses, projectedInc, budgets,
      stateForDerived?.streakDays || [],
      stateForDerived?.weeklyHistory || [],
      lang
    );
    const runway = calcRunway(balance, expenses);
    const sem = semaphore(balance, projectedInc, sc);
    return {
      totalInc: projectedInc || 0, // Exported as totalInc for backwards compatibility with budget/score
      availableInc: availableInc || 0,
      totalExp: totalExp || 0,
      balance: balance || 0,
      savePct: savePct || 0,
      sc: sc || 0,
      scoreBreak: scoreBreak || {},
      grade: grade || { label: "Sin datos", color: "#666666", icon: "○" },
      runway: runway || null,
      sem: sem || { color: "#666666", label: "Sin datos", level: "gray", dark: "#000000" },
      disciplinaBonus: disciplinaBonus || 0,
      reduccionBonus: reduccionBonus || 0,
      factors: factors || [],
      scoreTrend: calcScoreTrend(stateForDerived?.scoreHistory)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateForDerived?.income, stateForDerived?.expenses, stateForDerived?.budgets, stateForDerived?.scoreHistory, isDemoMode]);

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

        // Disparar notificación push local para cada logro
        import("../services/notifications").then(notif => {
          newlyUnlocked.forEach(ach => {
            const isEs = lang === "es";
            notif.scheduleRealTimeAlert(
              isEs ? "🏆 Nuevo Logro Fynx" : "🏆 New Fynx Milestone",
              isEs ? `Has desbloqueado: ${ach.title.es || ach.title}` : `You unlocked: ${ach.title.en || ach.title}`
            );
          });
        });
      }, 0);
    }
  }, [appState]);

  const clearNewAchievements = React.useCallback(() => {
    setNewAchievements([]);
  }, []);

  const addExpenseWithStreak = React.useCallback((e) => {
    if (isDemoMode) return; // No guardar en modo demo
    posthog?.capture('gasto_registrado', { monto: e.amount, categoria: e.cat });
    const today = new Date().toISOString().split("T")[0];
    const streak = appState?.streakDays || [];

    // Alerta Inmediata si sobrepasa el presupuesto
    const catLimit = appState?.budgets?.[e.cat];
    if (catLimit > 0) {
      const catSpent = (appState?.expenses || [])
        .filter(x => x.cat === e.cat && x.date.startsWith(today.slice(0, 7)))
        .reduce((a, x) => a + x.amount, 0);
      const pctBefore = catSpent / catLimit;
      const pctAfter = (catSpent + e.amount) / catLimit;

      if (pctBefore <= 1 && pctAfter > 1) {
        haptic("warning");
        // Schedule immediate local notification for Real-time alert
        import("../services/notifications").then(notif => {
          notif.scheduleRealTimeAlert(
            lang === "en" ? "⚠️ Budget Exceeded" : "⚠️ Presupuesto Excedido",
            lang === "en"
              ? `You just went over your budget limit for ${e.cat}. Adjust your strategy!`
              : `Acabas de superar el límite de tu presupuesto en ${e.cat}. ¡Ajusta tu estrategia!`
          );
        });
      } else if (pctBefore <= 0.85 && pctAfter > 0.85) {
        // Schedule immediate local notification for Real-time alert
        import("../services/notifications").then(notif => {
          notif.scheduleRealTimeAlert(
            lang === "en" ? "👀 Watch your budget" : "👀 Ojo con tu presupuesto",
            lang === "en"
              ? `You've spent over 85% of your ${e.cat} budget. Tread carefully.`
              : `Llevas más del 85% gastado en ${e.cat}. Ve con cuidado.`
          );
        });
      } else {
        haptic("success");
      }
    } else {
      haptic("success");
    }

    updateState({
      expenses: [e, ...(appState?.expenses || [])],
      streakDays: streak.includes(today) ? streak : [...streak, today],
    });
  }, [appState, posthog, isDemoMode]);

  const deleteExpense = React.useCallback((id) => {
    haptic("heavy");
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
    if (isDemoMode) {
      return {
        ...DEMO_STATE,
        onboarded: true,
        setupCompleted: true,
        user: {
          ...DEMO_STATE.user,
          email: appState?.user?.email || "carlos@ejemplo.com", // Conservar email real para visibilidad del toggle
          premium: true
        }
      };
    }

    return appState;
  }, [appState, isDemoMode]);

  const ctxValue = React.useMemo(() => ({
    appState: enhancedAppState,
    setAppState: isDemoMode ? () => { } : setAppState,
    updateState: isDemoMode ? () => { } : updateState,
    derived,
    frenoState, toggleFreno,
    isDark, isSurvival, themeKey, T: T || DARK_THEME, toggleTheme,
    addExpenseWithStreak, deleteExpense, updateIncome, onboardingDone,
    newAchievements, clearNewAchievements,
    isDemoMode, toggleDemoMode,
  }), [enhancedAppState, derived, frenoState, isDark, isSurvival, themeKey, T, addExpenseWithStreak, deleteExpense, updateIncome, onboardingDone, newAchievements, clearNewAchievements, isDemoMode, toggleDemoMode, setAppState, updateState]);

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
