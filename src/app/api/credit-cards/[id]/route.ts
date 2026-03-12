import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/credit-cards/[id]
 * Busca um cartão específico com detalhes da fatura
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Formato: YYYY-MM

    // Buscar o cartão
    const { data: creditCard, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (cardError || !creditCard) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      )
    }

    // Buscar parcelas do cartão
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        member:family_members(*)
      `)
      .eq('credit_card_id', id)
      .eq('is_credit_card', true)
      .eq('is_installment', true)
      .order('expense_date', { ascending: true })

    // Se um mês específico foi fornecido, filtrar por ele
    if (month) {
      const [year, monthNum] = month.split('-')
      const startDate = `${year}-${monthNum}-01`
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
      query = query.gte('expense_date', startDate).lte('expense_date', endDate)
    }

    const { data: installments, error: installmentsError } = await query

    if (installmentsError) {
      return NextResponse.json({ error: installmentsError.message }, { status: 500 })
    }

    // Calcular totais
    const total = installments.reduce((sum, inst) => sum + parseFloat(inst.amount.toString()), 0)
    const paid = installments
      .filter((inst) => inst.is_paid)
      .reduce((sum, inst) => sum + parseFloat(inst.amount.toString()), 0)
    const unpaid = total - paid

    // Agrupar por compra parent
    const purchasesMap = new Map()
    
    for (const inst of installments) {
      if (inst.parent_expense_id) {
        if (!purchasesMap.has(inst.parent_expense_id)) {
          purchasesMap.set(inst.parent_expense_id, {
            parent_id: inst.parent_expense_id,
            description: inst.description.replace(/ - Parcela \d+\/\d+$/, ''),
            total_amount: inst.total_amount,
            installments_count: inst.installments,
            purchase_date: inst.purchase_date,
            installments: [],
          })
        }
        purchasesMap.get(inst.parent_expense_id).installments.push(inst)
      }
    }

    const purchases = Array.from(purchasesMap.values())

    return NextResponse.json({
      success: true,
      data: {
        card: creditCard,
        invoice: {
          total: parseFloat(total.toFixed(2)),
          paid: parseFloat(paid.toFixed(2)),
          unpaid: parseFloat(unpaid.toFixed(2)),
          count: installments.length,
          month: month || 'all',
        },
        purchases,
        installments,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/credit-cards/[id]
 * Atualiza um cartão de crédito
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validações opcionais
    if (body.closing_day && (body.closing_day < 1 || body.closing_day > 31)) {
      return NextResponse.json(
        { error: 'O dia de fechamento deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    if (body.due_day && (body.due_day < 1 || body.due_day > 31)) {
      return NextResponse.json(
        { error: 'O dia de vencimento deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    const { data: creditCard, error: updateError } = await supabase
      .from('credit_cards')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: creditCard,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/credit-cards/[id]
 * Exclui um cartão de crédito
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se existem compras vinculadas
    const { data: purchases, error: purchasesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('credit_card_id', id)
      .limit(1)

    if (purchasesError) {
      return NextResponse.json({ error: purchasesError.message }, { status: 500 })
    }

    if (purchases && purchases.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um cartão com compras vinculadas' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cartão excluído com sucesso',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
