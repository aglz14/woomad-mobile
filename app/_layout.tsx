import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  useFrameworkReady();
  const { isLoading, session } = useAuth();

  // Handle deep links for authentication
  useEffect(() => {
    // Handle incoming links
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);

      if (event.url.startsWith('woomad://auth/callback')) {
        // Extract the code from the URL
        const url = new URL(event.url);
        const code = url.searchParams.get('code');

        if (code) {
          console.log('Auth code received, exchanging for session');
          try {
            // Exchange the code for a session
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error('Error exchanging code for session:', error);
            } else {
              console.log('Successfully authenticated with Google');
            }
          } catch (err) {
            console.error('Error in auth callback:', err);
          }
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Clean up
    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="auth" />
        )}
        <Stack.Screen
          name="(admin)"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="center_details/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="store_details/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="terms_conditions"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="privacy_policy"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
