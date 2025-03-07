import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth'; 

export default function RootLayout() {
  useFrameworkReady();
  const { isLoading, session, authError } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{authError}</Text>
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
  error: {
    color: '#FF4B4B',
    fontSize: 16,
    textAlign: 'center',
    padding: 20
  },
});