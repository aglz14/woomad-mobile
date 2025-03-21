import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, Component, ReactNode } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Store,
  ArrowLeft,
  Tag,
  AlertCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';

type Category = {
  id: string;
  name: string;
};

type CategoryInfo = {
  id: string;
  name: string;
};

type Store = {
  id: string;
  name: string;
  description: string;
  floor: string;
  local_number: string;
  phone: string;
  website: string;
  image: string;
  array_categories?: string[];
  categoryInfo?: CategoryInfo[];
  active_promotions_count?: number;
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

// Add Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color="#FF4B4B" />
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorDetail}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Wrap component sections with error boundaries
const SafeView = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const STORES_PER_PAGE = 20;

  useEffect(() => {
    console.log(`CenterDetailsScreen mounted with mall ID: ${id}`);
    fetchMallData();
    fetchCategories();
  }, [id]);

  useEffect(() => {
    filterStores();
  }, [stores, selectedCategory, searchQuery]);

  async function fetchMallData() {
    try {
      console.log(`Starting to fetch mall data for ID: ${id}`);
      setLoading(true);

      // Fetch mall details
      const startTime = Date.now();
      const { data: mallData, error: mallError } = await supabase
        .from('shopping_malls')
        .select('*')
        .eq('id', id)
        .single();

      console.log(`Mall data fetch took ${Date.now() - startTime}ms`);
      console.log(
        `Mall data:`,
        JSON.stringify(mallData).substring(0, 200) + '...'
      );

      if (mallError) throw mallError;
      setMall(mallData);

      // Reset pagination when loading a new mall
      setPage(0);
      setHasMoreStores(true);
      setStores([]);
      setFilteredStores([]);

      // Fetch first page of stores
      await loadMoreStores(0);
    } catch (err) {
      console.error('Error fetching mall data:', err);
      setError('Error loading mall data');
      // Store debug info in console only, not in UI
      console.log(
        `Debug Info: Error: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreStores(pageToLoad: number) {
    if (!id || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log(`Loading stores page ${pageToLoad} for mall ID: ${id}`);

      const startTime = Date.now();
      const { data: storesData, error: storesError } = await supabase
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
          array_categories,
          store_categories(
            category_id,
            categories(
              id,
              name
            )
          )
        `
        )
        .eq('mall_id', id)
        .order('name', { ascending: true })
        .range(
          pageToLoad * STORES_PER_PAGE,
          (pageToLoad + 1) * STORES_PER_PAGE - 1
        );

      console.log(`Stores fetch took ${Date.now() - startTime}ms`);
      console.log(
        `Retrieved ${storesData?.length || 0} stores for page ${pageToLoad}`
      );

      if (storesError) throw storesError;

      if (!storesData || storesData.length === 0) {
        console.log('No more stores to load');
        setHasMoreStores(false);
        return;
      }

      // Set hasMoreStores to false if we received fewer items than the page size
      if (storesData.length < STORES_PER_PAGE) {
        setHasMoreStores(false);
      }

      // Process stores to include category information
      console.log(`Processing store data for page ${pageToLoad}...`);
      const processStartTime = Date.now();

      const processedStores = storesData.map((store) => {
        // Extract category information from store_categories
        const categoryInfo: CategoryInfo[] =
          store.store_categories && Array.isArray(store.store_categories)
            ? store.store_categories
                .filter((sc: any) => sc && sc.categories && sc.category_id)
                .map((sc: any) => ({
                  id: sc.category_id,
                  name: sc.categories?.name,
                }))
                .filter((c: any) => c && c.name)
            : [];

        return {
          ...store,
          categoryInfo, // Add processed category information
        };
      });

      console.log(
        `Store data processing took ${Date.now() - processStartTime}ms`
      );

      // Get current date for active promotions check
      const now = new Date().toISOString();

      // Count active promotions for each store in smaller batches
      console.log(
        `Counting promotions for ${processedStores.length} stores...`
      );
      const promotionsStartTime = Date.now();

      const batchSize = 5; // Process promotions in even smaller batches
      let storesWithPromotions: Store[] = [];

      for (let i = 0; i < processedStores.length; i += batchSize) {
        const batch = processedStores.slice(i, i + batchSize);
        const batchPromises = batch.map(async (store) => {
          try {
            const { count } = await supabase
              .from('promotions')
              .select('*', { count: 'exact', head: true })
              .eq('store_id', store.id)
              .gt('end_date', now);

            return {
              ...store,
              active_promotions_count: count || 0,
            };
          } catch (err) {
            console.error(
              `Error fetching promotions for store ${store.id}:`,
              err
            );
            return {
              ...store,
              active_promotions_count: 0,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        storesWithPromotions = [...storesWithPromotions, ...batchResults];

        // Allow UI to update if needed
        if (i + batchSize < processedStores.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      console.log(
        `Promotions counting took ${Date.now() - promotionsStartTime}ms`
      );
      const totalTime = Date.now() - startTime;
      console.log(
        `Total data fetch for page ${pageToLoad} took ${totalTime}ms`
      );

      // Log debug info to console only, not to state to keep it off the UI
      console.log(
        `Debug Info: Mall ID: ${id}, Page: ${pageToLoad}, Stores: ${storesWithPromotions.length}, Fetch time: ${totalTime}ms`
      );

      // Append new stores to existing ones
      setStores((prevStores) => [...prevStores, ...storesWithPromotions]);
      setPage(pageToLoad);
    } catch (err) {
      console.error(`Error loading more stores:`, err);
      // Log to console only
      console.log(
        `Debug Info: Error loading page ${pageToLoad}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoadingMore(false);
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
      filtered = filtered.filter((store) => {
        // Check if the store has the selected category in its categoryInfo
        if (
          !store.categoryInfo ||
          !Array.isArray(store.categoryInfo) ||
          store.categoryInfo.length === 0
        ) {
          return false;
        }

        return store.categoryInfo.some(
          (category: CategoryInfo) =>
            category && category.id === selectedCategory
        );
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          (store.description && store.description.toLowerCase().includes(query))
      );
    }

    setFilteredStores(filtered);
  }

  // Helper function to get category names directly from store's categoryInfo
  function getCategoryNames(store: Store) {
    if (
      !store ||
      !store.categoryInfo ||
      !Array.isArray(store.categoryInfo) ||
      store.categoryInfo.length === 0
    ) {
      return '';
    }

    return store.categoryInfo
      .filter((category: CategoryInfo) => category && category.name)
      .map((category: CategoryInfo) => category.name)
      .filter(Boolean)
      .join(', ');
  }

  // Helper function to handle loading more stores when reaching end of list
  const handleLoadMore = () => {
    if (hasMoreStores && !isLoadingMore && !loading) {
      loadMoreStores(page + 1);
    }
  };

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
        {debugInfo && <Text style={styles.debugText}>{debugInfo}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
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
        <SafeView>
          <Image
            source={{
              uri:
                mall.image ||
                'https://images.unsplash.com/photo-1519567241348-f1f90a3faa10?w=800&fit=crop&q=80',
            }}
            style={styles.coverImage}
          />

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={24} />
          </Pressable>
        </SafeView>

        <View style={styles.content}>
          <SafeView>
            <View style={styles.header}>
              <Text style={styles.title}>{mall.name}</Text>
              <Text style={styles.description}>{mall.description}</Text>

              <View style={styles.infoRow}>
                <MapPin size={20} color="#666666" />
                <Text style={styles.infoText}>{mall.address}</Text>
              </View>
            </View>
          </SafeView>

          <SafeView>
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
                style={styles.categoriesScroll}
              >
                <Pressable
                  style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      !selectedCategory && styles.categoryChipTextSelected,
                    ]}
                  >
                    Todas
                  </Text>
                </Pressable>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id &&
                        styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.id &&
                          styles.categoryChipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </SafeView>

          <SafeView>
            <View style={styles.storesList}>
              {filteredStores.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {isLoadingMore
                      ? 'Cargando tiendas...'
                      : 'No se encontraron tiendas que coincidan con tu búsqueda'}
                  </Text>
                </View>
              ) : (
                <>
                  {filteredStores.map((store) => (
                    <Pressable
                      key={store.id}
                      style={styles.storeCard}
                      onPress={() => router.push(`/store_details/${store.id}`)}
                    >
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        {store.categoryInfo &&
                          Array.isArray(store.categoryInfo) &&
                          store.categoryInfo.length > 0 &&
                          getCategoryNames(store) && (
                            <Text style={styles.storeCategory}>
                              {getCategoryNames(store)}
                            </Text>
                          )}
                        <View style={styles.storeDetails}>
                          {store.floor && (
                            <View style={styles.detailItem}>
                              <MapPin size={14} color="#666666" />
                              <Text style={styles.detailText}>
                                {store.floor ? `Piso ${store.floor}` : ''}
                                {store.floor && store.local_number ? ' ' : ''}
                                {store.local_number
                                  ? `Local ${store.local_number}`
                                  : ''}
                              </Text>
                            </View>
                          )}
                          {store.phone && (
                            <View style={styles.detailItem}>
                              <Phone size={14} color="#666666" />
                              <Text style={styles.detailText}>
                                {store.phone}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {store.active_promotions_count &&
                        store.active_promotions_count > 0 && (
                          <View style={styles.promotionBadge}>
                            <Tag size={14} color="#ffffff" />
                            <Text style={styles.promotionCount}>
                              {store.active_promotions_count}
                            </Text>
                          </View>
                        )}
                    </Pressable>
                  ))}

                  {/* Loading indicator for more stores */}
                  {isLoadingMore && (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#FF4B4B" />
                      <Text style={styles.loadingMoreText}>
                        Cargando más tiendas...
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </SafeView>
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
  storesList: {
    marginBottom: 20,
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  storeInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  storeCategory: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
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
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FF4B4B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  promotionCount: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  errorDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f0f0f0',
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
