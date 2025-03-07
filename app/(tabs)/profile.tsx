import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { Bell, Heart, Settings, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { session } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <View style={styles.profile}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&fit=crop&q=80' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{session?.user?.user_metadata?.full_name || 'Usuario'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Preferencias</Text>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Bell size={24} color="#666666" />
              <Text style={styles.menuItemText}>Notificaciones</Text>
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

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  profile: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
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
  logoutButton: {
    margin: 20,
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});