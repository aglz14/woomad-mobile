import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

export default function AdminTabBar() {
  const pathname = usePathname();
  const iconSize = 25;

  // Check if we're on a specific route to highlight the correct tab
  const isActive = (route: string) => pathname.includes(route);

  return (
    <View style={styles.tabBar}>
      <Pressable style={styles.tabItem} onPress={() => router.push('/(tabs)')}>
        <Ionicons
          name="home-outline"
          size={iconSize}
          color={
            isActive('/(tabs)') && !isActive('/(tabs)/') ? '#FF4B4B' : '#8E8E93'
          }
        />
        <Text
          style={[
            styles.tabLabel,
            isActive('/(tabs)') &&
              !isActive('/(tabs)/') &&
              styles.tabLabelActive,
          ]}
        >
          Inicio
        </Text>
      </Pressable>

      <Pressable
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/promotions')}
      >
        <Ionicons
          name="pricetag-outline"
          size={iconSize}
          color={isActive('/(tabs)/promotions') ? '#FF4B4B' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive('/(tabs)/promotions') && styles.tabLabelActive,
          ]}
        >
          Promos
        </Text>
      </Pressable>

      <Pressable
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/malls')}
      >
        <Ionicons
          name="location-outline"
          size={iconSize}
          color={isActive('/(tabs)/malls') ? '#FF4B4B' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive('/(tabs)/malls') && styles.tabLabelActive,
          ]}
        >
          Centros
        </Text>
      </Pressable>

      <Pressable
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Ionicons
          name="person-outline"
          size={iconSize}
          color={isActive('/(tabs)/profile') ? '#FF4B4B' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive('/(tabs)/profile') && styles.tabLabelActive,
          ]}
        >
          Perfil
        </Text>
      </Pressable>

      <Pressable style={styles.tabItem} onPress={() => router.push('/(admin)')}>
        <Ionicons
          name="settings-outline"
          size={iconSize}
          color={isActive('/(admin)') ? '#FF4B4B' : '#8E8E93'}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive('/(admin)') && styles.tabLabelActive,
          ]}
        >
          Admin
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: Platform.OS === 'ios' ? 83 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: '#FF4B4B',
  },
});
