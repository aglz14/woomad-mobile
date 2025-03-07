import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, router } from 'expo-router';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}