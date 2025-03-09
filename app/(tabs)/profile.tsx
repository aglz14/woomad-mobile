import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import {
  Bell,
  Settings,
  ChevronRight,
  User,
  Plus,
  LogIn,
  UserPlus,
  Info,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useState, useEffect } from 'react';

// Component for guest users to manage notification preferences
function GuestNotificationPreferences() {
  const {
    isEnabled,
    hasPermission,
    hasLocationPermission,
    userPreference,
    notificationRadius,
    registerForPushNotificationsAsync,
    requestLocationPermission,
    updateLocalPreferences,
  } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleNotifications(value: boolean) {
    setLoading(true);
    setError(null);

    try {
      if (value) {
        // First check if we have location permission
        if (!hasLocationPermission) {
          // Request location permission first
          const locationGranted = await requestLocationPermission();
          if (!locationGranted) {
            setError(
              'Se requiere permiso de ubicación para las notificaciones'
            );
            return;
          }
        }

        // If enabling notifications, request permissions and register
        const success = await registerForPushNotificationsAsync();
        if (!success) {
          setError(
            'No se pudieron habilitar las notificaciones. Por favor, verifica los permisos de tu dispositivo.'
          );
        }
      } else {
        // If disabling notifications, just update local storage
        await updateLocalPreferences(false, notificationRadius);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setError('Ocurrió un error al cambiar las notificaciones');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.guestNotificationSection}>
      <Text style={styles.guestNotificationTitle}>Notificaciones</Text>

      <View style={styles.guestNotificationItem}>
        <View style={styles.guestNotificationInfo}>
          <Text style={styles.guestNotificationLabel}>
            Notificaciones de centros comerciales cercanos
          </Text>
          <Text style={styles.guestNotificationDescription}>
            Recibe alertas cuando estés cerca de un centro comercial (4 km)
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: '#e9ecef', true: '#FF4B4B' }}
          disabled={loading}
        />
      </View>

      {error && <Text style={styles.guestPermissionNote}>{error}</Text>}

      {(!hasPermission || !hasLocationPermission) && !error && (
        <Text style={styles.guestPermissionNote}>
          Se requieren permisos de ubicación y notificaciones para esta función
        </Text>
      )}

      {isEnabled && (
        <Text style={styles.guestNotificationSuccess}>
          ¡Notificaciones activadas! Recibirás alertas cuando estés cerca de
          centros comerciales.
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { session, signOut, isAdmin } = useAuth();
  const { isEnabled, fetchUserPreferences } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch notification preferences when the component mounts
  useEffect(() => {
    if (session) {
      fetchUserPreferences();
    }
  }, [session]);

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

  // Render different UI for authenticated and unauthenticated users
  if (!session) {
    // Use a conditional to handle web platform differently
    const ContentContainer = Platform.OS === 'web' ? View : ScrollView;

    return (
      <View style={styles.container}>
        <View style={styles.guestHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Mi Perfil</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para acceder a todas las funciones
            </Text>
          </View>
        </View>

        <ContentContainer
          style={styles.guestContentScroll}
          contentContainerStyle={styles.guestContentContainer}
        >
          <View style={styles.authButtonsContainer}>
            <Pressable
              style={styles.authButton}
              onPress={() => router.push('/auth/login')}
            >
              <LogIn size={22} color="#ffffff" />
              <Text style={styles.authButtonText}>Iniciar Sesión</Text>
            </Pressable>

            <Pressable
              style={[styles.authButton, styles.signupButton]}
              onPress={() => router.push('/auth/signup')}
            >
              <UserPlus size={22} color="#ffffff" />
              <Text style={styles.authButtonText}>Crear Cuenta</Text>
            </Pressable>
          </View>

          {/* Add notification preferences for guest users */}
          {Platform.OS !== 'web' && <GuestNotificationPreferences />}

          <View style={styles.guestInfoContainer}>
            <View style={styles.guestInfoHeader}>
              <Info size={20} color="#1a1a1a" />
              <Text style={styles.guestInfoTitle}>
                ¿Por qué iniciar sesión?
              </Text>
            </View>
            <View style={styles.guestInfoItem}>
              <Text style={styles.guestInfoBullet}>•</Text>
              <Text style={styles.guestInfoText}>
                Recibe notificaciones personalizadas de promociones
              </Text>
            </View>
            <View style={styles.guestInfoItem}>
              <Text style={styles.guestInfoBullet}>•</Text>
              <Text style={styles.guestInfoText}>
                Guarda tus centros comerciales favoritos
              </Text>
            </View>
            <View style={styles.guestInfoItem}>
              <Text style={styles.guestInfoBullet}>•</Text>
              <Text style={styles.guestInfoText}>
                Personaliza tu experiencia en la aplicación
              </Text>
            </View>
          </View>
        </ContentContainer>
      </View>
    );
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Preferencias</Text>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={24} color="#FF4B4B" />
              <Text style={styles.menuItemText}>Notificaciones</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.notificationStatus}>
                {isEnabled ? 'Activadas' : 'Desactivadas'}
              </Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
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
                <Text style={styles.menuItemText}>Panel de Administrador</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Legal</Text>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/terms_conditions')}
          >
            <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            <ChevronRight size={20} color="#666666" />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/privacy_policy')}
          >
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
  guestHeader: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    lineHeight: 22,
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
  contentContainer: {
    paddingBottom: 30,
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
  guestContentScroll: {
    flex: 1,
    padding: 0,
  },
  guestContentContainer: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    flexGrow: 1,
  },
  authButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  signupButton: {
    backgroundColor: '#1a1a1a',
  },
  guestInfoContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guestInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  guestInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
  },
  guestInfoBullet: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
    marginRight: 8,
  },
  guestInfoText: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 22,
    flex: 1,
  },
  guestNotificationSection: {
    marginTop: 8,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guestNotificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  guestNotificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestNotificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  guestNotificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  guestNotificationDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  guestPermissionNote: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 12,
    lineHeight: 20,
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4B4B',
  },
  guestNotificationSuccess: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 12,
    lineHeight: 20,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
});
