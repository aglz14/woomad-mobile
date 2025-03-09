import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the correct redirect URI based on the environment
export function getRedirectUri(): string {
  // For Expo Go
  if (Constants.appOwnership === 'expo') {
    // Format: https://auth.expo.io/@your-username/your-app-slug
    return AuthSession.makeRedirectUri({
      useProxy: true,
    });
  }

  // For standalone apps or development builds
  if (Platform.OS === 'web') {
    // For web, use the current URL
    return window.location.origin;
  } else {
    // For native apps, use the scheme
    return AuthSession.makeRedirectUri({
      scheme: 'woomad',
      path: 'auth/callback',
      native: true,
    });
  }
}

// Log all possible redirect URIs for debugging
export function logAllPossibleRedirectUris() {
  console.log('=== POSSIBLE REDIRECT URIS ===');

  // Standard URI with scheme
  console.log(
    'Standard:',
    AuthSession.makeRedirectUri({
      scheme: 'woomad',
      path: 'auth/callback',
    })
  );

  // Native URI
  console.log(
    'Native:',
    AuthSession.makeRedirectUri({
      scheme: 'woomad',
      path: 'auth/callback',
      native: true,
    })
  );

  // Expo proxy URI
  console.log(
    'Expo Proxy:',
    AuthSession.makeRedirectUri({
      useProxy: true,
    })
  );

  // Web URI
  if (Platform.OS === 'web') {
    console.log('Web Origin:', window.location.origin);
  }

  console.log('==============================');
}
