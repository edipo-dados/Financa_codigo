import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/credit-cards
 * Lista todos os cartões de crédito do usuário com informações de fatura
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const month = searchParams.get('month') // Formato: YYYY-MM
    const includeInvoice = searchParams.get('include_invoice') !== 'false' // Default true
    const onlyWithInvoice = searchParams.get('only_with_invoice') === 'true' // Default false

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar todos os cartões do usuário
    const { data: creditCards, error: cardsError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }

    if (!includeInvoice) {
      return NextResponse.json({ success: true, data: creditCards })
    }

    // Para cada cartão, calcular informações da fatura
    const cardsWithInvoice = await Promise.all(
      creditCards.map(async (card) => {
        // Buscar todas as parcelas do cartão
        let query = supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .eq('credit_card_id', card.id)
          .eq('is_credit_card', true)
          .eq('is_installment', true)

        // Se um mês específico foi fornecido, filtrar por ele
        if (month) {
          const [year, monthNum] = month.split('-')
          const startDate = `${year}-${monthNum}-01`
          const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
          query = query.gte('expense_date', startDate).lte('expense_date', endDate)
        }

        const { data: installments, error: installmentsError } = await query

        if (installmentsError) {
          console.error('Erro ao buscar parcelas:', installmentsError)
          return {
            ...card,
            invoice: {
              total: 0,
              paid: 0,
              unpaid: 0,
              count: 0,
            },
          }
        }

        // Calcular totais
        const total = installments.reduce((sum, inst) => sum + parseFloat(inst.amount.toString()), 0)
        const paid = installments
          .filter((inst) => inst.is_paid)
          .reduce((sum, inst) => sum + parseFloat(inst.amount.toString()), 0)
        const unpaid = total - paid

        return {
          ...card,
          invoice: {
            total: parseFloat(total.toFixed(2)),
            paid: parseFloat(paid.toFixed(2)),
            unpaid: parseFloat(unpaid.toFixed(2)),
            count: installments.length,
            month: month || 'all',
          },
        }
      })
    )

    // Filtrar apenas cartões com fatura se solicitado
    const finalCards = onlyWithInvoice
      ? cardsWithInvoice.filter((card) => card.invoice.count > 0)
      : cardsWithInvoice

    return NextResponse.json({
      success: true,
      data: finalCards,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/credit-cards
 * Cria um novo cartão de crédito
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, closing_day, due_day, credit_limit, color } = body

    // Validações
    if (!user_id || !name || !closing_day || !due_day) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, name, closing_day, due_day' },
        { status: 400 }
      )
    }

    if (closing_day < 1 || closing_day > 31) {
      return NextResponse.json(
        { error: 'O dia de fechamento deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    if (due_day < 1 || due_day > 31) {
      return NextResponse.json(
        { error: 'O dia de vencimento deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    // Criar o cartão
    const { data: creditCard, error: cardError } = await supabase
      .from('credit_cards')
      .insert({
        user_id,
        name,
        closing_day,
        due_day,
        credit_limit: credit_limit || null,
        color: color || '#3b82f6',
      })
      .select()
      .single()

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: creditCard,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
