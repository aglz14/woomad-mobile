import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for local preferences
const NOTIFICATION_ENABLED_KEY = 'woomad_notification_enabled';
const NOTIFICATION_RADIUS_KEY = 'woomad_notification_radius';

const BACKGROUND_FETCH_TASK = 'BACKGROUND_LOCATION_TASK';
const DEFAULT_NOTIFICATION_DISTANCE = 4; // Default maximum distance in kilometers

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

    // Get user preferences for notification radius
    let notificationRadius = DEFAULT_NOTIFICATION_DISTANCE;
    let notificationsEnabled = false;

    try {
      // Try to get the user's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        // Get authenticated user's notification preferences from database
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('notification_radius, notifications_enabled')
          .eq('user_id', session.user.id)
          .single();

        // Only proceed if notifications are enabled
        if (!preferences?.notifications_enabled) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Use user's preferred radius if available
        if (preferences?.notification_radius) {
          notificationRadius = preferences.notification_radius;
        }
        notificationsEnabled = preferences?.notifications_enabled || false;
      } else {
        // For non-authenticated users, get preferences from AsyncStorage
        const storedEnabled = await AsyncStorage.getItem(
          NOTIFICATION_ENABLED_KEY
        );
        const storedRadius = await AsyncStorage.getItem(
          NOTIFICATION_RADIUS_KEY
        );

        notificationsEnabled = storedEnabled === 'true';

        // Only proceed if notifications are enabled
        if (!notificationsEnabled) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        if (storedRadius) {
          notificationRadius = parseFloat(storedRadius);
        }
      }
    } catch (err) {
      // If there's an error getting preferences, use the default radius
      console.log('Error getting user preferences, using default radius:', err);
    }

    // Check distance to each mall
    for (const mall of malls) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        mall.latitude,
        mall.longitude
      );

      // If within notification radius, send notification
      if (distance <= notificationRadius) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Centro comercial cerca!',
            body: `${mall.name} está a ${distance.toFixed(
              1
            )}km de ti. Toca para ver detalles.`,
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
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userPreference, setUserPreference] = useState(false);
  const [notificationRadius, setNotificationRadius] = useState(
    DEFAULT_NOTIFICATION_DISTANCE
  );
  const { session } = useAuth();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    checkNotificationPermission();
    checkLocationPermission();
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
      // For unauthenticated users, fetch preferences from AsyncStorage
      fetchLocalPreferences();
    }
  }, [session?.user?.id]);

  // Update isEnabled whenever permissions or user preference changes
  useEffect(() => {
    setIsEnabled(hasPermission && hasLocationPermission && userPreference);
  }, [hasPermission, hasLocationPermission, userPreference]);

  async function fetchLocalPreferences() {
    try {
      const storedEnabled = await AsyncStorage.getItem(
        NOTIFICATION_ENABLED_KEY
      );
      const storedRadius = await AsyncStorage.getItem(NOTIFICATION_RADIUS_KEY);

      // Set user preference from AsyncStorage or default to false
      setUserPreference(storedEnabled === 'true');

      // Set notification radius from AsyncStorage or default
      if (storedRadius) {
        setNotificationRadius(parseFloat(storedRadius));
      } else {
        setNotificationRadius(DEFAULT_NOTIFICATION_DISTANCE);
      }
    } catch (error) {
      console.error('Error fetching local preferences:', error);
      setUserPreference(false);
      setNotificationRadius(DEFAULT_NOTIFICATION_DISTANCE);
    }
  }

  async function fetchUserPreferences() {
    try {
      if (!session?.user?.id) {
        // For unauthenticated users, use local storage
        fetchLocalPreferences();
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications_enabled, notification_radius')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return;
      }

      // If we have data, update the user preference
      if (data) {
        setUserPreference(data.notifications_enabled);
        setNotificationRadius(
          data.notification_radius || DEFAULT_NOTIFICATION_DISTANCE
        );
      } else {
        // Default to false if no preferences found
        setUserPreference(false);
        setNotificationRadius(DEFAULT_NOTIFICATION_DISTANCE);
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
      // Default to false on error
      setUserPreference(false);
      setNotificationRadius(DEFAULT_NOTIFICATION_DISTANCE);
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

  async function checkLocationPermission() {
    try {
      // Only proceed on native platforms
      if (Platform.OS === 'web') {
        console.log('Location permissions are not supported on web');
        return;
      }

      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();
      setHasLocationPermission(existingStatus === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasLocationPermission(false);
    }
  }

  async function requestLocationPermission() {
    try {
      // Only proceed on native platforms
      if (Platform.OS === 'web') {
        console.log('Location permissions are not supported on web');
        return;
      }

      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Also request background location permission for better notification experience
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      setHasLocationPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasLocationPermission(false);
      return false;
    }
  }

  async function registerForPushNotificationsAsync() {
    try {
      // Only proceed on native platforms
      if (Platform.OS === 'web') {
        console.log('Push notifications are not supported on web');
        return;
      }

      // First request location permission
      const locationGranted = await requestLocationPermission();
      if (!locationGranted) {
        throw new Error('Location permission is required for notifications');
      }

      // Then request notification permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      setHasPermission(true);

      // Update preferences based on authentication status
      if (session?.user?.id) {
        // For authenticated users, update the database
        await supabase.from('user_preferences').upsert({
          user_id: session.user.id,
          notifications_enabled: true,
          notification_radius: notificationRadius,
        });
        setUserPreference(true);
      } else {
        // For unauthenticated users, update AsyncStorage
        await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
        await AsyncStorage.setItem(
          NOTIFICATION_RADIUS_KEY,
          notificationRadius.toString()
        );
        setUserPreference(true);
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      setHasPermission(false);
      return false;
    }
  }

  async function updateLocalPreferences(
    enabled: boolean,
    radius: number = DEFAULT_NOTIFICATION_DISTANCE
  ) {
    try {
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled.toString());
      await AsyncStorage.setItem(NOTIFICATION_RADIUS_KEY, radius.toString());

      setUserPreference(enabled);
      setNotificationRadius(radius);
    } catch (error) {
      console.error('Error updating local preferences:', error);
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
          // Navigate to the center details page when notification is tapped
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
    hasLocationPermission,
    userPreference,
    notificationRadius,
    registerForPushNotificationsAsync,
    requestLocationPermission,
    fetchUserPreferences,
    updateLocalPreferences,
  };
}
