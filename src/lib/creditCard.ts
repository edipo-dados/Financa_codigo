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
 */
export function calculateFirstInvoiceDate(purchaseDate: string, closingDay: number): Date {
  const purchase = parseISO(purchaseDate)
  const purchaseDay = purchase.getDate()
  
  // Se a compra foi antes do fechamento, entra na fatura do mês atual
  // Se foi depois, entra na fatura do próximo mês
  if (purchaseDay <= closingDay) {
    // Fatura do mês atual
    return new Date(purchase.getFullYear(), purchase.getMonth(), closingDay)
  } else {
    // Fatura do próximo mês
    return addMonths(new Date(purchase.getFullYear(), purchase.getMonth(), closingDay), 1)
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
  description: string
): InstallmentData[] {
  const amounts = calculateInstallmentAmount(totalAmount, installments)
  const firstInvoiceDate = calculateFirstInvoiceDate(purchaseDate, closingDay)
  
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
 * Formata informações de parcela para exibição
 */
export function formatInstallmentInfo(
  installmentNumber: number,
  totalInstallments: number,
  amount: number
): string {
  return `Parcela ${installmentNumber}/${totalInstallments} - R$ ${amount.toFixed(2)}`
}
