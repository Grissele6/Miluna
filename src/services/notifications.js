import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseISO } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('miluna-default', {
      name: 'Miluna',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#9B59E8',
    });
  }
  return req.granted;
}

export async function cancel(notifId) {
  if (!notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch (_) {
    // no-op
  }
}

export async function scheduleDaily({ hour, minute, title, body }) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'miluna-default' : undefined,
    },
  });
}

export async function scheduleOn({ dateISO, hour, minute, title, body }) {
  const d = parseISO(dateISO);
  d.setHours(hour ?? 9, minute ?? 0, 0, 0);
  if (d.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      date: d,
      channelId: Platform.OS === 'android' ? 'miluna-default' : undefined,
    },
  });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
