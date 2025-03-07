import { Tabs } from 'expo-router';
import { Chrome as Home, Tag, MapPin, User, Settings } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  const { isAdmin, isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
        },
        tabBarActiveTintColor: '#FF4B4B',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          href: session ? undefined : null,
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promociones',
          href: session ? undefined : null,
          tabBarIcon: ({ size, color }) => <Tag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="malls"
        options={{
          title: 'Centros',
          href: session ? undefined : null,
          tabBarIcon: ({ size, color }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          href: session ? undefined : null,
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
          tabBarLabel: 'Panel',
          href: isAdmin ? '/admin' : null, // This will hide the tab for non-admin users
        }}
      />
    </Tabs>
  );
}