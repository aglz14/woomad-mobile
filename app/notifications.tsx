import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type UserPreferences = {
  notifications_enabled: boolean;
  notification_radius: number;
};

export default function NotificationsScreen() {
  const { session } = useAuth();
  const {
    isEnabled,
    hasPermission,
    hasLocationPermission,
    userPreference,
    registerForPushNotificationsAsync,
    requestLocationPermission,
    fetchUserPreferences,
  } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications_enabled: false,
    notification_radius: 4,
  });
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPreferences();
      fetchUserPreferencesFromDB();
    }
  }, [session?.user?.id]);

  // Update local preferences when userPreference changes
  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      notifications_enabled: userPreference,
    }));
  }, [userPreference]);

  // Don't fetch preferences if there's no user ID
  useEffect(() => {
    if (!session?.user?.id) {
      setError('No se pudo cargar la sesión del usuario');
      setLoading(false);
    }
  }, [session]);

  async function fetchUserPreferencesFromDB() {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('No user ID available');
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const defaultPreferences = {
          user_id: session.user.id,
          notifications_enabled: false,
          notification_radius: 4,
        };

        const { error: insertError } = await supabase
          .from('user_preferences')
          .upsert([defaultPreferences]);

        if (insertError) throw insertError;

        setPreferences(defaultPreferences);
      } else if (error) {
        throw error;
      } else {
        setPreferences({
          notifications_enabled: data.notifications_enabled || false,
          notification_radius: data.notification_radius || 4,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Error al cargar las preferencias');
      // Set default preferences even if there's an error
      setPreferences({
        notifications_enabled: false,
        notification_radius: 4,
      });
    } finally {
      setLoading(false);
    }
  }

  async function updatePreferences(updates: Partial<UserPreferences>) {
    try {
      setSaving(true);
      setError(null);
      setPermissionError(null);

      if (!session?.user?.id) {
        throw new Error('No user ID available');
      }

      // If enabling notifications, check permissions first
      if (updates.notifications_enabled === true) {
        // Check location permission first
        if (!hasLocationPermission) {
          const locationGranted = await requestLocationPermission();
          if (!locationGranted) {
            setPermissionError(
              'Se requiere permiso de ubicación para las notificaciones'
            );
            setSaving(false);
            return;
          }
        }

        // Then check notification permission
        if (!hasPermission) {
          const success = await registerForPushNotificationsAsync();
          if (!success) {
            setPermissionError(
              'No se pudieron habilitar las notificaciones. Por favor, verifica los permisos de tu dispositivo.'
            );
            setSaving(false);
            return;
          }
        }
      }

      const newPreferences = { ...preferences, ...updates };

      // First check if preferences exist
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Update or insert based on existence
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          id: existingPrefs?.id,
          user_id: session?.user.id,
          ...newPreferences,
        });

      if (upsertError) throw upsertError;

      setPreferences(newPreferences);

      // Refresh the notification state in the hook
      fetchUserPreferences();
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError(
        'No se pudieron guardar los cambios. Por favor, intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.retryText}>Volver a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color="#1a1a1a" size={24} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>
          Configura tus preferencias de notificaciones
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {permissionError && (
          <View style={styles.permissionErrorContainer}>
            <Text style={styles.permissionErrorMessage}>{permissionError}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notificaciones Push</Text>
              <Text style={styles.settingDescription}>
                Recibe alertas cuando estés cerca de centros comerciales
              </Text>
            </View>
            <Switch
              value={preferences.notifications_enabled}
              onValueChange={(value) =>
                updatePreferences({ notifications_enabled: value })
              }
              trackColor={{ false: '#e9ecef', true: '#FF4B4B' }}
              disabled={saving}
            />
          </View>

          {(!hasPermission || !hasLocationPermission) &&
            preferences.notifications_enabled && (
              <View style={styles.permissionWarning}>
                <Text style={styles.permissionWarningText}>
                  Se requieren permisos de ubicación y notificaciones para esta
                  función. Por favor, verifica los permisos de tu dispositivo.
                </Text>
              </View>
            )}

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Radio de Notificación</Text>
              <Text style={styles.settingDescription}>
                Distancia máxima para recibir notificaciones (predeterminado: 4
                km)
              </Text>
              <Text style={styles.currentValue}>
                {preferences.notification_radius} kilómetros
              </Text>
              {Platform.OS === 'web' ? (
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={preferences.notification_radius}
                  onChange={(e) =>
                    updatePreferences({
                      notification_radius: parseInt(e.target.value, 10),
                    })
                  }
                  style={{
                    width: '100%',
                    marginTop: 16,
                    accentColor: '#FF4B4B',
                  }}
                />
              ) : (
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={preferences.notification_radius}
                    onValueChange={(value) =>
                      updatePreferences({ notification_radius: value })
                    }
                    minimumTrackTintColor="#FF4B4B"
                    maximumTrackTintColor="#e9ecef"
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>
          <Text style={styles.infoText}>
            Las notificaciones te ayudarán a descubrir centros comerciales
            cercanos y sus promociones actuales. Mantén las notificaciones
            activadas para no perderte ninguna oferta.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B4B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FF4B4B',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginBottom: 16,
    padding: 4,
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
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
  },
  currentValue: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 4,
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  permissionErrorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionErrorMessage: {
    color: '#FF4B4B',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionWarning: {
    backgroundColor: '#FFF5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionWarningText: {
    color: '#FF4B4B',
    fontSize: 14,
    textAlign: 'center',
  },
});
