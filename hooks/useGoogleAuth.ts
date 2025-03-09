import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import { getRedirectUri, logAllPossibleRedirectUris } from '@/utils/authConfig';

// Register the redirect URI for web browser authentication
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log all possible redirect URIs on component mount
  useEffect(() => {
    logAllPossibleRedirectUris();
  }, []);

  // Get the redirect URI using our helper function
  const redirectUri = getRedirectUri();

  // Log the redirect URI to help with debugging
  console.log('Using redirect URI:', redirectUri);

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

      console.log('Starting Google sign-in with redirect URI:', redirectUri);

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

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw error;
      }

      // Open the browser for authentication
      if (data?.url) {
        console.log('Opening auth URL:', data.url);

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        console.log('Auth result type:', result.type);

        if (result.type === 'success') {
          // Handle the successful authentication
          const { url } = result;
          console.log('Success URL:', url);

          // If we're using the code flow, exchange the code for a session
          if (responseType === AuthSession.ResponseType.Code) {
            const code = url.split('code=')[1]?.split('&')[0];

            if (!code) {
              throw new Error('No code parameter found in redirect URL');
            }

            // Exchange the code for a session
            const { error: sessionError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (sessionError) {
              console.error('Session exchange error:', sessionError);
              throw sessionError;
            }
          }
        } else {
          console.log('Auth was dismissed or failed:', result);
          throw new Error('Authentication was cancelled or failed');
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
