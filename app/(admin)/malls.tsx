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
} from 'lucide-react-native';
import AdminTabBar from '@/components/AdminTabBar';
import { useAuth } from '@/hooks/useAuth';

const defaultFormValues = {
  name: '',
  address: '',
  description: '',
  latitude: '',
  longitude: '',
  image: '',
  user_id: '',
};

type MallForm = {
  name: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  image: string;
  user_id: string;
};

export default function ManageMallsScreen() {
  const [malls, setMalls] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MallForm>({
    defaultValues: {
      ...defaultFormValues,
      user_id: userId || '',
    },
  });

  useEffect(() => {
    if (userId) {
      fetchMalls();
    }
  }, [userId]);

  async function fetchMalls() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_malls')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setMalls(data || []);
    } catch (err) {
      console.error('Error fetching malls:', err);
      setError(
        'Error al cargar plazas comerciales. Por favor, intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: MallForm) {
    try {
      setLoading(true);
      setError(null);

      const formattedData = {
        name: data.name,
        address: data.address,
        description: data.description,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        image: data.image,
        user_id: userId,
      };

      if (editingId) {
        // First check if the mall belongs to the current user
        const { data: existingMall, error: fetchError } = await supabase
          .from('shopping_malls')
          .select('user_id')
          .eq('id', editingId)
          .single();

        if (fetchError) throw fetchError;

        if (existingMall.user_id !== userId) {
          throw new Error('No tienes permiso para editar esta plaza comercial');
        }

        // Update existing mall
        const { error: updateError } = await supabase
          .from('shopping_malls')
          .update(formattedData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        // Insert new mall
        const { error: insertError } = await supabase
          .from('shopping_malls')
          .insert(formattedData);

        if (insertError) throw insertError;
      }

      reset({
        ...defaultFormValues,
        user_id: userId || '',
      });
      setEditingId(null);
      await fetchMalls();
    } catch (err: any) {
      setError(
        err.message ||
          (editingId
            ? 'Error al actualizar plaza comercial'
            : 'Error al crear plaza comercial')
      );
      console.error('Error saving mall:', err);
    } finally {
      setLoading(false);
    }
  }

  function editMall(mall: any) {
    if (mall.user_id !== userId) {
      setError('No tienes permiso para editar esta plaza comercial');
      return;
    }

    setEditingId(mall.id);
    reset({
      name: mall.name,
      address: mall.address || '',
      description: mall.description || '',
      latitude: mall.latitude ? mall.latitude.toString() : '',
      longitude: mall.longitude ? mall.longitude.toString() : '',
      image: mall.image || '',
      user_id: mall.user_id,
    });
  }

  async function deleteMall(id: string) {
    try {
      setLoading(true);

      // First check if the mall belongs to the current user
      const { data: mall, error: fetchError } = await supabase
        .from('shopping_malls')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (mall.user_id !== userId) {
        throw new Error('No tienes permiso para eliminar esta plaza comercial');
      }

      const { error } = await supabase
        .from('shopping_malls')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchMalls();
    } catch (err: any) {
      console.error('Error deleting mall:', err);
      setError(
        err.message ||
          'Error al eliminar plaza comercial. Por favor, intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && malls.length === 0) {
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
            {editingId
              ? 'Editar Plaza Comercial'
              : 'Agregar Nueva Plaza Comercial'}
          </Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'El nombre es obligatorio' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Nombre"
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
            name="address"
            rules={{ required: 'La dirección es obligatoria' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  placeholder="Dirección"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.address && (
                  <Text style={styles.errorMessage}>
                    {errors.address.message}
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

          <View style={styles.row}>
            <Controller
              control={control}
              name="latitude"
              rules={{ required: 'La latitud es obligatoria' }}
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={[styles.input, errors.latitude && styles.inputError]}
                    placeholder="Latitud"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                  />
                  {errors.latitude && (
                    <Text style={styles.errorMessage}>
                      {errors.latitude.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="longitude"
              rules={{ required: 'La longitud es obligatoria' }}
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.longitude && styles.inputError,
                    ]}
                    placeholder="Longitud"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                  />
                  {errors.longitude && (
                    <Text style={styles.errorMessage}>
                      {errors.longitude.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

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

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>
              {editingId ? 'Actualizar Plaza' : 'Agregar Plaza'}
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

        <View style={styles.mallsContainer}>
          <Text style={styles.listTitle}>Plazas Comerciales</Text>
          {malls.map((mall) => (
            <View key={mall.id} style={styles.mallItem}>
              <View style={styles.mallInfo}>
                <Text style={styles.mallName}>{mall.name}</Text>
                <Text style={styles.mallAddress}>{mall.address}</Text>
              </View>
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editMall(mall)}
                >
                  <Edit2 size={20} color="#666666" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteMall(mall.id)}
                >
                  <Trash2 size={20} color="#FF4B4B" />
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
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
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
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#FF4B4B',
  },
  errorMessage: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#FF4B4B',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  mallsContainer: {
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  mallCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
  },
  mallInfo: {
    flex: 1,
  },
  mallName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mallAddress: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
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
