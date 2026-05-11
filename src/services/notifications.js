import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

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
    console.log("No se concedieron permisos para notificaciones.");
    return false;
  }
  
  return true;
}

export async function scheduleSmartNotifications(appState, derived) {
  // Cancel previous notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const user = appState?.user || {};
  if (user.notificationsEnabled === false) return; // Feature toggle

  // Feature 1: Morning Intelligence (9:00 AM default)
  const mHour = user.morningHour !== undefined ? user.morningHour : 9;
  const cur = user.currency || "RD$";
  
  // TARS Morning Content Logic
  let morningTitle = "☀️ Fynx Intelligence";
  let morningBody = `Tu balance de hoy es ${cur}${derived?.balance?.toLocaleString() || 0}. ¡Vamos a cuidarlo!`;

  const topExp = [...(appState?.expenses || [])].sort((a,b) => b.amount - a.amount)[0];
  if (derived?.savePct >= 20) {
    morningBody = `Buen ritmo. Estás ahorrando el ${derived.savePct}% de tus ingresos. Mantén esa racha.`;
  } else if (topExp) {
    morningBody = `Ayer tu mayor gasto fue en ${topExp.cat} (${cur}${topExp.amount}). Ten cuidado hoy.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: morningTitle, body: morningBody, sound: true, badge: 1 },
    trigger: { type: "daily", hour: mHour, minute: 0 },
  });

  // Feature 2: Evening Check-in (8:00 PM default)
  const eHour = user.eveningHour !== undefined ? user.eveningHour : 20;
  
  const today = new Date().toISOString().split("T")[0];
  const registeredToday = (appState?.expenses || []).filter(e => e.date.startsWith(today)).length > 0;
  
  let eveningTitle = "🌙 Fynx Intelligence";
  let eveningBody = "¿No gastaste nada hoy o se te olvidó registrarlo? Entra a Fynx y mantén tu reporte al día.";
  if (registeredToday) {
    eveningBody = "Vi que registraste movimientos hoy. Excelente trabajo manteniendo tu disciplina financiera.";
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: eveningTitle, body: eveningBody, sound: true, badge: 1 },
    trigger: { type: "daily", hour: eHour, minute: 0 },
  });
}

// Feature 3: Real Time Alert
export async function scheduleRealTimeAlert(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      vibrate: [0, 250, 250, 250],
      badge: 1,
    },
    trigger: null, // trigger: null means immediate
  });
}
