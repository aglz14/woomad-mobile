import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect } from 'react';

export default function AdminScreen() {
  const { isAdmin } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin]);

  // Use any type for route to avoid type errors with dynamic routes
  const navigateTo = (route: any) => {
    router.push(route);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>
      <Text style={styles.subtitle}>Gestiona tu aplicación</Text>

      <View style={styles.menuGrid}>
        <Pressable
          style={styles.menuItem}
          onPress={() => navigateTo('/(admin)/malls')}
        >
          <Text style={styles.menuItemText}>Centros Comerciales</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => navigateTo('/(admin)/stores')}
        >
          <Text style={styles.menuItemText}>Tiendas</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => navigateTo('/(admin)/promotions')}
        >
          <Text style={styles.menuItemText}>Promociones</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => navigateTo('/(admin)/users')}
        >
          <Text style={styles.menuItemText}>Usuarios</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    marginBottom: 24,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    // Using boxShadow instead of shadow* properties
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
