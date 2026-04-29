import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
      lightColor: "#00FF9D",
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

export async function scheduleDailyReminder() {
  // Cancelamos anteriores para no duplicar
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 ¡No pierdas tu racha!",
      body: "Entra a Fynx y registra tus movimientos de hoy para mantener tu salud financiera al máximo.",
      sound: true,
    },
    trigger: {
      hour: 20, // 8 PM
      minute: 0,
      repeats: true,
    },
  });
}
