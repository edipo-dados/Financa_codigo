import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// Simulação de usuário para modo demo
const createMockUser = (email: string): User => ({
  id: 'demo-user-id',
  email,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { full_name: 'Usuário Demo' },
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: undefined,
  confirmation_sent_at: undefined,
  confirmed_at: new Date().toISOString(),
  recovery_sent_at: undefined,
  last_sign_in_at: new Date().toISOString(),
  identities: [],
  factors: [],
})

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Modo demo - verificar se há usuário salvo no localStorage
      const savedUser = localStorage.getItem('demo-user')
      
      setTimeout(() => {
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            setUser(userData)
          } catch (error) {
            console.error('Erro ao carregar usuário salvo:', error)
            localStorage.removeItem('demo-user')
          }
        }
        setLoading(false)
      }, 300)
      return
    }

    // Supabase configurado - usar autenticação real
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao obter sessão:', error)
        setLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Modo demo - simular login
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (email === 'demo@demo.com' && password === '123456') {
        const mockUser = createMockUser(email)
        setUser(mockUser)
        localStorage.setItem('demo-user', JSON.stringify(mockUser))
        return { error: null }
      } else {
        return { 
          error: { 
            message: 'Credenciais inválidas. Use demo@demo.com / 123456 para testar no modo demo' 
          } 
        }
      }
    }

    // Supabase configurado - autenticação real
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      console.error('Erro no login:', error)
      return { error: { message: 'Erro de conexão. Tente novamente.' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      // Modo demo - simular cadastro
      await new Promise(resolve => setTimeout(resolve, 500))
      return { 
        error: { 
          message: 'Cadastro não disponível no modo demo. Configure o Supabase para usar cadastro real.' 
        } 
      }
    }

    // Supabase configurado - cadastro real
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      return { error: { message: 'Erro de conexão. Tente novamente.' } }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      // Modo demo - simular logout
      await new Promise(resolve => setTimeout(resolve, 200))
      setUser(null)
      localStorage.removeItem('demo-user')
      return { error: null }
    }

    // Supabase configurado - logout real
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Erro no logout:', error)
      return { error: { message: 'Erro de conexão. Tente novamente.' } }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
