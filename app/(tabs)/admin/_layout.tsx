import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Redirect non-admin users away from admin routes
  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
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