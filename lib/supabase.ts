import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Ensure environment variables are available
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_URL');
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);