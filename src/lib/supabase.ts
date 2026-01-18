import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Verificar se as variáveis estão configuradas
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key'

if (!isConfigured) {
  console.warn('⚠️  Supabase não configurado. Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local')
}

// Criar cliente com configurações que evitam erros de rede no modo demo
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isConfigured,
    autoRefreshToken: isConfigured,
    detectSessionInUrl: isConfigured,
  },
  global: {
    headers: isConfigured ? {} : { 'X-Demo-Mode': 'true' }
  }
})

// Exportar flag para verificação rápida
export const isSupabaseConfigured = isConfigured
