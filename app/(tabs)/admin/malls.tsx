import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, CircleAlert as AlertCircle } from 'lucide-react-native';

const defaultFormValues = {
  name: '',
  address: '',
  description: '',
  latitude: '',
  longitude: '',
  image: '',
};

type MallForm = {
  name: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  image: string;
};

export default function ManageMallsScreen() {
  const [malls, setMalls] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<MallForm>({
    defaultValues: defaultFormValues
  });

  useEffect(() => {
    fetchMalls();
  }, []);

  async function fetchMalls() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('shopping_malls')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMalls(data || []);
      setError(null);
    } catch (err) {
      setError('Error loading shopping centers');
      console.error('Error fetching malls:', err);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: MallForm) {
    try {
      setLoading(true);
      setError(null);

      const mallData = {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('shopping_malls')
          .update(mallData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('shopping_malls')
          .insert([mallData]);

        if (insertError) throw insertError;
      }

      reset(defaultFormValues);
      setEditingId(null);
      await fetchMalls();
    } catch (err) {
      setError(editingId ? 'Error updating shopping center' : 'Error creating shopping center');
      console.error('Error saving mall:', err);
    } finally {
      setLoading(false);
    }
  }

  function editMall(mall: any) {
    setEditingId(mall.id);
    reset({
      name: mall.name,
      address: mall.address,
      description: mall.description || '',
      latitude: mall.latitude.toString(),
      longitude: mall.longitude.toString(),
      image: mall.image || '',
    });
  }

  async function deleteMall(id: string) {
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('shopping_malls')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setError(null);
      await fetchMalls();
    } catch (err) {
      setError('Error deleting shopping center');
      console.error('Error deleting mall:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && malls.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#FF4B4B" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId ? 'Edit Shopping Center' : 'Add New Shopping Center'}
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Name"
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
          rules={{ required: 'Address is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="Address"
                value={value}
                onChangeText={onChange}
              />
              {errors.address && (
                <Text style={styles.errorMessage}>{errors.address.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
            />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="latitude"
            rules={{
              required: 'Latitude is required',
              pattern: {
                value: /^-?([0-8]?[0-9]|90)(\.[0-9]+)?$/,
                message: 'Invalid latitude (-90 to 90)',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <TextInput
                  style={[styles.input, errors.latitude && styles.inputError]}
                  placeholder="Latitude"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
                {errors.latitude && (
                  <Text style={styles.errorMessage}>{errors.latitude.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="longitude"
            rules={{
              required: 'Longitude is required',
              pattern: {
                value: /^-?([0-9]?[0-9]|1[0-7][0-9]|180)(\.[0-9]+)?$/,
                message: 'Invalid longitude (-180 to 180)',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <TextInput
                  style={[styles.input, errors.longitude && styles.inputError]}
                  placeholder="Longitude"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
                {errors.longitude && (
                  <Text style={styles.errorMessage}>{errors.longitude.message}</Text>
                )}
              </View>
            )}
          />
        </View>

        <Controller
          control={control}
          name="image"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Image URL"
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {editingId ? 'Update' : 'Add'} Shopping Center
              </Text>
            )}
          </Pressable>

          {editingId && (
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                reset(defaultFormValues);
                setEditingId(null);
              }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Shopping Centers</Text>
        {malls.map((mall) => (
          <View key={mall.id} style={styles.mallCard}>
            <View style={styles.mallInfo}>
              <Text style={styles.mallName}>{mall.name}</Text>
              <Text style={styles.mallAddress}>{mall.address}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={() => editMall(mall)}>
                <Edit2 size={20} color="#666666" />
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteMall(mall.id)}>
                <Trash2 size={20} color="#FF4B4B" />
              </Pressable>
            </View>
          </View>
        ))}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  listContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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