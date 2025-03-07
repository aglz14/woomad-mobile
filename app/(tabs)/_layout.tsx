import { Tabs, usePathname } from 'expo-router';
import { Chrome as Home, Tag, MapPin, User, Settings } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';

export default function TabLayout() {
  const { isAdmin, isLoading, session } = useAuth();
  const pathname = usePathname();

  const tabs = useMemo(() => {
    const commonTabs = [
      {
        name: "index",
        title: "Inicio",
        icon: Home
      },
      {
        name: "promotions",
        title: "Promociones",
        icon: Tag
      },
      {
        name: "malls",
        title: "Centros",
        icon: MapPin
      },
      {
        name: "profile",
        title: "Perfil",
        icon: User
      }
    ];

    if (isAdmin) {
      commonTabs.push({
        name: "admin",
        title: "Panel",
        icon: Settings
      });
    }

    return commonTabs;
  }, [isAdmin]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/auth/login');
    }
  }, [isLoading, session]);

  if (isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        href: null,
        unmountOnBlur: true,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
        },
        tabBarActiveTintColor: '#FF4B4B',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarHideOnKeyboard: true,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: session ? undefined : null,
            tabBarIcon: ({ size, color }) => {
              const Icon = tab.icon;
              return <Icon size={size} color={color} />;
            },
            tabBarStyle: pathname.startsWith('/malls/') ? { display: 'none' } : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}