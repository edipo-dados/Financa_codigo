/**
 * Biblioteca de funções para gerenciamento de cartão de crédito
 * Inclui cálculos de parcelas, datas de fatura e validações
 */

import { addMonths, parseISO, format, isAfter, isBefore } from 'date-fns'

export interface CreditCard {
  id: string
  user_id: string
  name: string
  closing_day: number
  due_day: number
  credit_limit: number | null
  color: string
  created_at: string
  updated_at: string
}

export interface InstallmentData {
  amount: number
  expense_date: string
  installment_number: number
  description: string
}

export interface CreditCardPurchase {
  totalAmount: number
  installments: number
  purchaseDate: string
  closingDay: number
}

export interface CreditCardValidation {
  valid: boolean
  error?: string
}

/**
 * Calcula o valor de cada parcela
 * Ajusta a última parcela para compensar arredondamentos
 */
export function calculateInstallmentAmount(totalAmount: number, installments: number): number[] {
  const baseAmount = Math.floor((totalAmount * 100) / installments) / 100
  const amounts = Array(installments).fill(baseAmount)
  
  // Calcular diferença devido ao arredondamento
  const totalCalculated = baseAmount * installments
  const difference = Math.round((totalAmount - totalCalculated) * 100) / 100
  
  // Ajustar última parcela
  amounts[installments - 1] = Math.round((baseAmount + difference) * 100) / 100
  
  return amounts
}

/**
 * Calcula a data da primeira fatura baseado na data de compra e dia de fechamento
 * Regra CORRETA: Compras até o fechamento vão para a fatura do MESMO MÊS
 */
export function calculateFirstInvoiceDate(purchaseDate: string, closingDay: number, dueDay?: number): Date {
  const purchase = parseISO(purchaseDate)
  const purchaseDay = purchase.getDate()
  const purchaseMonth = purchase.getMonth()
  const purchaseYear = purchase.getFullYear()
  
  if (purchaseDay <= closingDay) {
    // Compra até fechamento → FATURA DO MESMO MÊS
    if (dueDay && dueDay < closingDay) {
      // Se vencimento é antes do fechamento, vai para o mês seguinte
      return new Date(purchaseYear, purchaseMonth + 1, dueDay)
    } else {
      // Vencimento no mesmo mês ou depois do fechamento
      return new Date(purchaseYear, purchaseMonth, dueDay || closingDay)
    }
  } else {
    // Compra depois do fechamento → FATURA DO MÊS SEGUINTE
    if (dueDay && dueDay < closingDay) {
      // Se vencimento é antes do fechamento, vai para 2 meses depois
      return new Date(purchaseYear, purchaseMonth + 2, dueDay)
    } else {
      // Vencimento no mês seguinte
      return new Date(purchaseYear, purchaseMonth + 1, dueDay || closingDay)
    }
  }
}

/**
 * Gera os dados de todas as parcelas
 */
export function createInstallmentsData(
  totalAmount: number,
  installments: number,
  purchaseDate: string,
  closingDay: number,
  description: string,
  dueDay?: number
): InstallmentData[] {
  const amounts = calculateInstallmentAmount(totalAmount, installments)
  const firstInvoiceDate = calculateFirstInvoiceDate(purchaseDate, closingDay, dueDay)
  
  return amounts.map((amount, index) => {
    const invoiceDate = addMonths(firstInvoiceDate, index)
    
    return {
      amount,
      expense_date: format(invoiceDate, 'yyyy-MM-dd'),
      installment_number: index + 1,
      description: `${description} - Parcela ${index + 1}/${installments}`,
    }
  })
}

/**
 * Valida uma compra no cartão de crédito
 */
export function validateCreditCardPurchase(purchase: CreditCardPurchase): CreditCardValidation {
  if (purchase.totalAmount <= 0) {
    return { valid: false, error: 'O valor total deve ser maior que zero' }
  }
  
  if (purchase.installments < 1 || purchase.installments > 48) {
    return { valid: false, error: 'O número de parcelas deve estar entre 1 e 48' }
  }
  
  if (purchase.closingDay < 1 || purchase.closingDay > 31) {
    return { valid: false, error: 'O dia de fechamento deve estar entre 1 e 31' }
  }
  
  const purchaseDate = parseISO(purchase.purchaseDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (isAfter(purchaseDate, addMonths(today, 1))) {
    return { valid: false, error: 'A data da compra não pode ser mais de 1 mês no futuro' }
  }
  
  return { valid: true }
}

/**
 * Calcula o total de despesas no cartão para um período
 */
export function calculateCreditCardTotal(
  expenses: any[],
  startDate: string,
  endDate: string
): { total: number; installments: number; singlePurchases: number } {
  const creditCardExpenses = expenses.filter(
    (e) =>
      e.is_credit_card &&
      e.is_installment && // Apenas parcelas (não a compra parent)
      e.expense_date >= startDate &&
      e.expense_date <= endDate
  )
  
  console.log('💳 calculateCreditCardTotal:', {
    totalExpenses: expenses.length,
    creditCardExpenses: creditCardExpenses.length,
    startDate,
    endDate,
    creditCardExpensesList: creditCardExpenses.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      expense_date: e.expense_date,
      installment_number: e.installment_number,
      card_name: e.credit_card?.name
    }))
  })
  
  const total = creditCardExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const installments = creditCardExpenses.filter((e) => e.installments > 1).length
  const singlePurchases = creditCardExpenses.filter((e) => e.installments === 1).length
  
  return { total, installments, singlePurchases }
}

/**
 * Agrupa despesas de cartão por cartão
 */
