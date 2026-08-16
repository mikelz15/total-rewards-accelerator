/**
 * Pilot push-notification helpers (Expo Notifications).
 * Enable for design-partner reminders — e.g. "merit cycle demo ready".
 */
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "tra.pushToken";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulator: local notifications still work; remote push needs a device
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "TRA Pilot",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
    ).data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    // Missing EAS projectId is OK until store build is configured
    return null;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** Local demo notification — works on simulator without Expo push servers. */
export async function schedulePilotLocalReminder(seconds = 5): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Total Rewards Accelerator",
      body: "Pilot reminder: equity + merit sample is ready to walk through.",
      data: { screen: "auditor" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelAllPilotNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
