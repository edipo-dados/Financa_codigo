import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest, authorizeUser } from '@/lib/apiAuth'

// Função para inicializar cliente Supabase com service role para bypass RLS
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * GET /api/expenses
 * Buscar todas as despesas de um usuário
 * Query params:
 * - user_id: ID do usuário (obrigatório)
 * - start_date: Data inicial (opcional, formato: YYYY-MM-DD)
 * - end_date: Data final (opcional, formato: YYYY-MM-DD)
 * - is_paid: Filtrar por status de pagamento (opcional, true/false)
 * 
 * Headers:
 * - Authorization: Bearer <token> (obrigatório)
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar requisição
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const supabase = getSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const isPaid = searchParams.get('is_paid')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Autorizar acesso aos dados
    const authz = authorizeUser(auth.userId!, userId)
    if (!authz.authorized) {
      return NextResponse.json(
        { error: authz.error },
        { status: authz.status }
      )
    }

    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(*),
        credit_card:credit_cards(*),
        member:family_members(*)
      `)
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })

    // Aplicar filtros opcionais
    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }
    if (isPaid !== null) {
      query = query.eq('is_paid', isPaid === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/expenses
 * Criar nova despesa
 * 
 * Headers:
 * - Authorization: Bearer <token> (obrigatório)
 * 
 * Body: {
 *   user_id: string (obrigatório)
 *   amount: number (obrigatório)
 *   description: string (obrigatório)
 *   expense_date: string (obrigatório, formato: YYYY-MM-DD)
 *   category_id?: string
 *   member_id?: string
 *   payment_method?: string
 *   is_paid?: boolean
 *   is_recurring?: boolean
 *   recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
 *   recurrence_start_date?: string
 *   recurrence_end_type?: 'never' | 'after_occurrences' | 'on_date'
 *   recurrence_count?: number
 *   recurrence_end_date?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar requisição
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const supabase = getSupabaseClient()
    const body = await request.json()

    // Validações básicas
    if (!body.user_id || !body.amount || !body.description || !body.expense_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, amount, description, expense_date' },
        { status: 400 }
      )
    }

    // Autorizar acesso aos dados
    const authz = authorizeUser(auth.userId!, body.user_id)
    if (!authz.authorized) {
      return NextResponse.json(
        { error: authz.error },
        { status: authz.status }
      )
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
