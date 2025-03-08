import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Clock, ArrowLeft, Tag, Calendar } from 'lucide-react-native';

type StoreDetails = {
  id: string;
  name: string;
  description: string;
  category: string;
  floor: string;
  location_in_mall: string;
  contact_number: string;
  hours: string;
  mall: {
    id: string;
    name: string;
  };
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

      // Fetch store details with mall information
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(`
          *,
          mall:shopping_malls!stores_mall_id_fkey (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Fetch active promotions for this store
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', id)
        .gt('end_date', now)
        .order('end_date', { ascending: true });

      if (promotionsError) throw promotionsError;
      setPromotions(promotionsData || []);

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

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ArrowLeft color="#1a1a1a" size={24} />
          </Pressable>
          
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.mallName}>{store.mall.name}</Text>
          
          <Text style={styles.description}>{store.description}</Text>

          <View style={styles.detailsContainer}>
            {store.floor && (
              <View style={styles.detailRow}>
                <Store size={20} color="#666666" />
                <Text style={styles.detailText}>Piso {store.floor}</Text>
              </View>
            )}
            
            {store.location_in_mall && (
              <View style={styles.detailRow}>
                <MapPin size={20} color="#666666" />
                <Text style={styles.detailText}>{store.location_in_mall}</Text>
              </View>
            )}
            
            {store.contact_number && (
              <View style={styles.detailRow}>
                <Phone size={20} color="#666666" />
                <Text style={styles.detailText}>{store.contact_number}</Text>
              </View>
            )}
            
            {store.hours && (
              <View style={styles.detailRow}>
                <Clock size={20} color="#666666" />
                <Text style={styles.detailText}>{store.hours}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.promotionsSection}>
          <Text style={styles.sectionTitle}>
            Promociones Activas ({promotions.length})
          </Text>
          
          {promotions.length === 0 ? (
            <View style={styles.noPromotions}>
              <Tag size={32} color="#666666" />
              <Text style={styles.noPromotionsText}>
                No hay promociones activas en este momento
              </Text>
            </View>
          ) : (
            promotions.map((promo) => (
              <View key={promo.id} style={styles.promotionCard}>
                <Image
                  source={{
                    uri: promo.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&fit=crop&q=80',
                  }}
                  style={styles.promotionImage}
                />
                <View style={styles.promotionInfo}>
                  <Text style={styles.promotionTitle}>{promo.title}</Text>
                  <Text style={styles.promotionDescription}>
                    {promo.description}
                  </Text>
                  <View style={styles.promotionFooter}>
                    <Calendar size={16} color="#FF4B4B" />
                    <Text style={styles.promotionDate}>
                      Válido hasta: {formatDate(promo.end_date)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
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
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
    style: {
      pointerEvents: 'auto'
    },
  },
  storeName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  mallName: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 12,
  },
  promotionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  noPromotions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  noPromotionsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  promotionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  promotionImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  promotionInfo: {
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
    lineHeight: 20,
    marginBottom: 16,
  },
  promotionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  promotionDate: {
    fontSize: 14,
    color: '#FF4B4B',
    marginLeft: 8,
    fontWeight: '500',
  },
});