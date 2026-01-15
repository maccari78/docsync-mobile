import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure Google Sign-In (only if available - not in Expo Go)
try {
  if (typeof GoogleSignin.configure === 'function') {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      offlineAccess: true,
    });
  }
} catch (e) {
  // GoogleSignin not available in this environment
}

export const googleAuthService = {
  /**
   * Sign in with Google
   * @returns {Promise<Object>} User data and token
   */
  signIn: async () => {
    try {
      // Check Google Play Services availability
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Perform Google Sign-In
      const userInfo = await GoogleSignin.signIn();

      // Get ID token from Google response
      const idToken = userInfo.data.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send ID token to backend for verification
      const response = await api.post('/auth/google', {
        id_token: idToken
      });

      // Store JWT token (same as email/password login)
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow
        throw { code: 'SIGN_IN_CANCELLED', message: 'Sign in cancelled' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is already in progress
        throw { code: 'IN_PROGRESS', message: 'Sign in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Google Play Services not available or outdated
        throw { code: 'PLAY_SERVICES_NOT_AVAILABLE', message: 'Google Play Services not available' };
      } else {
        // Other errors (network, backend, etc.)
        console.error('Google sign-in error:', error);
        throw error;
      }
    }
  },

  /**
   * Sign out from Google
   */
  signOut: async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Google sign-out error:', error);
      // Even if Google sign-out fails, clear local storage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
    }
  },

  /**
   * Check if user is signed in to Google
   * @returns {Promise<boolean>}
   */
  isSignedIn: async () => {
    try {
      // Check if GoogleSignin methods are available (may not be in dev/Expo Go)
      if (typeof GoogleSignin.isSignedIn !== 'function') {
        return false;
      }
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      // Silently return false - this is expected in development
      return false;
    }
  },

  /**
   * Get current Google user info (if signed in)
   * @returns {Promise<Object|null>}
   */
  getCurrentUser: async () => {
    try {
      if (typeof GoogleSignin.getCurrentUser !== 'function') {
        return null;
      }
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      return null;
    }
  }
};
