import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { PostgrestError } from '@supabase/supabase-js';

type Mall = {
  id: string;
  name: string;
  address: string;
  image: string;
  distance: string;
  distance_value: number;
  store_count?: number;
};

export default function MallsScreen() {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [filteredMalls, setFilteredMalls] = useState<Mall[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        setLocation(currentLocation);
        fetchMalls(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error accessing location services');
      }
    })();
  }, []);

  async function fetchMalls(userLocation: Location.LocationObject | null) {
    try {
      setLoading(true);
      
      if (!userLocation) {
        setError('Location not available');
        return;
      }
      
      const { data: mallsData, error: fetchError } = await supabase
        .from('shopping_malls')
        .select('*')

      if (fetchError) throw fetchError;
      
      // Calculate distances and get store counts
      const mallsWithStores = await Promise.all((mallsData || []).map(async (mall) => {
        const { count, error: countError } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('mall_id', mall.id);
          
        if (countError) throw countError;
        
        // Calculate actual distance using Haversine formula
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

      // Sort malls by distance
      const sortedMalls = mallsWithStores.sort((a, b) => 
        a.distance_value - b.distance_value
      );

      setMalls(sortedMalls);
      setFilteredMalls(sortedMalls);
      setError(null);
    } catch (err) {
      const error = err as PostgrestError;
      setError('Error al cargar los centros comerciales');
      console.error('Error fetching malls:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Haversine formula to calculate distance between two points
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Filter malls based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredMalls(malls);
      return;
    }

    const searchTerms = query.toLowerCase().trim().split(' ');
    const filtered = malls.filter((mall) => {
      const searchString = `${mall.name} ${mall.address}`.toLowerCase();
      return searchTerms.every(term => searchString.includes(term));
    });
    setFilteredMalls(filtered);
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
        <Text style={styles.title}>Centros Comerciales</Text>
        <Text style={styles.subtitle}>Encuentra las mejores tiendas cerca de ti</Text>
        {location && (
          <Text style={styles.locationNote}>Usando tu ubicación actual</Text>
        )}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o dirección..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666666"
          />
        </View>
        <Text style={styles.locationNote}>Mostrando plazas más cercanas primero</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <ScrollView style={styles.content}>
        {filteredMalls.map((mall) => (
          <Pressable key={mall.id} style={styles.mallCard}
            onPress={() => router.push(`/malls/${mall.id}`)}
          >
            <Image
              source={{
                uri: mall.image || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&fit=crop&q=80',
              }}
              style={styles.mallImage}
            />
            <View style={styles.mallContent}>
              <View style={styles.mallInfo}>
                <Text style={styles.mallName}>{mall.name}</Text>
                <View style={styles.addressContainer}>
                  <MapPin size={16} color="#666666" />
                  <Text style={styles.address}>{mall.address}</Text>
                </View>
                <Text style={styles.distance}>{mall.distance}</Text>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{mall.store_count}</Text>
                  <Text style={styles.statLabel}>Negocios</Text>
                </View>
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
    marginTop: 4
  },
  locationNote: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 8,
    fontStyle: 'italic'
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
  content: {
    padding: 20,
  },
  mallCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  mallImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  mallContent: {
    padding: 16,
  },
  mallInfo: {
    flex: 1,
  },
  mallName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  address: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  distance: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 4,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 8,
  },
});