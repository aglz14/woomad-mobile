import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting Google sign-in');

      // Get the Google OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            Platform.OS === 'web'
              ? window.location.origin
              : 'woomad://auth/callback',
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

        // Open the URL in the browser
        await Linking.openURL(data.url);
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