export function groupByCreditCard(expenses: any[]): Array<{
  cardId: string
  cardName: string
  cardColor: string
  total: number
  count: number
}> {
  const creditCardExpenses = expenses.filter((e) => e.is_credit_card && e.is_installment)
  
  const grouped = creditCardExpenses.reduce((acc, expense) => {
    const cardId = expense.credit_card_id
    if (!cardId) return acc
    
    if (!acc[cardId]) {
      acc[cardId] = {
        cardId,
        cardName: expense.credit_card?.name || 'Cartão',
        cardColor: expense.credit_card?.color || '#007aff',
        total: 0,
        count: 0,
      }
    }
    
    acc[cardId].total += Number(expense.amount)
    acc[cardId].count += 1
    
    return acc
  }, {} as Record<string, any>)
  
  return Object.values(grouped)
}

/**
 * Calcula o limite disponível de um cartão
 */
export function calculateAvailableLimit(
  creditLimit: number | null,
  currentMonthExpenses: number
): number | null {
  if (creditLimit === null) return null
  return Math.max(0, creditLimit - currentMonthExpenses)
}

/**
 * Recalcula as datas de todas as parcelas de uma compra existente
 */
export function recalculateInstallmentDates(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
  totalInstallments: number
): string[] {
  const firstInvoiceDate = calculateFirstInvoiceDate(purchaseDate, closingDay, dueDay)
  const dates: string[] = []
  
  for (let i = 0; i < totalInstallments; i++) {
    const installmentDate = addMonths(firstInvoiceDate, i)
    dates.push(format(installmentDate, 'yyyy-MM-dd'))
  }
  
  return dates
}

/**
 * Formata informações de parcela para exibição
 */
export function formatInstallmentInfo(
  installmentNumber: number,
  totalInstallments: number,
  amount: number
): string {
  return `Parcela ${installmentNumber}/${totalInstallments} - R$ ${amount.toFixed(2)}`
}

/**
 * Recalcula todas as compras de cartão de crédito existentes com a lógica corrigida
 * Usado para corrigir compras criadas antes da correção da lógica
 */
export async function recalculateAllCreditCardPurchases(supabase: any, userId: string) {
  console.log('🔄 Iniciando recálculo de todas as compras de cartão...')
  
  try {
    // 1. Buscar todas as compras parent (não são parcelas)
    const { data: parentPurchases, error: parentError } = await supabase
      .from('expenses')
      .select(`
        *,
        credit_card:credit_cards(*)
      `)
      .eq('user_id', userId)
      .eq('is_credit_card', true)
      .eq('is_installment', false)
      .is('parent_expense_id', null)

    if (parentError) {
      console.error('Erro ao buscar compras parent:', parentError)
      return { success: false, error: parentError.message }
    }

    if (!parentPurchases || parentPurchases.length === 0) {
      console.log('Nenhuma compra de cartão encontrada para recalcular')
      return { success: true, message: 'Nenhuma compra encontrada' }
    }

    console.log(`📋 Encontradas ${parentPurchases.length} compras para recalcular`)

    let recalculatedCount = 0
    let errorCount = 0

    // 2. Para cada compra parent, recalcular as parcelas
    for (const purchase of parentPurchases) {
      try {
        console.log(`🔄 Recalculando compra: ${purchase.description} (${purchase.id})`)
        
        if (!purchase.credit_card) {
          console.warn(`⚠️ Cartão não encontrado para compra ${purchase.id}`)
          errorCount++
          continue
        }

        // 3. Buscar todas as parcelas desta compra
        const { data: installments, error: installmentsError } = await supabase
          .from('expenses')
          .select('*')
          .eq('parent_expense_id', purchase.id)
          .eq('is_installment', true)
          .order('installment_number', { ascending: true })

        if (installmentsError) {
          console.error(`Erro ao buscar parcelas da compra ${purchase.id}:`, installmentsError)
          errorCount++
          continue
        }

        if (!installments || installments.length === 0) {
          console.warn(`⚠️ Nenhuma parcela encontrada para compra ${purchase.id}`)
          errorCount++
          continue
        }

        // 4. Recalcular datas das parcelas com a lógica corrigida
        const newDates = recalculateInstallmentDates(
          purchase.purchase_date,
          purchase.credit_card.closing_day,
          purchase.credit_card.due_day,
          installments.length
        )

        console.log(`📅 Novas datas calculadas:`, newDates)

        // 5. Atualizar cada parcela com a nova data
        for (let i = 0; i < installments.length; i++) {
          const installment = installments[i]
          const newDate = newDates[i]
          
          if (installment.expense_date !== newDate) {
            console.log(`📝 Atualizando parcela ${installment.installment_number}: ${installment.expense_date} → ${newDate}`)
            
            const { error: updateError } = await supabase
              .from('expenses')
              .update({ expense_date: newDate })
              .eq('id', installment.id)

            if (updateError) {
              console.error(`Erro ao atualizar parcela ${installment.id}:`, updateError)
              errorCount++
            }
          } else {
            console.log(`✅ Parcela ${installment.installment_number} já está com data correta`)
          }
        }

        recalculatedCount++
        console.log(`✅ Compra ${purchase.description} recalculada com sucesso`)

      } catch (error) {
        console.error(`Erro ao processar compra ${purchase.id}:`, error)
        errorCount++
      }
    }

    console.log(`🎉 Recálculo concluído: ${recalculatedCount} compras processadas, ${errorCount} erros`)

    return {
      success: true,
      message: `Recálculo concluído: ${recalculatedCount} compras processadas${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
      recalculatedCount,
      errorCount
    }

  } catch (error) {
    console.error('Erro geral no recálculo:', error)
    return { success: false, error: 'Erro interno no recálculo' }
  }
}
