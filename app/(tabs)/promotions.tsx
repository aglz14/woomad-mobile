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
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          // Still fetch promotions even without location
          fetchPromotions(null);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        fetchPromotions(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error accessing location services');
        // Still fetch promotions even without location
        fetchPromotions(null);
      }
    })();
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
  };

  async function fetchPromotions(userLocation: Location.LocationObject | null) {
    try {
      setLoading(true);

      const now = new Date().toISOString();

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
        .gt('end_date', now);

      if (fetchError) throw fetchError;

      // Process promotions with safe access to nested properties
      const processedPromotions: Promotion[] = (data || []).map(
        (promo: RawPromotion) => {
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
            image: promo.image,
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
        }
      );

      // Filter by distance if location is available
      const filteredByDistance = userLocation
        ? processedPromotions
            .filter(
              (promo) => promo.distance !== undefined && promo.distance <= 100
            )
            .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        : processedPromotions;

      setPromotions(filteredByDistance);
      setFilteredPromotions(filteredByDistance);
      setError(null);
    } catch (err) {
      const error = err as PostgrestError;
      setError('Error al cargar las promociones');
      console.error('Error fetching promotions:', error.message);
    } finally {
      setLoading(false);
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

      <ScrollView style={styles.content}>
        {filteredPromotions.map((promo) => (
          <Pressable key={promo.id} style={styles.promotionCard}>
            <Image
              source={{
                uri:
                  promo.image ||
                  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&fit=crop&q=80',
              }}
              style={styles.promotionImage}
            />
            <View style={styles.promotionInfo}>
              <View style={styles.tagContainer}>
                <Tag size={16} color="#FF4B4B" />
                <Text style={styles.promotionTitle}>{promo.title}</Text>
              </View>

              <Text style={styles.description}>{promo.description}</Text>

              <View style={styles.storeInfo}>
                <View style={styles.infoRow}>
                  <Store size={16} color="#666666" />
                  <Text style={styles.storeName}>{promo.store.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={16} color="#666666" />
                  <Text style={styles.mallName}>{promo.store.mall?.name}</Text>
                </View>
              </View>

              <View style={styles.validityContainer}>
                <Calendar size={16} color="#FF4B4B" />
                <Text style={styles.validUntil}>
                  Válido hasta: {formatDate(promo.end_date)} •{' '}
                  {promo.distance?.toFixed(1)}km
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
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
  promotionInfo: {
    padding: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promotionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 24,
  },
  storeInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
    fontWeight: '500',
  },
  mallName: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  validUntil: {
    fontSize: 14,
    color: '#FF4B4B',
    fontWeight: '500',
    marginLeft: 8,
  },
});
