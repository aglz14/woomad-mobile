import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CircleAlert as AlertCircle, ArrowLeft } from 'lucide-react-native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  async function handleSignUp() {
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select()
          .eq('id', signUpData.user.id)
          .single();

        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              full_name: fullName,
              email: email,
            });

          if (profileError) throw profileError;
        }

        // Create user preferences with default values
        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: signUpData.user.id,
            notifications_enabled: false,
            notification_radius: 4,
          });

        if (preferencesError) throw preferencesError;

        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ref={scrollViewRef}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.push('/(tabs)')}
      >
        <ArrowLeft size={24} color="#1a1a1a" />
      </Pressable>

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para acceder a todas las funciones
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#FF4B4B" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 100, animated: true });
                }
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 150, animated: true });
                }
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 200, animated: true });
                }
              }}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <Link href="/auth/login" style={styles.link}>
              Inicia sesión
            </Link>
          </View>

          <Pressable
            style={styles.homeLink}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.homeLinkText}>
              Volver a la página principal
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF4B4B',
    marginLeft: 8,
    fontSize: 14,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  link: {
    color: '#FF4B4B',
    fontSize: 14,
  },
  homeLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  homeLinkText: {
    color: '#FF4B4B',
    fontSize: 14,
  },
});
