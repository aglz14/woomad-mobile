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

      // Always use the code response type with Expo's proxy
      const responseType = AuthSession.ResponseType.Code;

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

        // Use Expo's AuthSession to handle the authentication flow
        const result = (await AuthSession.startAsync({
          authUrl: data.url,
          returnUrl: redirectUri,
        })) as AuthSession.AuthSessionResult;

        console.log('Auth result type:', result.type);

        if (result.type === 'success') {
          // Handle the successful authentication
          const { params } = result;
          console.log('Success params:', params);

          // If we have a code, exchange it for a session
          if (params?.code) {
            console.log('Exchanging code for session');

            // Exchange the code for a session
            const { error: sessionError } =
              await supabase.auth.exchangeCodeForSession(params.code);

            if (sessionError) {
              console.error('Session exchange error:', sessionError);
              throw sessionError;
            }
          } else {
            console.warn('No code parameter found in redirect response');
          }
        } else if (result.type === 'error') {
          console.error('Auth error:', result.error);
          throw new Error(result.error?.message || 'Authentication failed');
        } else {
          console.log('Auth was dismissed or failed:', result.type);
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
