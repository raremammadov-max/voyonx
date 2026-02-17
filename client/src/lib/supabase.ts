// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Берём URL и anon key из переменных окружения (Replit Secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверяем, что переменные заданы
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Replit Secrets.')
}

// Создаём клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
