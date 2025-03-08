import { View, Text, StyleSheet, ScrollView, Image, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Store, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type Category = {
  id: string;
  name: string;
};

type Store = {
  id: string;
  name: string;
  description: string;
  category: string;
  floor: string;
  location_in_mall: string;
  contact_number: string;
  logo_url: string;
  hours: string;
};

type ShoppingMall = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  latitude: number;
  longitude: number;
};

export default function CenterDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [mall, setMall] = useState<ShoppingMall | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMallData();
    fetchCategories();
  }, [id]);

  useEffect(() => {
    filterStores();
  }, [stores, selectedCategory, searchQuery]);

  async function fetchMallData() {
    try {
      setLoading(true);
      
      // Fetch mall details
      const { data: mallData, error: mallError } = await supabase
        .from('shopping_malls')
        .select('*')
        .eq('id', id)
        .single();

      if (mallError) throw mallError;
      setMall(mallData);

      // Fetch stores for this mall
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*, array_categories')
        .eq('mall_id', id)
        .order('index', { ascending: true });

      if (storesError) throw storesError;
      
      // Get all categories for the stores
      const categoryIds = storesData?.reduce((acc: string[], store) => {
        return acc.concat(store.array_categories || []);
      }, []);

      if (categoryIds && categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .in('id', categoryIds);

        if (categoriesError) throw categoriesError;

        // Map categories to stores
        const processedStores = storesData?.map(store => ({
          ...store,
          categories: (store.array_categories || [])
            .map(catId => categoriesData?.find(cat => cat.id === catId))
            .filter(Boolean)
        }));

        setStores(processedStores);
        setFilteredStores(processedStores);
      } else {
        setStores(storesData || []);
        setFilteredStores(storesData || []);
      }
      
    } catch (err) {
      console.error('Error fetching mall data:', err);
      setError('Error loading mall data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  function filterStores() {
    let filtered = [...stores];

    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(store => 
        store.array_categories?.includes(selectedCategory)
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(query) ||
        store.description?.toLowerCase().includes(query)
      );
    }

    setFilteredStores(filtered);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (!mall) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Shopping center not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image
          source={{
            uri: mall.image || 'https://images.unsplash.com/photo-1519567241348-f1f90a3faa10?w=800&fit=crop&q=80',
          }}
          style={styles.coverImage}
        />
        
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={24} />
        </Pressable>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{mall.name}</Text>
            <Text style={styles.description}>{mall.description}</Text>

            <View style={styles.infoRow}>
              <MapPin size={20} color="#666666" />
              <Text style={styles.infoText}>{mall.address}</Text>
            </View>
          </View>

          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar tiendas..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}>
              <Pressable
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(null)}>
                <Text style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextSelected,
                ]}>Todas</Text>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextSelected,
                  ]}>{category.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.storesSection}>
            <Text style={styles.sectionTitle}>
              Tiendas ({filteredStores.length})
            </Text>
            {filteredStores.map((store) => (
              <View key={store.id} style={styles.storeCard}>
                <Image
                  source={{
                    uri: store.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop&q=80',
                  }}
                  style={styles.storeLogo}
                />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeDescription} numberOfLines={2}>
                    {store.description}
                  </Text>
                  
                  <View style={styles.storeDetails}>
                    {store.floor && (
                      <View style={styles.detailItem}>
                        <Store size={16} color="#666666" />
                        <Text style={styles.detailText}>
                          Piso {store.floor}
                        </Text>
                      </View>
                    )}
                    
                    {store.contact_number && (
                      <View style={styles.detailItem}>
                        <Phone size={16} color="#666666" />
                        <Text style={styles.detailText}>
                          {store.contact_number}
                        </Text>
                      </View>
                    )}
                    
                    {store.hours && (
                      <View style={styles.detailItem}>
                        <Clock size={16} color="#666666" />
                        <Text style={styles.detailText}>
                          {store.hours}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  errorText: {
    fontSize: 16,
    color: '#FF4B4B',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  categoriesScroll: {
    marginHorizontal: -20,
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
  categoryChipText: {
    fontSize: 14,
    color: '#666666',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  storesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  storeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
});