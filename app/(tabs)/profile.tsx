import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { Bell, Heart, Settings, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { session, signOut, isAdmin } = useAuth();
  const { isEnabled, registerForPushNotificationsAsync } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mi Perfil</Text>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {session?.user?.user_metadata?.full_name || 'Usuario'}
            </Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Preferencias</Text>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={24} color={isEnabled ? '#FF4B4B' : '#666666'} />
              <Text style={styles.menuItemText}>Notificaciones</Text>
              <Text style={styles.notificationStatus}>
                {isEnabled ? 'Activadas' : 'Desactivadas'}
              </Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Heart size={24} color="#666666" />
              <Text style={styles.menuItemText}>Favoritos</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={24} color="#666666" />
              <Text style={styles.menuItemText}>Configuración</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administración</Text>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/(admin)')}
            >
              <View style={styles.menuItemLeft}>
                <Settings size={24} color="#FF4B4B" />
                <Text style={styles.menuItemText}>Panel de Administración</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Legal</Text>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Política de Privacidad</Text>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userInfo: {
    marginTop: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 20,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  notificationStatus: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
