import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
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
  Calendar,
  ArrowLeft,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/hooks/useAuth';
import { createBoxShadow } from '@/utils/styles';

const defaultFormValues = {
  title: '',
  description: '',
  store_id: '',
  start_date: '',
  end_date: '',
  image: '',
  terms_conditions: '',
  user_id: '',
};

type PromotionForm = {
  title: string;
  description: string;
  store_id: string;
  start_date: string;
  end_date: string;
  image: string;
  terms_conditions: string;
  user_id: string;
};

export default function ManagePromotionsScreen() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PromotionForm>({
    defaultValues: {
      ...defaultFormValues,
      user_id: userId || '',
    },
  });

  useEffect(() => {
    if (userId) {
      fetchPromotions();
      fetchStores();
    }
  }, [userId]);

  async function fetchPromotions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select(
          `
          id, 
          title, 
          description, 
          store_id, 
          start_date,
          end_date,
          image,
          terms_conditions,
          user_id,
          stores (
            id,
            name,
            shopping_malls (
              id,
              name
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Error al cargar promociones. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStores() {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(
          `
          id, 
          name,
          shopping_malls (
            id,
            name
          )
        `
        )
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  }

  async function onSubmit(data: PromotionForm) {
    try {
      setLoading(true);
      setError(null);

      const formattedData = {
        ...data,
        user_id: userId,
      };

      if (editingId) {
        // First check if the promotion belongs to the current user
        const { data: existingPromotion, error: fetchError } = await supabase
          .from('promotions')
          .select('user_id')
          .eq('id', editingId)
          .single();

        if (fetchError) throw fetchError;

        if (existingPromotion.user_id !== userId) {
          throw new Error('No tienes permiso para editar esta promoción');
        }

        const { error: updateError } = await supabase
          .from('promotions')
          .update(formattedData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('promotions')
          .insert(formattedData);

        if (insertError) throw insertError;
      }

      // Clear form and reset to default values
      reset({
        title: '',
        description: '',
        store_id: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        image: '',
        terms_conditions: '',
        user_id: userId || '',
      });

      // Clear editing state
      setEditingId(null);

      // Refresh the promotions list
      await fetchPromotions();

      // Show success message
      alert(
        editingId
          ? 'Promoción actualizada con éxito'
          : 'Promoción creada con éxito'
      );
    } catch (err: any) {
      setError(
        err.message ||
          (editingId
            ? 'Error al actualizar promoción'
            : 'Error al crear promoción')
      );
      console.error('Error saving promotion:', err);
    } finally {
      setLoading(false);
    }
  }

  function editPromotion(promotion: any) {
    if (promotion.user_id !== userId) {
      setError('No tienes permiso para editar esta promoción');
      return;
    }

    setEditingId(promotion.id);
    reset({
      title: promotion.title,
      description: promotion.description || '',
      store_id: promotion.store_id,
      start_date: promotion.start_date || '',
      end_date: promotion.end_date || '',
      image: promotion.image || '',
      terms_conditions: promotion.terms_conditions || '',
      user_id: promotion.user_id,
    });
  }

  async function deletePromotion(id: string) {
    try {
      setLoading(true);

      // First check if the promotion belongs to the current user
      const { data: promotion, error: fetchError } = await supabase
        .from('promotions')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (promotion.user_id !== userId) {
        throw new Error('No tienes permiso para eliminar esta promoción');
      }

      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      await fetchPromotions();
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
      setError(
        err.message ||
          'Error al eliminar promoción. Por favor, intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForDB = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (loading && promotions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF4B4B" />
        </View>
      </View>
    );
  }

  // Show message if no stores are available
  if (!loading && stores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.noDataText}>
            Por favor agrega una tienda primero
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
            {editingId ? 'Editar Promoción' : 'Agregar Nueva Promoción'}
          </Text>

          <Controller
            control={control}
            name="title"
            rules={{ required: 'El título es obligatorio' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Título de la Promoción"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.title && (
                  <Text style={styles.errorMessage}>
                    {errors.title.message}
                  </Text>
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
            name="store_id"
            rules={{ required: 'El negocio es obligatorio' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <View
                  style={[styles.input, errors.store_id && styles.inputError]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.storesRow}>
                      {stores.map((store) => (
                        <Pressable
                          key={store.id}
                          style={[
                            styles.storeChip,
                            value === store.id && styles.selectedStoreChip,
                          ]}
                          onPress={() => onChange(store.id)}
                        >
                          <Text
                            style={[
                              styles.storeChipText,
                              value === store.id &&
                                styles.selectedStoreChipText,
                            ]}
                          >
                            {store.name} (
                            {store.shopping_malls?.name || 'Sin plaza'})
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {errors.store_id && (
                  <Text style={styles.errorMessage}>
                    {errors.store_id.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Start Date - Full Width */}
          <Controller
            control={control}
            name="start_date"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Fecha de Inicio</Text>
                <Pressable
                  style={styles.dateInputContainer}
                  onPress={() => {
                    // Close end date picker if open
                    setShowEndDatePicker(false);
                    // Toggle start date picker
                    setShowStartDatePicker(!showStartDatePicker);
                  }}
                >
                  <Calendar
                    size={20}
                    color="#666666"
                    style={styles.calendarIcon}
                  />
                  <Text style={styles.dateText}>
                    {value
                      ? formatDateForDisplay(value)
                      : 'Seleccionar fecha de inicio'}
                  </Text>
                </Pressable>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        onChange(formatDateForDB(selectedDate));
                      }
                    }}
                  />
                )}
                {errors.start_date && (
                  <Text style={styles.errorMessage}>
                    {errors.start_date.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* End Date - Full Width */}
          <Controller
            control={control}
            name="end_date"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Fecha de Fin</Text>
                <Pressable
                  style={styles.dateInputContainer}
                  onPress={() => {
                    // Close start date picker if open
                    setShowStartDatePicker(false);
                    // Toggle end date picker
                    setShowEndDatePicker(!showEndDatePicker);
                  }}
                >
                  <Calendar
                    size={20}
                    color="#666666"
                    style={styles.calendarIcon}
                  />
                  <Text style={styles.dateText}>
                    {value
                      ? formatDateForDisplay(value)
                      : 'Seleccionar fecha de fin'}
                  </Text>
                </Pressable>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        onChange(formatDateForDB(selectedDate));
                      }
                    }}
                  />
                )}
                {errors.end_date && (
                  <Text style={styles.errorMessage}>
                    {errors.end_date.message}
                  </Text>
                )}
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
                  placeholder="URL de Imagen"
                  value={value}
                  onChangeText={onChange}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="terms_conditions"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Términos y Condiciones"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          />

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>
              {editingId ? 'Actualizar Promoción' : 'Agregar Promoción'}
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

        <View style={styles.promotionsContainer}>
          <Text style={styles.listTitle}>Promociones</Text>
          {promotions.map((promotion) => (
            <View key={promotion.id} style={styles.promotionItem}>
              <View style={styles.promotionInfo}>
                <Text style={styles.promotionTitle}>{promotion.title}</Text>
                <Text style={styles.promotionStore}>
                  {promotion.stores?.name || 'Negocio Desconocido'}
                  {promotion.stores?.shopping_malls?.name &&
                    ` (${promotion.stores.shopping_malls.name})`}
                </Text>
                <Text style={styles.promotionDates}>
                  {formatDateForDisplay(promotion.start_date)}
                  {promotion.end_date &&
                    ` - ${formatDateForDisplay(promotion.end_date)}`}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editPromotion(promotion)}
                >
                  <Edit2 size={16} color="#666666" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deletePromotion(promotion.id)}
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  storesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  storeChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedStoreChip: {
    backgroundColor: '#FF4B4B',
  },
  storeChipText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedStoreChipText: {
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
  promotionsContainer: {
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  promotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    ...createBoxShadow(0, 1, 2, 0.1),
  },
  promotionInfo: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  promotionStore: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  promotionDates: {
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  noDataText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
});
