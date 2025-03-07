import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAdmin]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Panel de Administración',
          headerShown: true,
        }}
      />
    </Stack>
  );
}