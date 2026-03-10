import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/credit-card-purchases/[id]
 * Busca uma compra de cartão específica com suas parcelas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar a compra parent
    const { data: purchase, error: purchaseError } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        credit_card:credit_cards(*),
        member:family_members(*)
      `)
      .eq('id', id)
      .eq('is_credit_card', true)
      .eq('is_installment', false)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Compra não encontrada' },
        { status: 404 }
      )
    }

    // Buscar as parcelas
    const { data: installments, error: installmentsError } = await supabase
      .from('expenses')
      .select('*')
      .eq('parent_expense_id', id)
      .eq('is_installment', true)
      .order('installment_number', { ascending: true })

    if (installmentsError) {
      return NextResponse.json({ error: installmentsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        installments_detail: installments,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/credit-card-purchases/[id]
 * Exclui uma compra de cartão e todas as suas parcelas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se a compra existe
    const { data: purchase, error: purchaseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('is_credit_card', true)
      .eq('is_installment', false)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Compra não encontrada' },
        { status: 404 }
      )
    }

    // Excluir todas as parcelas
    const { error: installmentsError } = await supabase
      .from('expenses')
      .delete()
      .eq('parent_expense_id', id)

    if (installmentsError) {
      return NextResponse.json({ error: installmentsError.message }, { status: 500 })
    }

    // Excluir a compra parent
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Compra e parcelas excluídas com sucesso',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
