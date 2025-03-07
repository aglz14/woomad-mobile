import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Store, MapPin, Filter } from 'lucide-react-native';

type Store = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  floor: string;
  location_in_mall: string;
  contact_number: string;
  category: string;
};

type Mall = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
};

export default function ShoppingProfileScreen() {
  const { id } = useLocalSearchParams();
  const [mall, setMall] = useState<Mall | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMallData();
  }, [id]);

  useEffect(() => {
    if (stores.length > 0) {
      const uniqueCategories = Array.from(new Set(stores.map(store => store.category)));
      setCategories(uniqueCategories);
      filterStores(selectedCategory);
    }
  }, [stores, selectedCategory]);

  async function fetchMallData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch mall details
      const { data: mallData, error: mallError } = await supabase
        .from('shopping_malls')
        .select('*')
        .eq('id', id)
        .single();

      if (mallError) throw mallError;
      setMall(mallData);

      // Fetch stores
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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: mall.image || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&fit=crop&q=80',
        }}
        style={styles.headerImage}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{mall.name}</Text>
          <View style={styles.addressContainer}>
            <MapPin size={16} color="#666666" />
            <Text style={styles.address}>{mall.address}</Text>
          </View>
          {mall.description && (
            <Text style={styles.description}>{mall.description}</Text>
          )}
        </View>

        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Filter size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Filter by Category</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}>
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
                All
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
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.storesSection}>
          <View style={styles.sectionHeader}>
            <Store size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Stores</Text>
          </View>
          {filteredStores.map((store) => (
            <Pressable key={store.id} style={styles.storeCard}>
              <Image
                source={{
                  uri: store.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop&q=80',
                }}
                style={styles.storeLogo}
              />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeCategory}>{store.category}</Text>
                <Text style={styles.storeLocation}>
                  Floor {store.floor} • {store.location_in_mall}
                </Text>
                {store.contact_number && (
                  <Text style={styles.storeContact}>{store.contact_number}</Text>
                )}
              </View>
            </Pressable>
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
  },
  error: {
    color: '#FF4B4B',
    fontSize: 16,
  },
  headerImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
  description: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    lineHeight: 20,
  },
  categoriesSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
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
  storesSection: {
    marginTop: 24,
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
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
  storeLocation: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  storeContact: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});