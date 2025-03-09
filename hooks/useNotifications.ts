import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

const BACKGROUND_FETCH_TASK = 'BACKGROUND_LOCATION_TASK';
const NOTIFICATION_DISTANCE = 50; // Maximum distance in kilometers

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Get current location
    const location = await Location.getCurrentPositionAsync();

    // Get all malls from the database
    const { data: malls, error } = await supabase
      .from('shopping_malls')
      .select('*');

    if (error) throw error;

    // Check distance to each mall
    for (const mall of malls) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        mall.latitude,
        mall.longitude
      );

      // If within notification distance, send notification
      if (distance <= NOTIFICATION_DISTANCE) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Centro comercial cerca!',
            body: `${mall.name} está a ${distance.toFixed(1)}km de ti`,
            data: { mallId: mall.id },
          },
          trigger: null,
        });
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [userPreference, setUserPreference] = useState(false);
  const { session } = useAuth();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    checkNotificationPermission();
    setupNotificationListeners();
    setupBackgroundTask();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      // For authenticated users, fetch preferences from database
      fetchUserPreferences();
    } else {
      // For unauthenticated users, use default preference (false)
      setUserPreference(false);
    }
  }, [session?.user?.id]);

  // Update isEnabled whenever either permission or user preference changes
  useEffect(() => {
    setIsEnabled(hasPermission && userPreference);
  }, [hasPermission, userPreference]);

  async function fetchUserPreferences() {
    try {
      if (!session?.user?.id) {
        // For unauthenticated users, use default preference
        setUserPreference(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications_enabled')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return;
      }

      // If we have data, update the user preference
      if (data) {
        setUserPreference(data.notifications_enabled);
      } else {
        // Default to false if no preferences found
        setUserPreference(false);
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
      // Default to false on error
      setUserPreference(false);
    }
  }

  async function checkNotificationPermission() {
    try {
      // Only proceed on native platforms
      if (Platform.OS === 'web') {
        console.log('Push notifications are not supported on web');
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      setHasPermission(existingStatus === 'granted');
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setHasPermission(false);
    }
  }

  async function registerForPushNotificationsAsync() {
    try {
      // Only proceed on native platforms
      if (Platform.OS === 'web') {
        console.log('Push notifications are not supported on web');
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted');
      }

      setHasPermission(true);

      // Also update the user preference in the database if user is authenticated
      if (session?.user?.id) {
        await supabase.from('user_preferences').upsert({
          user_id: session.user.id,
          notifications_enabled: true,
        });
        setUserPreference(true);
      } else {
        // For unauthenticated users, just update the local state
        setUserPreference(true);
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      setHasPermission(false);
    }
  }

  async function setupBackgroundTask() {
    try {
      // Only register background tasks on native platforms
      if (Platform.OS === 'web') {
        console.log('Background tasks are not supported on web');
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 900, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  function setupNotificationListeners() {
    // Only setup listeners on native platforms
    if (Platform.OS === 'web') {
      return;
    }

    // Handle received notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    // Handle notification responses
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const mallId = response.notification.request.content.data?.mallId;
        if (mallId) {
          router.push(`/center_details/${mallId}`);
        }
      });
  }

  function cleanup() {
    if (Platform.OS === 'web') {
      return;
    }

    if (notificationListener.current) {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
    }
    if (responseListener.current) {
      Notifications.removeNotificationSubscription(responseListener.current);
    }
  }

  return {
    isEnabled,
    hasPermission,
    userPreference,
    registerForPushNotificationsAsync,
    fetchUserPreferences,
  };
}
