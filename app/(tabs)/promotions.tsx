import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Search, Tag, Store, MapPin, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import * as Location from 'expo-location';

// Define the raw data structure from Supabase
type RawPromotion = {
  id: string;
  title: string;
  description: string;
  image: string;
  end_date: string;
  store: any; // Using any for the raw data from Supabase
};

// Define the processed promotion structure
type Promotion = {
  id: string;
  title: string;
  description: string;
  image: string;
  end_date: string;
  store: {
    name: string;
    mall?: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
};

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMorePromotions, setHasMorePromotions] = useState(true);
  const PROMOTIONS_PER_PAGE = 10;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          // Still fetch promotions even without location
          fetchInitialPromotions(null);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        fetchInitialPromotions(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error accessing location services');
        // Still fetch promotions even without location
        fetchInitialPromotions(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (promotions.length > 0) {
      handleSearch(searchQuery);
    }
  }, [promotions, searchQuery]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

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
    },
    []
  );

  // Initial load of promotions
  async function fetchInitialPromotions(
    userLocation: Location.LocationObject | null
  ) {
    try {
      setLoading(true);
      // Reset pagination state
      setPage(0);
      setPromotions([]);
      setFilteredPromotions([]);
      setHasMorePromotions(true);

      await loadMorePromotions(0, userLocation);
    } catch (err) {
      console.error('Error in initial promotions fetch:', err);
      setError('Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  }

  // Function to load more promotions (paginated)
  async function loadMorePromotions(
    pageToLoad: number,
    userLocation: Location.LocationObject | null
  ) {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log(`Loading promotions page ${pageToLoad}`);

      const now = new Date().toISOString();
      const startTime = Date.now();

      const { data, error: fetchError } = await supabase
        .from('promotions')
        .select(
          `*, 
          store:stores!promotions_store_id_fkey (
            id,
            name,
            mall:shopping_malls!stores_mall_id_fkey (
              id,
              name,
              latitude,
              longitude
            )
          )`
        )
        .gt('end_date', now)
        .range(
          pageToLoad * PROMOTIONS_PER_PAGE,
          (pageToLoad + 1) * PROMOTIONS_PER_PAGE - 1
        );

      console.log(`Promotions fetch took ${Date.now() - startTime}ms`);
      console.log(
        `Retrieved ${data?.length || 0} promotions for page ${pageToLoad}`
      );

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        console.log('No more promotions to load');
        setHasMorePromotions(false);
        return;
      }

      // Set hasMorePromotions to false if we received fewer items than expected
      if (data.length < PROMOTIONS_PER_PAGE) {
        setHasMorePromotions(false);
      }

      // Process promotions with safe access to nested properties
      console.log(`Processing promotion data for page ${pageToLoad}...`);
      const processStartTime = Date.now();

      // Process in batches to prevent UI blocking
      const batchSize = 5;
      let processedPromotions: Promotion[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchProcessed = batch.map((promo: RawPromotion) => {
          // Safely access nested properties
          const storeData = promo.store || {};
          const storeObj = Array.isArray(storeData) ? storeData[0] : storeData;
          const mallData = storeObj?.mall || {};
          const mallObj = Array.isArray(mallData) ? mallData[0] : mallData;

          // Calculate distance if location is available
          let distance = undefined;
          if (userLocation && mallObj?.latitude && mallObj?.longitude) {
            distance = calculateDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              mallObj.latitude,
              mallObj.longitude
            );
          }

          // Create a properly structured promotion object
          return {
            id: promo.id,
            title: promo.title,
            description: promo.description,
            image: promo.image || '',
            end_date: promo.end_date,
            store: {
              name: storeObj?.name || '',
              mall: mallObj
                ? {
                    name: mallObj.name || '',
                    latitude: mallObj.latitude || 0,
                    longitude: mallObj.longitude || 0,
                  }
                : undefined,
            },
            distance,
          };
        });

        processedPromotions = [...processedPromotions, ...batchProcessed];

        // Allow UI to update if needed
        if (i + batchSize < data.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      console.log(
        `Promotion data processing took ${Date.now() - processStartTime}ms`
      );
      const totalTime = Date.now() - startTime;
      console.log(
        `Total data fetch for page ${pageToLoad} took ${totalTime}ms`
      );

      // Filter by distance if location is available
      const filteredByDistance = userLocation
        ? processedPromotions
            .filter(
              (promo) => promo.distance !== undefined && promo.distance <= 100
            )
            .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        : processedPromotions;

      // Append new promotions to existing ones
      setPromotions((prevPromotions) => [
        ...prevPromotions,
        ...filteredByDistance,
      ]);
      setPage(pageToLoad);

      // Update filtered promotions if there's no search query
      if (!searchQuery) {
        setFilteredPromotions((prevFiltered) => [
          ...prevFiltered,
          ...filteredByDistance,
        ]);
      } else {
        // Re-apply search filter on all promotions
        handleSearch(searchQuery);
      }

      setError(null);
    } catch (err) {
      const error = err as PostgrestError;
      console.error('Error loading more promotions:', error.message);
      // Don't set global error on pagination failures, just log it
      if (pageToLoad === 0) {
        setError('Error al cargar las promociones');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPromotions(promotions);
      return;
    }

    const searchTerms = query.toLowerCase().trim().split(' ');
    const filtered = promotions.filter((promo) => {
      const mallName = promo.store?.mall?.name || '';
      const storeName = promo.store?.name || '';
      const searchString =
        `${promo.title} ${promo.description} ${storeName} ${mallName}`.toLowerCase();
      return searchTerms.every((term) => searchString.includes(term));
    });
    setFilteredPromotions(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Helper function to handle loading more promotions
  const handleLoadMore = () => {
    if (hasMorePromotions && !isLoadingMore && !loading) {
      loadMorePromotions(page + 1, location);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promociones</Text>
        <Text style={styles.subtitle}>Descubre las mejores ofertas</Text>
        {location && (
          <Text style={styles.locationInfo}>
            Mostrando promociones en un radio de 100km
          </Text>
        )}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar promociones..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666666"
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <ScrollView
        style={styles.content}
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
            handleLoadMore();
          }
        }}
      >
        {filteredPromotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoadingMore
                ? 'Cargando promociones...'
                : 'No se encontraron promociones'}
            </Text>
          </View>
        ) : (
          <>
            {filteredPromotions.map((promo) => (
              <Pressable key={promo.id} style={styles.promotionCard}>
                <Image
                  source={{
                    uri:
                      promo.image ||
                      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2hvcHBpbmd8ZW58MHx8MHx8fDA%3D',
                  }}
                  style={styles.promotionImage}
                />
                <View style={styles.promotionContent}>
                  <Text style={styles.promotionTitle}>{promo.title}</Text>
                  <Text style={styles.promotionDescription}>
                    {promo.description}
                  </Text>

                  <View style={styles.promotionDetails}>
                    <View style={styles.storeInfo}>
                      <View style={styles.infoItem}>
                        <Store size={16} color="#666666" />
                        <Text style={styles.infoText}>{promo.store.name}</Text>
                      </View>

                      {promo.store.mall && (
                        <View style={styles.infoItem}>
                          <MapPin size={16} color="#666666" />
                          <Text style={styles.infoText}>
                            {promo.store.mall.name}
                            {promo.distance !== undefined && (
                              <Text style={styles.distance}>
                                {' '}
                                • {promo.distance.toFixed(1)} km
                              </Text>
                            )}
                          </Text>
                        </View>
                      )}

                      <View style={styles.infoItem}>
                        <Calendar size={16} color="#666666" />
                        <Text style={styles.infoText}>
                          Válido hasta {formatDate(promo.end_date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {/* Loading indicator for more promotions */}
            {isLoadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#FF4B4B" />
                <Text style={styles.loadingMoreText}>
                  Cargando más promociones...
                </Text>
              </View>
            )}
          </>
        )}
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  locationInfo: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1a1a1a',
  },
  error: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  promotionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  promotionImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  promotionContent: {
    padding: 16,
  },
  promotionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 24,
  },
  promotionDetails: {
    marginBottom: 16,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: '#FF4B4B',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
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
