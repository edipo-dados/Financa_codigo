import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * GET /api/summary
 * Buscar resumo financeiro de um usuário
 * Query params:
 * - user_id: ID do usuário (obrigatório)
 * - start_date: Data inicial (opcional, formato: YYYY-MM-DD)
 * - end_date: Data final (opcional, formato: YYYY-MM-DD)
 * 
 * Retorna:
 * - Total de receitas (pagas e a receber)
 * - Total de despesas (pagas e a pagar)
 * - Saldo (receitas - despesas)
 * - Contadores de transações
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar receitas
    let incomesQuery = supabase
      .from('incomes')
      .select('amount, is_paid')
      .eq('user_id', userId)

    if (startDate) incomesQuery = incomesQuery.gte('income_date', startDate)
    if (endDate) incomesQuery = incomesQuery.lte('income_date', endDate)

    const { data: incomes, error: incomesError } = await incomesQuery

    if (incomesError) {
      return NextResponse.json(
        { error: incomesError.message },
        { status: 500 }
      )
    }

    // Buscar despesas
    let expensesQuery = supabase
      .from('expenses')
      .select('amount, is_paid')
      .eq('user_id', userId)

    if (startDate) expensesQuery = expensesQuery.gte('expense_date', startDate)
    if (endDate) expensesQuery = expensesQuery.lte('expense_date', endDate)

    const { data: expenses, error: expensesError } = await expensesQuery

    if (expensesError) {
      return NextResponse.json(
        { error: expensesError.message },
        { status: 500 }
      )
    }

    // Calcular totais
    const totalIncomes = incomes?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const paidIncomes = incomes?.filter(i => i.is_paid).reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const unpaidIncomes = incomes?.filter(i => !i.is_paid).reduce((sum, i) => sum + Number(i.amount), 0) || 0

    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const paidExpenses = expenses?.filter(e => e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const unpaidExpenses = expenses?.filter(e => !e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0) || 0

    const balance = totalIncomes - totalExpenses
    const realBalance = paidIncomes - paidExpenses
    const projectedBalance = unpaidIncomes - unpaidExpenses

    return NextResponse.json({
      success: true,
      period: {
        start_date: startDate || 'all',
        end_date: endDate || 'all'
      },
      incomes: {
        total: totalIncomes,
        paid: paidIncomes,
        unpaid: unpaidIncomes,
        count: incomes?.length || 0
      },
      expenses: {
        total: totalExpenses,
        paid: paidExpenses,
        unpaid: unpaidExpenses,
        count: expenses?.length || 0
      },
      balance: {
        total: balance,
        real: realBalance,
        projected: projectedBalance
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
