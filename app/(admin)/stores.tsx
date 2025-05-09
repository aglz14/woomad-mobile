import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
  Plus,
  CreditCard as Edit2,
  Trash2,
  CircleAlert as AlertCircle,
  ArrowLeft,
  Store as StoreIcon,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { createBoxShadow } from '@/utils/styles';

// Define a type for categories
type Category = {
  id: string;
  name: string;
};

// Define a type for category info
type CategoryInfo = {
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
  user_id: '',
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
  user_id: string;
};

export default function ManageStoresScreen() {
  const [stores, setStores] = useState<any[]>([]);
  const [malls, setMalls] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreForm>({
    defaultValues: {
      ...defaultFormValues,
      user_id: userId || '',
    },
  });

  // Watch the categories field to update the UI when it changes
  const selectedCategories = watch('categories') || [];

  useEffect(() => {
    if (userId) {
      fetchStores();
      fetchMalls();
      fetchCategories();
    }
  }, [userId]);

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
          user_id,
          shopping_malls (
            id,
            name
          ),
          store_categories(
            category_id,
            categories(
              id,
              name
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      // Process stores to include category information
      const processedStores = (data || []).map((store) => {
        // Extract category information from store_categories
        const categoryInfo: CategoryInfo[] =
          store.store_categories
            ?.map((sc: any) => ({
              id: sc.category_id,
              name: sc.categories?.name,
            }))
            .filter((c: any) => c.name) || [];

        return {
          ...store,
          categoryInfo, // Add processed category information
        };
      });

      setStores(processedStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Error al cargar negocios. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMalls() {
    try {
      const { data, error } = await supabase
        .from('shopping_malls')
        .select('id, name')
        .eq('user_id', userId)
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

      const formattedData = {
        name: data.name,
        description: data.description,
        mall_id: data.mall_id,
        array_categories: Array.isArray(data.categories) ? data.categories : [],
        image: data.image,
        phone: data.phone,
        website: data.website,
        floor: data.floor,
        local_number: data.local_number,
        user_id: userId,
      };

      let storeId = editingId;

      if (editingId) {
        // First check if the store belongs to the current user
        const { data: existingStore, error: fetchError } = await supabase
          .from('stores')
          .select('user_id')
          .eq('id', editingId)
          .single();

        if (fetchError) throw fetchError;

        if (existingStore.user_id !== userId) {
          throw new Error('No tienes permiso para editar este negocio');
        }

        const { error: updateError } = await supabase
          .from('stores')
          .update(formattedData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        // Insert new store and get the ID
        const { data: newStore, error: insertError } = await supabase
          .from('stores')
          .insert(formattedData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        storeId = newStore.id;
      }

      // Now handle the store_categories relation
      if (storeId) {
        // First, delete existing relations for this store
        const { error: deleteError } = await supabase
          .from('store_categories')
          .delete()
          .eq('store_id', storeId);

        if (deleteError) throw deleteError;

        // Then insert new relations for each selected category
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const categoryRelations = data.categories.map((categoryId) => ({
            store_id: storeId,
            category_id: categoryId,
          }));

          const { error: insertRelationsError } = await supabase
            .from('store_categories')
            .insert(categoryRelations);

          if (insertRelationsError) throw insertRelationsError;
        }
      }

      // Clear form and reset to default values
      reset(
        {
          name: '',
          description: '',
          mall_id: '',
          categories: [],
          image: '',
          phone: '',
          website: '',
          floor: '',
          local_number: '',
          user_id: userId || '',
        },
        { keepDefaultValues: false }
      );

      // Clear editing state
      setEditingId(null);

      // Refresh the store list
      await fetchStores();

      // Show success message
      alert(
        editingId ? 'Negocio actualizado con éxito' : 'Negocio creado con éxito'
      );
    } catch (err: any) {
      setError(
        err.message ||
          (editingId ? 'Error al actualizar negocio' : 'Error al crear negocio')
      );
      console.error('Error saving store:', err);
    } finally {
      setLoading(false);
    }
  }

  function editStore(store: any) {
    if (store.user_id !== userId) {
      setError('No tienes permiso para editar este negocio');
      return;
    }

    setEditingId(store.id);

    // Extract category IDs from categoryInfo
    const categoryIds = Array.isArray(store.categoryInfo)
      ? store.categoryInfo.map((cat: CategoryInfo) => cat.id)
      : [];

    reset({
      name: store.name,
      description: store.description || '',
      mall_id: store.mall_id,
      categories: categoryIds,
      image: store.image || '',
      phone: store.phone || '',
      website: store.website || '',
      floor: store.floor || '',
      local_number: store.local_number || '',
      user_id: store.user_id,
    });
  }

  async function deleteStore(id: string) {
    try {
      setLoading(true);

      // First check if the store belongs to the current user
      const { data: store, error: fetchError } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (store.user_id !== userId) {
        throw new Error('No tienes permiso para eliminar este negocio');
      }

      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      await fetchStores();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      setError(
        err.message || 'Error al eliminar negocio. Por favor, intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get category names from IDs
  function getCategoryNames(store: any) {
    if (
      !store ||
      !store.categoryInfo ||
      !Array.isArray(store.categoryInfo) ||
      store.categoryInfo.length === 0
    ) {
      return '';
    }

    return store.categoryInfo
      .map((category: CategoryInfo) => category.name)
      .filter(Boolean)
      .join(', ');
  }

  // Helper function to toggle a category selection
  function toggleCategory(categoryId: string) {
    // Ensure we have a valid array to work with
    const currentCategories = Array.isArray(selectedCategories)
      ? [...selectedCategories]
      : [];
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
      </View>
    );
  }

  // Show message if no malls are available
  if (!loading && malls.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <StoreIcon color="#FF4B4B" size={40} />
          <Text style={styles.noDataText}>
            Por favor agrega una plaza o centro comercial primero
          </Text>
        </View>
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
            {editingId ? 'Editar Negocio' : 'Agregar Nuevo Negocio'}
          </Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'El nombre es obligatorio' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Nombre del Negocio"
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
                  placeholder="Descripción"
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
            rules={{ required: 'La plaza comercial es obligatoria' }}
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
            render={({ field: { value } }) => {
              // Ensure value is always an array
              const categoriesValue = Array.isArray(value) ? value : [];

              return (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Categorías</Text>
                  <View style={styles.categoriesContainer}>
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          categoriesValue.includes(category.id) &&
                            styles.selectedCategoryChip,
                        ]}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            categoriesValue.includes(category.id) &&
                              styles.selectedCategoryChipText,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            }}
          />

          <Controller
            control={control}
            name="image"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="URL de Imagen"
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
                    placeholder="Piso"
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
                    placeholder="Número de Local"
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
                    placeholder="Teléfono"
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
                    placeholder="Sitio Web"
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
              {editingId ? 'Actualizar Negocio' : 'Agregar Negocio'}
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
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.storesContainer}>
          <Text style={styles.listTitle}>Negocios</Text>
          {stores.map((store) => (
            <View key={store.id} style={styles.storeItem}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeDetails}>
                  {store.shopping_malls?.name || 'Sin plaza asignada'}
                </Text>
                {store.categoryInfo &&
                  Array.isArray(store.categoryInfo) &&
                  store.categoryInfo.length > 0 && (
                    <Text style={styles.storeCategory}>
                      {getCategoryNames(store)}
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
    ...createBoxShadow(0, 2, 4, 0.1),
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
    ...createBoxShadow(0, 1, 2, 0.1),
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
  noDataText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
