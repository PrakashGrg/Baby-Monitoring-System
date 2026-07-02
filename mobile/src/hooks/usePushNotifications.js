import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // replaces deprecated shouldShowAlert
    shouldShowList:   true,   // show in notification list
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

// ── Send a local notification immediately ─────────────────────────────────────
export async function sendLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.log('[NOTIF] Error:', e.message);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function usePushNotifications() {
  const notificationListener = useRef(null);
  const responseListener     = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('[NOTIF] Permission not granted');
        return;
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('baby-alerts', {
          name:             'Baby Alerts',
          importance:       Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor:       '#FF7A7A',
          sound:            'default',
        });
      }
      console.log('[NOTIF] Local notifications ready');
    })();

    // Use .addListener and call .remove() to unsubscribe
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('[NOTIF] Received:', n.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
      console.log('[NOTIF] Tapped:', r.notification.request.content.title);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}