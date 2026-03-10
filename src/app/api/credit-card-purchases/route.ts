import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInstallmentsData } from '@/lib/creditCard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/credit-card-purchases
 * Lista todas as compras de cartão de crédito (apenas parents, não parcelas)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const creditCardId = searchParams.get('credit_card_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        credit_card:credit_cards(*),
        member:family_members(*)
      `)
      .eq('user_id', userId)
      .eq('is_credit_card', true)
      .eq('is_installment', false)
      .is('parent_expense_id', null)
      .order('purchase_date', { ascending: false })

    if (creditCardId) {
      query = query.eq('credit_card_id', creditCardId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/credit-card-purchases
 * Cria uma nova compra de cartão de crédito com parcelas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      credit_card_id,
      category_id,
      member_id,
      description,
      total_amount,
      installments,
      purchase_date,
    } = body

    // Validações
    if (!user_id || !credit_card_id || !description || !total_amount || !installments || !purchase_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, credit_card_id, description, total_amount, installments, purchase_date' },
        { status: 400 }
      )
    }

    if (installments < 1 || installments > 48) {
      return NextResponse.json(
        { error: 'O número de parcelas deve estar entre 1 e 48' },
        { status: 400 }
      )
    }

    if (total_amount <= 0) {
      return NextResponse.json(
        { error: 'O valor total deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Buscar informações do cartão
    const { data: creditCard, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', credit_card_id)
      .eq('user_id', user_id)
      .single()

    if (cardError || !creditCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      )
    }

    // Criar a compra parent
    const { data: parentExpense, error: parentError } = await supabase
      .from('expenses')
      .insert({
        user_id,
        credit_card_id,
        category_id: category_id || null,
        member_id: member_id || null,
        description,
        amount: total_amount / installments, // Valor da primeira parcela
        total_amount,
        installments,
        purchase_date,
        expense_date: purchase_date,
        is_credit_card: true,
        is_installment: false,
        is_paid: false,
        is_recurring: false,
      })
      .select()
      .single()

    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 })
    }

    // Gerar dados das parcelas
    const installmentsData = createInstallmentsData(
      total_amount,
      installments,
      purchase_date,
      creditCard.closing_day,
      description,
      creditCard.due_day
    )

    // Criar as parcelas
    const installmentRecords = installmentsData.map((inst) => ({
      user_id,
      credit_card_id,
      category_id: category_id || null,
      member_id: member_id || null,
      description: inst.description,
      amount: inst.amount,
      expense_date: inst.expense_date,
      purchase_date,
      installment_number: inst.installment_number,
      installments,
      total_amount,
      is_credit_card: true,
      is_installment: true,
      is_paid: false,
      is_recurring: false,
      parent_expense_id: parentExpense.id,
    }))

    const { data: createdInstallments, error: installmentsError } = await supabase
      .from('expenses')
      .insert(installmentRecords)
      .select()

    if (installmentsError) {
      // Se falhar ao criar parcelas, excluir a compra parent
      await supabase.from('expenses').delete().eq('id', parentExpense.id)
      return NextResponse.json({ error: installmentsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        parent: parentExpense,
        installments: createdInstallments,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
