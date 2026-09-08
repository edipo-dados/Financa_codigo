import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInstallmentsData } from '@/lib/creditCard'

/**
 * POST /api/import-invoice/confirm
 * Grava os lançamentos confirmados da fatura.
 * Só cria itens do tipo "nova_avista" e "nova_parcelada".
 * Itens "parcela_existente" e "divergencia" são ignorados na gravação.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    const { userId, creditCardId, memberId, items } = body

    if (!userId || !creditCardId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, creditCardId, items' },
        { status: 400 }
      )
    }

    // Buscar dados do cartão
    const { data: card, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', creditCardId)
      .eq('user_id', userId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    let createdCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const item of items) {
      // Só grava itens novos (à vista ou parcelada nova)
      if (item.classification !== 'nova_avista' && item.classification !== 'nova_parcelada') {
        skippedCount++
        continue
      }

      try {
        const installments = item.classification === 'nova_parcelada' ? (item.installments || 1) : 1
        const totalAmount = Number(item.amount)
        const purchaseDate = item.purchase_date || today
        const categoryId = item.category_id || null

        // Criar compra parent
        const { data: parentExpense, error: parentError } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            credit_card_id: creditCardId,
            category_id: categoryId,
            member_id: memberId || null,
            description: item.description,
            amount: totalAmount / installments,
            total_amount: totalAmount,
            installments,
            purchase_date: purchaseDate,
            expense_date: purchaseDate,
            is_credit_card: true,
            is_installment: false,
            is_paid: false,
            is_recurring: false,
          })
          .select()
          .single()

        if (parentError) throw parentError

        // Gerar e criar parcelas (reaproveitando lógica existente)
        const installmentsData = createInstallmentsData(
          totalAmount,
          installments,
          purchaseDate,
          card.closing_day,
          item.description,
          card.due_day
        )

        const installmentRecords = installmentsData.map((inst) => ({
          user_id: userId,
          credit_card_id: creditCardId,
          category_id: categoryId,
          member_id: memberId || null,
          description: inst.description,
          amount: inst.amount,
          expense_date: inst.expense_date,
          purchase_date: purchaseDate,
          installment_number: inst.installment_number,
          installments,
          total_amount: totalAmount,
          is_credit_card: true,
          is_installment: true,
          is_paid: false,
          is_recurring: false,
          parent_expense_id: parentExpense.id,
        }))

        const { error: instError } = await supabase
          .from('expenses')
          .insert(installmentRecords)

        if (instError) {
          await supabase.from('expenses').delete().eq('id', parentExpense.id)
          throw instError
        }

        createdCount++
      } catch (err: any) {
        console.error(`Erro ao criar item "${item.description}":`, err)
        errors.push(`${item.description}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      errors,
      message: `${createdCount} lançamento(s) criado(s), ${skippedCount} ignorado(s) (já existentes/divergências)`
    })
  } catch (error: any) {
    console.error('Erro ao confirmar importação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
