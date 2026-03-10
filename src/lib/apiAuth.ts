import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware de autenticação para APIs
 * Valida o token JWT do Supabase enviado no header Authorization
 */
export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Token de autenticação não fornecido',
      status: 401
    }
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Criar cliente Supabase para validar o token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Validar o token e obter o usuário
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        error: 'Token inválido ou expirado',
        status: 401
      }
    }

    return {
      authenticated: true,
      user,
      userId: user.id
    }
  } catch (error: any) {
    return {
      authenticated: false,
      error: 'Erro ao validar token',
      status: 500
    }
  }
}

/**
 * Verifica se o usuário autenticado tem permissão para acessar os dados
 */
export function authorizeUser(authenticatedUserId: string, requestedUserId: string) {
  if (authenticatedUserId !== requestedUserId) {
    return {
      authorized: false,
      error: 'Você não tem permissão para acessar estes dados',
      status: 403
    }
  }

  return {
    authorized: true
  }
}
