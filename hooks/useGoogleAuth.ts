import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Register the redirect URI for web browser authentication
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect URI based on the platform
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'woomad', // Replace with your app's scheme
    path: 'auth/callback',
  });

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a response type based on the platform
      const responseType =
        Platform.OS === 'web'
          ? AuthSession.ResponseType.Token
          : AuthSession.ResponseType.Code;

      // Get the Google OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // Open the browser for authentication
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          // Handle the successful authentication
          const { url } = result;

          // If we're using the code flow, exchange the code for a session
          if (responseType === AuthSession.ResponseType.Code) {
            const code = url.split('code=')[1].split('&')[0];

            // Exchange the code for a session
            const { error: sessionError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'An error occurred during Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
  };
}
