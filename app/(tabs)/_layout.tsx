import { Tabs, usePathname } from 'expo-router';
import { Chrome, Tag, MapPin, User, Settings } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet, Pressable } from 'react-native';

// Define types for tab items
type TabItem = {
  name: string;
  title: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

export default function TabLayout() {
  const { isAdmin, isLoading, session, signOut } = useAuth();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);

  // Define tabs based on user role
  const tabs = useMemo((): TabItem[] => {
    const commonTabs = [
      {
        name: 'index',
        title: 'Inicio',
        icon: Chrome,
      },
      {
        name: 'promotions',
        title: 'Promociones',
        icon: Tag,
      },
      {
        name: 'malls',
        title: 'Centros',
        icon: MapPin,
      },
      {
        name: 'profile',
        title: 'Perfil',
        icon: User,
      },
    ];

    // Add admin tab only for admin users
    if (isAdmin) {
      commonTabs.push({
        name: 'admin',
        title: 'Panel',
        icon: Settings,
      });
    }

    return commonTabs;
  }, [isAdmin]);

  // Handle authentication and routing
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isLoading && !session) {
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Error de autenticación. Por favor, inicie sesión nuevamente.');
      }
    };
    
    checkAuth();
  }, [isLoading, session]);

  // Handle retry after error
  const handleRetry = async () => {
    setError(null);
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (err) {
      console.error('Error during retry:', err);
      setError('No se pudo reiniciar la sesión. Por favor, cierre la aplicación e intente nuevamente.');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  // Determine if tab bar should be hidden
  const shouldHideTabBar = (path: string): boolean => {
    return (
      path.startsWith('/malls/') || 
      path.startsWith('/promotions/') || 
      path.includes('/details/')
    );
  };

  return (
    <Tabs
      screenOptions={{
        unmountOnBlur: true,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF4B4B',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ size, color }) => {
              const Icon = tab.icon;
              return <Icon size={size} color={color} />;
            },
            tabBarStyle: shouldHideTabBar(pathname)
              ? { display: 'none' }
              : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B4B',
    textAlign: 'center',
    marginBottom: 20,
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
}); 