import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function MallsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Centro Comercial',
          headerShown: true,
          headerBackTitle: 'Volver',
          href: null,
        }}
      />
    </Stack>
  );
}