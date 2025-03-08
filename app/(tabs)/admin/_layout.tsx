import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // Redirect non-admin users to the home tab
      router.replace('/(tabs)');
    }
  }, [isLoading, isAdmin]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  // Only render the admin stack if the user is an admin
  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Acceso no autorizado</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Panel de Administración',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#FF4B4B',
        }}
      />
      <Stack.Screen
        name="malls"
        options={{
          title: 'Administrar Plazas',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#FF4B4B',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4B4B',
    fontWeight: '500',
  },
});
