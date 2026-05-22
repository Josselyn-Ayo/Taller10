// src/shared/infrastructure/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase espera métodos getItem/setItem/removeItem, pero expo-secure-store
// expone getItemAsync/setItemAsync/deleteItemAsync – este adaptador los mapea.
const SecureStoreAdapter = {
  getItem: (key: string) =>
    SecureStore.getItemAsync(key),

  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),

  removeItem: (key: string) =>
    SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter, // tokens guardados en almacenamiento encriptado del dispositivo
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);