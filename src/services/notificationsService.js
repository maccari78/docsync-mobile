// src/services/notificationsService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar comportamiento de las notificaciones (solo si están disponibles)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('Notifications not available in this environment:', error.message);
}

export const notificationsService = {
  /**
   * Solicitar permisos de notificaciones al usuario
   */
  async requestPermissions() {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      return finalStatus;
    } catch (error) {
      console.log('Notifications not supported:', error.message);
      return null;
    }
  },

  /**
   * Obtener token de Expo Push Notifications
   */
  async getExpoPushToken() {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Mostrar notificación local (para mensajes recibidos cuando app está en foreground)
   */
  async showLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Inmediato
      });
    } catch (error) {
      // Silently fail if notifications not supported
      console.log('Could not show notification:', error.message);
    }
  },

  /**
   * Configurar listener para cuando se toca una notificación
   */
  addNotificationResponseListener(callback) {
    try {
      return Notifications.addNotificationResponseReceivedListener(callback);
    } catch (error) {
      console.log('Notification listeners not supported');
      return null;
    }
  },

  /**
   * Configurar listener para notificaciones recibidas mientras app está en foreground
   */
  addNotificationReceivedListener(callback) {
    try {
      return Notifications.addNotificationReceivedListener(callback);
    } catch (error) {
      console.log('Notification listeners not supported');
      return null;
    }
  }
};
