import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  ArrowLeft,
  Tag,
  Calendar,
} from 'lucide-react-native';
import { createBoxShadow } from '@/utils/styles';

type StoreDetails = {
  id: string;
  name: string;
  description: string;
  floor: string;
  local_number: string;
  phone: string;
  website: string;
  image: string;
  mall_name?: string;
};

type Promotion = {
  id: string;
  title: string;
  description: string;
  image: string;
  end_date: string;
  type: string;
};

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreData();
  }, [id]);

  async function fetchStoreData() {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(
          `
          id,
          name,
          description,
          floor,
          local_number,
          phone,
          website,
          image,
          mall_id
        `
        )
        .eq('id', id)
        .single();

      if (storeError) throw storeError;

      // Fetch mall name separately
      let mallName = '';
      if (storeData.mall_id) {
        const { data: mallData } = await supabase
          .from('shopping_malls')
          .select('name')
          .eq('id', storeData.mall_id)
          .single();

        if (mallData) {
          mallName = mallData.name;
        }
      }

      // Transform the data to match our type
      const transformedData: StoreDetails = {
        id: storeData.id,
        name: storeData.name,
        description: storeData.description || '',
        floor: storeData.floor || '',
        local_number: storeData.local_number || '',
        phone: storeData.phone || '',
        website: storeData.website || '',
        image: storeData.image || '',
        mall_name: mallName,
      };

      setStore(transformedData);

      // Fetch active promotions for this store
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', id)
        .gt('end_date', now)
        .order('end_date', { ascending: true });

      if (promotionsError) throw promotionsError;

      // Process promotions to ensure image URLs are handled
      const processedPromotions = (promotionsData || []).map((promo) => ({
        ...promo,
        image: promo.image || '',
      }));

      setPromotions(processedPromotions);
    } catch (err) {
      console.error('Error fetching store data:', err);
      setError('Error loading store data');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (error || !store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Store not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButtonContainer}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </Pressable>

          <Image
            source={{
              uri:
                store.image ||
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3RvcmV8ZW58MHx8MHx8fDA%3D',
            }}
            style={styles.storeImage}
          />

          <View style={styles.headerOverlay}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.mallName}>{store.mall_name}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>{store.description}</Text>

          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Información</Text>

            <View style={styles.details}>
              {store.floor && (
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#666666" />
                  <Text style={styles.detailText}>
                    {store.floor ? `Piso ${store.floor}` : ''}
                    {store.floor && store.local_number ? ' ' : ''}
                    {store.local_number ? `Local ${store.local_number}` : ''}
                  </Text>
                </View>
              )}

              {store.phone && (
                <View style={styles.detailRow}>
                  <Phone size={20} color="#666666" />
                  <Text style={styles.detailText}>{store.phone}</Text>
                </View>
              )}

              {store.website && (
                <View style={styles.detailRow}>
                  <Clock size={20} color="#666666" />
                  <Text style={styles.detailText}>{store.website}</Text>
                </View>
              )}
            </View>
          </View>

          {promotions.length > 0 && (
            <View style={styles.promotionsContainer}>
              <Text style={styles.sectionTitle}>Promociones Activas</Text>

              {promotions.map((promotion) => (
                <View key={promotion.id} style={styles.promotionCard}>
                  <Image
                    source={{
                      uri:
                        promotion.image ||
                        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2hvcHBpbmd8ZW58MHx8MHx8fDA%3D',
                    }}
                    style={styles.promotionImage}
                  />

                  <View style={styles.promotionContent}>
                    <Text style={styles.promotionTitle}>{promotion.title}</Text>
                    <Text style={styles.promotionDescription}>
                      {promotion.description}
                    </Text>

                    <View style={styles.promotionFooter}>
                      <View style={styles.promotionDateContainer}>
                        <Calendar size={16} color="#666666" />
                        <Text style={styles.promotionDate}>
                          {'Válido hasta ' + formatDate(promotion.end_date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  header: {
    backgroundColor: '#ffffff',
    padding: 0,
    paddingTop: 0,
    position: 'relative',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  storeImage: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  mallName: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  details: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...createBoxShadow(0, 2, 4, 0.1),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  promotionsContainer: {
    marginBottom: 20,
  },
  promotionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...createBoxShadow(0, 2, 4, 0.1),
  },
  promotionImage: {
    width: '100%',
    height: 150,
  },
  promotionImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionContent: {
    padding: 16,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  promotionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promotionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionDate: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});
