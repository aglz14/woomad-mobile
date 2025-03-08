import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [isLoading, session]);

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