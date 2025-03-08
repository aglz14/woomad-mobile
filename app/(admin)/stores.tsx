import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
  Plus,
  CreditCard as Edit2,
  Trash2,
  CircleAlert as AlertCircle,
  Check,
  X,
} from 'lucide-react-native';
import AdminTabBar from '@/components/AdminTabBar';

// Define a type for categories
type Category = {
  id: string;
  name: string;
};

const defaultFormValues = {
  name: '',
  description: '',
  mall_id: '',
  categories: [] as string[], // Changed from single category to array of category IDs
  image: '',
  phone: '',
  website: '',
  floor: '',
  local_number: '',
};

type StoreForm = {
  name: string;
  description: string;
  mall_id: string;
  categories: string[]; // Changed from single category to array of category IDs
  image: string;
  phone: string;
  website: string;
  floor: string;
  local_number: string;
};

export default function ManageStoresScreen() {
  const [stores, setStores] = useState<any[]>([]);
  const [malls, setMalls] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreForm>({
    defaultValues: defaultFormValues,
  });

  // Watch the categories field to update the UI when it changes
  const selectedCategories = watch('categories');

  useEffect(() => {
    fetchStores();
    fetchMalls();
    fetchCategories();
  }, []);

  async function fetchStores() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select(
          `
          id, 
          name, 
          description, 
          mall_id, 
          array_categories,
          image,
          phone,
          website,
          floor,
          local_number,
          shopping_malls (
            id,
            name
          )
        `
        )
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Error loading stores. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMalls() {
    try {
      const { data, error } = await supabase
        .from('shopping_malls')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setMalls(data || []);
    } catch (err) {
      console.error('Error fetching malls:', err);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function onSubmit(data: StoreForm) {
    try {
      setLoading(true);
      setError(null);

      if (editingId) {
        // Update existing store
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            name: data.name,
            description: data.description,
            mall_id: data.mall_id,
            image: data.image,
            phone: data.phone,
            website: data.website,
            floor: data.floor,
            local_number: data.local_number,
          })
          .eq('id', editingId);

        if (updateError) throw updateError;

        // Update store categories
        await updateStoreCategories(editingId, data.categories);
      } else {
        // Insert new store
        const { data: newStore, error: insertError } = await supabase
          .from('stores')
          .insert({
            name: data.name,
            description: data.description,
            mall_id: data.mall_id,
            image: data.image,
            phone: data.phone,
            website: data.website,
            floor: data.floor,
            local_number: data.local_number,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Add store categories
        if (newStore && data.categories.length > 0) {
          await updateStoreCategories(newStore.id, data.categories);
        }
      }

      reset(defaultFormValues);
      setEditingId(null);
      await fetchStores();
    } catch (err) {
      setError(editingId ? 'Error updating store' : 'Error creating store');
      console.error('Error saving store:', err);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to update store categories
  async function updateStoreCategories(storeId: string, categoryIds: string[]) {
    try {
      // First, delete all existing categories for this store
      const { error: deleteError } = await supabase
        .from('store_categories')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) throw deleteError;

      // Then, insert the new categories
      if (categoryIds.length > 0) {
        const categoryRows = categoryIds.map((categoryId) => ({
          store_id: storeId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from('store_categories')
          .insert(categoryRows);

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error updating store categories:', err);
      throw err;
    }
  }

  function editStore(store: any) {
    setEditingId(store.id);
    reset({
      name: store.name,
      description: store.description || '',
      mall_id: store.mall_id,
      categories: store.array_categories || [],
      image: store.image || '',
      phone: store.phone || '',
      website: store.website || '',
      floor: store.floor || '',
      local_number: store.local_number || '',
    });
  }

  async function deleteStore(id: string) {
    try {
      setLoading(true);

      // Delete store categories first
      await supabase.from('store_categories').delete().eq('store_id', id);

      // Then delete the store
      const { error } = await supabase.from('stores').delete().eq('id', id);

      if (error) throw error;
      await fetchStores();
    } catch (err) {
      console.error('Error deleting store:', err);
      setError('Error deleting store. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get category names from IDs
  function getCategoryNames(categoryIds: string[] = []) {
    return categoryIds
      .map((id) => categories.find((cat) => cat.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  // Helper function to toggle a category selection
  function toggleCategory(categoryId: string) {
    const currentCategories = [...selectedCategories];
    const index = currentCategories.indexOf(categoryId);

    if (index > -1) {
      // Remove category if already selected
      currentCategories.splice(index, 1);
    } else {
      // Add category if not selected
      currentCategories.push(categoryId);
    }

    setValue('categories', currentCategories);
  }

  if (loading && stores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF4B4B" />
        </View>
        <AdminTabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#FF4B4B" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Store' : 'Add New Store'}
          </Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Store Name"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.name && (
                  <Text style={styles.errorMessage}>{errors.name.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="mall_id"
            rules={{ required: 'Shopping Center is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <View
                  style={[styles.input, errors.mall_id && styles.inputError]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.mallsRow}>
                      {malls.map((mall) => (
                        <Pressable
                          key={mall.id}
                          style={[
                            styles.mallChip,
                            value === mall.id && styles.selectedMallChip,
                          ]}
                          onPress={() => onChange(mall.id)}
                        >
                          <Text
                            style={[
                              styles.mallChipText,
                              value === mall.id && styles.selectedMallChipText,
                            ]}
                          >
                            {mall.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {errors.mall_id && (
                  <Text style={styles.errorMessage}>
                    {errors.mall_id.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Categories multi-select */}
          <Controller
            control={control}
            name="categories"
            render={({ field: { value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categories</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        value.includes(category.id) &&
                          styles.selectedCategoryChip,
                      ]}
                      onPress={() => toggleCategory(category.id)}
                    >
                      {value.includes(category.id) && (
                        <Check
                          size={14}
                          color="#ffffff"
                          style={styles.categoryIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.categoryChipText,
                          value.includes(category.id) &&
                            styles.selectedCategoryChipText,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="image"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL"
                  value={value}
                  onChangeText={onChange}
                />
              </View>
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="floor"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Floor"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="local_number"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Local Number"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.row}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Website"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>
              {editingId ? 'Update Store' : 'Add Store'}
            </Text>
          </Pressable>

          {editingId && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setEditingId(null);
                reset(defaultFormValues);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.storesContainer}>
          <Text style={styles.listTitle}>Stores</Text>
          {stores.map((store) => (
            <View key={store.id} style={styles.storeItem}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeDetails}>
                  {store.shopping_malls?.name || 'No mall assigned'}
                </Text>
                {store.array_categories &&
                  store.array_categories.length > 0 && (
                    <Text style={styles.storeCategory}>
                      {getCategoryNames(store.array_categories)}
                    </Text>
                  )}
              </View>
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editStore(store)}
                >
                  <Edit2 size={16} color="#666666" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteStore(store.id)}
                >
                  <Trash2 size={16} color="#FF4B4B" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AdminTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    margin: 20,
    marginBottom: 0,
  },
  errorText: {
    color: '#FF4B4B',
    marginLeft: 8,
    fontSize: 14,
  },
  form: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#FF4B4B',
  },
  errorMessage: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  mallsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mallChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMallChip: {
    backgroundColor: '#FF4B4B',
  },
  mallChipText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedMallChipText: {
    color: '#ffffff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#FF4B4B',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryChipText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#FF4B4B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  storesContainer: {
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  storeDetails: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  storeCategory: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginLeft: 8,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
});
