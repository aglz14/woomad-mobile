import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AdminTabScreen() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Redirect to admin panel
    if (isAdmin) {
      router.replace('/(admin)');
    } else {
      // Redirect non-admin users to home
      router.replace('/(tabs)');
    }
  }, [isAdmin]);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF4B4B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
