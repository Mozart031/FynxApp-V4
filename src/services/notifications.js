import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted.");
    return false;
  }

  return true;
}

export async function scheduleSmartNotifications(appState, derived) {
  // Cancel previous notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const user = appState?.user || {};
  if (user.notificationsEnabled === false) return; // Feature toggle

  // Read user's chosen language from storage (same key used by LanguageContext)
  let lang = "es";
  try {
    const storedLang = await AsyncStorage.getItem("@fynx_lang");
    if (storedLang === "en" || storedLang === "es") lang = storedLang;
  } catch { /* fallback to es */ }

  const cur = user.currency || "RD$";

  // ── Feature 1: Morning Intelligence ────────────────────────────────────────
  const mHour = user.morningHour !== undefined ? user.morningHour : 9;

  let morningTitle = "☀️ Fynx Intelligence";
  let morningBody = lang === "en"
    ? `Your balance today is ${cur}${derived?.balance?.toLocaleString() || 0}. Let's take care of it!`
    : `Tu balance de hoy es ${cur}${derived?.balance?.toLocaleString() || 0}. ¡Vamos a cuidarlo!`;

  const topExp = [...(appState?.expenses || [])].sort((a, b) => b.amount - a.amount)[0];
  if (derived?.savePct >= 20) {
    morningBody = lang === "en"
      ? `Good pace. You're saving ${derived.savePct}% of your income. Keep that streak going.`
      : `Buen ritmo. Estás ahorrando el ${derived.savePct}% de tus ingresos. Mantén esa racha.`;
  } else if (topExp) {
    morningBody = lang === "en"
      ? `Yesterday your biggest expense was in ${topExp.cat} (${cur}${topExp.amount}). Be careful today.`
      : `Ayer tu mayor gasto fue en ${topExp.cat} (${cur}${topExp.amount}). Ten cuidado hoy.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: morningTitle, body: morningBody, sound: true, badge: 1 },
    trigger: { type: 'daily', hour: mHour, minute: 0 },
  });

  // ── Feature 2: Evening Check-in ────────────────────────────────────────────
  const eHour = user.eveningHour !== undefined ? user.eveningHour : 20;

  const today = new Date().toISOString().split("T")[0];
  const registeredToday = (appState?.expenses || []).filter(e => e.date.startsWith(today)).length > 0;

  let eveningTitle = "🌙 Fynx Intelligence";
  let eveningBody = lang === "en"
    ? "Didn't spend anything today or forgot to log it? Open Fynx and keep your report up to date."
    : "¿No gastaste nada hoy o se te olvidó registrarlo? Entra a Fynx y mantén tu reporte al día.";
  if (registeredToday) {
    eveningBody = lang === "en"
      ? "I see you logged transactions today. Excellent work keeping your financial discipline."
      : "Vi que registraste movimientos hoy. Excelente trabajo manteniendo tu disciplina financiera.";
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: eveningTitle, body: eveningBody, sound: true, badge: 1 },
    trigger: { type: 'daily', hour: eHour, minute: 0 },
  });

  // ── Feature 4: Weekly Summary (Sundays at 8 PM) ─────────────────────────────
  if (user.weeklySummaryEnabled !== false) {
    let weeklyTitle = "📈 TARS Report";
    let weeklyBody = lang === "en"
      ? `Your week is closing with a score of ${Math.round(derived?.total || 0)}. Check your full summary.`
      : `Tu semana cierra con un score de ${Math.round(derived?.total || 0)}. Mira tu resumen completo.`;

    await Notifications.scheduleNotificationAsync({
      content: { 
        title: weeklyTitle, 
        body: weeklyBody, 
        sound: true, 
        badge: 1,
        data: { screen: "WeeklySummary" }
      },
      trigger: {
        type: 'weekly',
        weekday: 1,
        hour: 20,
        minute: 0,
      },
    });
  }

  // ── Feature 5: Debt Due Reminders ──────────────────────────────────────────
  if (appState?.debts && appState.debts.length > 0) {
    appState.debts.forEach(async (d) => {
      if (d.dueDay && !isNaN(Number(d.dueDay))) {
        let nDay = Number(d.dueDay) - 2;
        if (nDay <= 0) nDay += 28; // fallback to roughly end of previous month

        let dTitle = "⚠️ " + (lang === "en" ? "Upcoming Payment" : "Pago Próximo");
        let dBody = lang === "en" 
          ? `Your payment for ${d.name} is due in 2 days. Don't forget!`
          : `Tu pago de ${d.name} vence en 2 días. ¡No lo olvides!`;

        await Notifications.scheduleNotificationAsync({
          content: { title: dTitle, body: dBody, sound: true, badge: 1 },
          trigger: { type: 'monthly', day: nDay, hour: 10, minute: 0 },
        });
      }
    });
  }

  // ── Feature 6: Fixed Payment Reminders ─────────────────────────────────────
  if (appState?.reminders && appState.reminders.length > 0) {
    appState.reminders.forEach(async (r) => {
      if (r.day && !isNaN(Number(r.day))) {
        let nDay = Number(r.day) - 2;
        if (nDay <= 0) nDay += 28;

        let rTitle = "📅 " + (lang === "en" ? "Upcoming Subscription" : "Suscripción Próxima");
        let rBody = lang === "en" 
          ? `Your fixed payment for ${r.name} is due in 2 days. Don't forget to pay it.`
          : `Tu pago fijo de ${r.name} vence en 2 días. ¡No te olvides de pagarlo!`;

        await Notifications.scheduleNotificationAsync({
          content: { title: rTitle, body: rBody, sound: true, badge: 1 },
          trigger: { type: 'monthly', day: nDay, hour: 11, minute: 0 },
        });
      }
    });
  }
}

// ── Feature 3: Real-time Alert ─────────────────────────────────────────────
// title and body are passed already localized by the caller (FinanceContext)
export async function scheduleRealTimeAlert(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      vibrate: [0, 250, 250, 250],
      badge: 1,
    },
    trigger: null, // immediate
  });
}
