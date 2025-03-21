import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

type Promotion = {
  id: string;
  title: string;
  image: string;
  store: {
    name: string;
    mall: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
};

type Mall = {
  id: string;
  name: string;
  address: string;
  image: string;
  distance: string;
  distance_value: number;
  store_count?: number;
};

export default function HomeScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMoreMalls, setLoadingMoreMalls] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreMalls, setHasMoreMalls] = useState(true);
  const [userLocationData, setUserLocationData] =
    useState<Location.LocationObject | null>(null);
  const MALLS_PER_PAGE = 5;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setUserLocationData(currentLocation);
        fetchInitialData(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error accessing location services');
      }
    })();
  }, []);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
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
    },
    []
  );

  async function fetchInitialData(userLocation: Location.LocationObject) {
    try {
      setLoading(true);

      // Reset pagination state
      setPage(0);
      setMalls([]);
      setHasMoreMalls(true);

      // Fetch promotions
      await fetchPromotions(userLocation);

      // Fetch first page of malls
      await loadMoreMalls(0, userLocation);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPromotions(userLocation: Location.LocationObject) {
    try {
      console.log('Fetching promotions...');
      const startTime = Date.now();
      const now = new Date().toISOString();

      // Fetch promotions - limited to top 5 as this is a highlight section
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(
          `
          *, 
          store:stores!promotions_store_id_fkey (
            id,
            name,
            mall:shopping_malls!stores_mall_id_fkey (
              id,
              name,
              latitude,
              longitude
            )
          )
        `
        )
        .gt('end_date', now);

      console.log(`Promotions fetch took ${Date.now() - startTime}ms`);

      if (promotionsError) throw promotionsError;

      // Process in smaller batches to prevent UI blocking
      console.log('Processing promotion data...');
      const processStartTime = Date.now();

      const batchSize = 5;
      let processedPromotions: Promotion[] = [];

      for (let i = 0; i < (promotionsData?.length || 0); i += batchSize) {
        const batch = promotionsData?.slice(i, i + batchSize) || [];
        const batchProcessed = batch.map((promo) => {
          const store = Array.isArray(promo.store)
            ? promo.store[0]
            : promo.store;
          const mall =
            store?.mall && Array.isArray(store.mall)
              ? store.mall[0]
              : store?.mall;

          const distance =
            mall && userLocation
              ? calculateDistance(
                  userLocation.coords.latitude,
                  userLocation.coords.longitude,
                  mall.latitude,
                  mall.longitude
                )
              : Infinity;

          return {
            id: promo.id,
            title: promo.title,
            image: promo.image || '',
            distance,
            store: {
              name: store?.name || '',
              mall: mall
                ? {
                    name: mall.name,
                    latitude: mall.latitude,
                    longitude: mall.longitude,
                  }
                : undefined,
            },
          };
        });

        processedPromotions = [...processedPromotions, ...batchProcessed];

        // Allow UI to update if needed
        if (i + batchSize < (promotionsData?.length || 0)) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      console.log(
        `Promotion processing took ${Date.now() - processStartTime}ms`
      );

      // Sort by distance and get top 5
      const nearestPromotions = processedPromotions
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        .slice(0, 5);

      setPromotions(nearestPromotions);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      // Don't set global error for promotion failures, just log it
    }
  }

  async function loadMoreMalls(
    pageToLoad: number,
    userLocation: Location.LocationObject
  ) {
    if (loadingMoreMalls) return;

    try {
      setLoadingMoreMalls(true);
      console.log(`Loading malls page ${pageToLoad}...`);
      const startTime = Date.now();

      // Fetch all malls first - we'll paginate in memory for this case
      // since we need to compute distances and sort
      const { data: mallsData, error: mallsError } = await supabase
        .from('shopping_malls')
        .select('*');

      console.log(`Malls fetch took ${Date.now() - startTime}ms`);

      if (mallsError) throw mallsError;

      if (!mallsData || mallsData.length === 0) {
        console.log('No malls found');
        setHasMoreMalls(false);
        return;
      }

      // Calculate distances and get store counts
      console.log('Processing mall data...');
      const processStartTime = Date.now();

      // Process in smaller batches to prevent UI blocking
      const batchSize = 5;
      let processedMalls: Mall[] = [];

      for (let i = 0; i < mallsData.length; i += batchSize) {
        const batch = mallsData.slice(i, i + batchSize);
        const batchPromises = batch.map(async (mall) => {
          try {
            const { count } = await supabase
              .from('stores')
              .select('*', { count: 'exact', head: true })
              .eq('mall_id', mall.id);

            const distance = calculateDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              mall.latitude,
              mall.longitude
            );

            return {
              ...mall,
              store_count: count || 0,
              distance: `${distance.toFixed(1)} km`,
              distance_value: distance,
            };
          } catch (err) {
            console.error(`Error processing mall ${mall.id}:`, err);
            // Return mall with default values if there's an error
            const distance = calculateDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              mall.latitude,
              mall.longitude
            );

            return {
              ...mall,
              store_count: 0,
              distance: `${distance.toFixed(1)} km`,
              distance_value: distance,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        processedMalls = [...processedMalls, ...batchResults];

        // Allow UI to update if needed
        if (i + batchSize < mallsData.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      console.log(`Mall processing took ${Date.now() - processStartTime}ms`);

      // Sort all malls by distance
      const sortedMalls = processedMalls.sort(
        (a, b) => a.distance_value - b.distance_value
      );

      // Get the specific page of malls we want
      const start = pageToLoad * MALLS_PER_PAGE;
      const end = start + MALLS_PER_PAGE;
      const mallsForPage = sortedMalls.slice(start, end);

      // Check if there are more malls to load
      setHasMoreMalls(end < sortedMalls.length);

      // Append new malls to existing ones
      setMalls((prevMalls) => [...prevMalls, ...mallsForPage]);
      setPage(pageToLoad);

      console.log(
        `Total malls processing for page ${pageToLoad} took ${
          Date.now() - startTime
        }ms`
      );
    } catch (err) {
      console.error('Error loading more malls:', err);
      // Don't set global error for pagination failures, just log it
      if (pageToLoad === 0) {
        setError('Error loading shopping centers');
      }
    } finally {
      setLoadingMoreMalls(false);
    }
  }

  // Helper function to handle loading more malls
  const handleLoadMoreMalls = () => {
    if (hasMoreMalls && !loadingMoreMalls && !loading && userLocationData) {
      loadMoreMalls(page + 1, userLocationData);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      onMomentumScrollEnd={({ nativeEvent }) => {
        const isCloseToBottom = ({
          contentOffset,
          contentSize,
          layoutMeasurement,
        }) => {
          const paddingToBottom = 20;
          return (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          );
        };

        if (isCloseToBottom(nativeEvent)) {
          handleLoadMoreMalls();
        }
      }}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola!</Text>
        <Text style={styles.subtitle}>
          Descubre las mejores ofertas cerca de ti
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Promociones Destacadas</Text>
        {promotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No se encontraron promociones cercanas
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promotionsScroll}
          >
            {promotions.map((promo) => (
              <Pressable
                key={promo.id}
                style={styles.promotionCard}
                onPress={() => router.push('/promotions')}
              >
                <Image
                  source={{
                    uri:
                      promo.image ||
                      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2hvcHBpbmd8ZW58MHx8MHx8fDA%3D',
                  }}
                  style={styles.promotionImage}
                />
                <View style={styles.promotionInfo}>
                  <Text style={styles.promotionTitle}>{promo.title}</Text>
                  <Text style={styles.promotionStore}>{promo.store?.name}</Text>
                  <Text style={styles.promotionMall}>
                    {promo.store?.mall?.name} • {promo.distance?.toFixed(1)}km
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Centros Comerciales Cercanos</Text>
        {malls.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loadingMoreMalls
                ? 'Cargando centros comerciales...'
                : 'No se encontraron centros comerciales cercanos'}
            </Text>
          </View>
        ) : (
          <>
            {malls.map((mall) => (
              <Pressable
                key={mall.id}
                style={styles.mallCard}
                onPress={() => router.push(`/center_details/${mall.id}`)}
              >
                <Image
                  source={{
                    uri:
                      mall.image ||
                      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3RvcmV8ZW58MHx8MHx8fDA%3D',
                  }}
                  style={styles.mallImage}
                />
                <View style={styles.mallInfo}>
                  <Text style={styles.mallName}>{mall.name}</Text>
                  <Text style={styles.mallAddress}>{mall.address}</Text>
                  <View style={styles.mallStats}>
                    <Text style={styles.mallDistance}>{mall.distance}</Text>
                    <Text style={styles.storeCount}>
                      {mall.store_count} negocios
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}

            {/* Loading indicator for more malls */}
            {loadingMoreMalls && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#FF4B4B" />
                <Text style={styles.loadingMoreText}>
                  Cargando más centros comerciales...
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  promotionsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  promotionCard: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  promotionImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  promotionInfo: {
    padding: 16,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  promotionStore: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  promotionMall: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  mallCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  mallImage: {
    width: 100,
    height: 100,
  },
  mallInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  mallName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mallAddress: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  mallStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mallDistance: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  storeCount: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
