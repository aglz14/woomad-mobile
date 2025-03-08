import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        fetchData(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error accessing location services');
      }
    })();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  async function fetchData(userLocation: Location.LocationObject) {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Fetch promotions
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(`
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
        `)
        .gt('end_date', now);

      if (promotionsError) throw promotionsError;

      // Calculate distances for promotions
      const promotionsWithDistance = (promotionsData || []).map(promo => {
        const store = Array.isArray(promo.store) ? promo.store[0] : promo.store;
        const mall = store?.mall && Array.isArray(store.mall) ? store.mall[0] : store?.mall;
        
        const distance = mall && userLocation ? calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          mall.latitude,
          mall.longitude
        ) : Infinity;

        return {
          id: promo.id,
          title: promo.title,
          image: promo.image,
          distance,
          store: {
            name: store?.name || '',
            mall: mall ? {
              name: mall.name,
              latitude: mall.latitude,
              longitude: mall.longitude
            } : undefined
          }
        };
      });

      // Sort by distance and get top 5
      const nearestPromotions = promotionsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // Fetch malls
      const { data: mallsData, error: mallsError } = await supabase
        .from('shopping_malls')
        .select('*');

      if (mallsError) throw mallsError;

      // Calculate distances for malls
      const mallsWithDistance = await Promise.all((mallsData || []).map(async mall => {
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
      }));

      const nearestMalls = mallsWithDistance
        .sort((a, b) => a.distance_value - b.distance_value)
        .slice(0, 5); // Get only first 5 malls

      setPromotions(nearestPromotions);
      setMalls(nearestMalls); 
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola!</Text>
        <Text style={styles.subtitle}>Descubre las mejores ofertas cerca de ti</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Promociones Destacadas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotionsScroll}>
          {promotions.map((promo) => (
            <Pressable
              key={promo.id}
              style={styles.promotionCard}
              onPress={() => router.push('/promotions')}>
              <Image source={{ uri: promo.image }} style={styles.promotionImage} />
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Centros Comerciales Cercanos</Text>
        {malls.map((mall) => (
          <Pressable
            key={mall.id}
            style={styles.mallCard}
            onPress={() => router.push(`/malls/${mall.id}`)}>
            <Image source={{ uri: mall.image }} style={styles.mallImage} />
            <View style={styles.mallInfo}>
              <Text style={styles.mallName}>{mall.name}</Text>
              <Text style={styles.mallDistance}>{mall.distance} • {mall.store_count} negocios</Text>
            </View>
          </Pressable>
        ))}
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
  mallDistance: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});