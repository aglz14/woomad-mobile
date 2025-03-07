import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { Store, MapPin, Filter, ArrowLeft, Phone, Navigation2, Clock, Info } from 'lucide-react-native';
import * as Linking from 'expo-linking';

type Store = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  floor: string;
  location_in_mall: string;
  contact_number: string;
  category: string;
  hours: string;
};

type Mall = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  latitude: number;
  longitude: number;
};

export default function MallDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [mall, setMall] = useState<Mall | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!stores.length) return [];
    return Array.from(new Set(stores.map(store => store.category))).sort();
  }, [stores]);

  useEffect(() => {
    fetchMallData();
  }, [id]);

  useEffect(() => {
    filterStores(selectedCategory);
  }, [stores, selectedCategory]);

  async function fetchMallData() {
    try {
      setLoading(true);
      setError(null);

      const { data: mallData, error: mallError } = await supabase
        .from('shopping_malls')
        .select('*')
        .eq('id', id)
        .single();

      if (mallError) throw mallError;
      setMall(mallData);

      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('mall_id', id)
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);
      setFilteredStores(storesData || []);

    } catch (err) {
      console.error('Error fetching mall data:', err);
      setError('Error loading mall information');
    } finally {
      setLoading(false);
    }
  }

  function filterStores(category: string | null) {
    if (!category) {
      setFilteredStores(stores);
    } else {
      setFilteredStores(stores.filter(store => store.category === category));
    }
    setSelectedCategory(category);
  }

  const openMaps = () => {
    if (!mall) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${mall.latitude},${mall.longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (error || !mall) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Mall not found'}</Text>
        <Pressable style={styles.retryButton} onPress={fetchMallData}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} stickyHeaderIndices={[1]}>
      <View>
        <Image
          source={{
            uri: mall.image || 'https://images.unsplash.com/photo-1519567241348-f1f95aeea6e6?w=800',
          }}
          style={[styles.headerImage, { width }]}
        />
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{mall.name}</Text>
          <Pressable style={styles.addressButton} onPress={openMaps}>
            <MapPin size={16} color="#666666" />
            <Text style={styles.address}>{mall.address}</Text>
            <Navigation2 size={16} color="#FF4B4B" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {mall.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.description}>{mall.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Filter size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}>
            <Pressable
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipSelected,
              ]}
              onPress={() => filterStores(null)}>
              <Text
                style={[
                  styles.categoryText,
                  !selectedCategory && styles.categoryTextSelected,
                ]}>
                All ({stores.length})
              </Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
                onPress={() => filterStores(category)}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextSelected,
                  ]}>
                  {category} ({stores.filter(s => s.category === category).length})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Store size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>
              Stores ({filteredStores.length})
            </Text>
          </View>
          {filteredStores.map((store) => (
            <View key={store.id} style={styles.storeCard}>
              <Image
                source={{
                  uri: store.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
                }}
                style={styles.storeLogo}
              />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeCategory}>{store.category}</Text>
                
                <View style={styles.storeDetails}>
                  {store.floor && (
                    <View style={styles.detailItem}>
                      <MapPin size={14} color="#666666" />
                      <Text style={styles.detailText}>
                        Floor {store.floor} • {store.location_in_mall}
                      </Text>
                    </View>
                  )}
                  
                  {store.hours && (
                    <View style={styles.detailItem}>
                      <Clock size={14} color="#666666" />
                      <Text style={styles.detailText}>{store.hours}</Text>
                    </View>
                  )}
                  
                  {store.contact_number && (
                    <Pressable
                      style={styles.detailItem}
                      onPress={() => Linking.openURL(`tel:${store.contact_number}`)}>
                      <Phone size={14} color="#666666" />
                      <Text style={[styles.detailText, styles.phoneNumber]}>
                        {store.contact_number}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
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
    backgroundColor: '#f8f9fa',
  },
  headerImage: {
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipSelected: {
    backgroundColor: '#FF4B4B',
    borderColor: '#FF4B4B',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  storeCategory: {
    fontSize: 14,
    color: '#FF4B4B',
    marginTop: 2,
  },
  storeDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  phoneNumber: {
    textDecorationLine: 'underline',
  },
  error: {
    color: '#FF4B4B',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});