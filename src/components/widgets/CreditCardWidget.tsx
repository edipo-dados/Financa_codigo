'use client'

import { useMemo, useState } from 'react'
import { Expense } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { recalculateAllCreditCardPurchases } from '@/lib/creditCard'
import { supabase } from '@/lib/supabase'

interface Props {
  expenses: Expense[]
  loading: boolean
  startDate?: string
  endDate?: string
  userId?: string
  onRefresh?: () => void
}

export default function CreditCardWidget({ expenses, loading, startDate, endDate, userId, onRefresh }: Props) {
  const [recalculating, setRecalculating] = useState(false)
  const creditCardData = useMemo(() => {
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    console.log('💳 CreditCardWidget - Período:', { start, end })
    
    // Usar a mesma lógica da aba de despesas: filtrar parcelas por expense_date
    const creditCardExpenses = expenses.filter(e => 
      e.is_credit_card && 
      e.is_installment && // Apenas parcelas
      e.expense_date >= start &&
      e.expense_date <= end
    )
    
    console.log('💳 CreditCardWidget - Parcelas no período:', {
      totalExpenses: expenses.length,
      creditCardExpenses: creditCardExpenses.length,
      parcelas: creditCardExpenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        expense_date: e.expense_date,
        installment_number: e.installment_number,
        card_name: e.credit_card?.name
      }))
    })
    
    // Calcular total das parcelas
    const total = creditCardExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    
    // Agrupar por cartão para exibição
    const cardTotals = new Map<string, {
      cardId: string
      cardName: string
      cardColor: string
      total: number
      count: number
    }>()
    
    creditCardExpenses.forEach(expense => {
      if (!expense.credit_card) return
      
      const cardId = expense.credit_card.id
      
      if (!cardTotals.has(cardId)) {
        cardTotals.set(cardId, {
          cardId,
          cardName: expense.credit_card.name,
          cardColor: expense.credit_card.color,
          total: 0,
          count: 0
        })
      }
      
      const cardData = cardTotals.get(cardId)!
      cardData.total += Number(expense.amount)
      cardData.count += 1
    })
    
    const creditCardByCard = Array.from(cardTotals.values())

    return {
      creditCardStats: { 
        total, 
        installments: creditCardExpenses.length, 
        singlePurchases: 0 
      },
      creditCardByCard,
    }
  }, [expenses, startDate, endDate])

  const handleRecalculateAll = async () => {
    if (!userId) {
      alert('❌ Erro: ID do usuário não disponível')
      return
    }

    if (!confirm('Recalcular todas as datas de parcelas de cartão? Esta ação corrige datas incorretas de compras antigas.')) {
      return
    }

    setRecalculating(true)
    
    try {
      const result = await recalculateAllCreditCardPurchases(supabase, userId)
      
      if (result.success) {
        alert(`✅ ${result.message}`)
        if (onRefresh) onRefresh()
      } else {
        alert(`❌ Erro no recálculo: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao recalcular:', error)
      alert('❌ Erro interno ao recalcular compras')
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (creditCardData.creditCardStats.total === 0) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <h3 className="text-lg font-semibold fintech-text-primary mb-4">💳 Fatura do Cartão</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">💳</span>
          <p className="fintech-text-muted">Nenhuma parcela no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold fintech-text-primary">💳 Cartão de Crédito</h3>
          <p className="text-sm fintech-text-muted mt-1">
            Parcelas que vencem no período ({creditCardData.creditCardStats.installments} parcelas)
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(creditCardData.creditCardStats.total)}
          </p>
        </div>
      </div>
      
      {creditCardData.creditCardByCard.length > 0 && (
        <div className="space-y-2 pt-4 border-t fintech-border">
          <p className="text-sm font-medium fintech-text-secondary mb-3">Detalhamento por Cartão:</p>
          {creditCardData.creditCardByCard.map((card) => (
            <div key={card.cardId} className="flex items-center justify-between p-3 bg-white/50 dark:bg-fintech-dark-surface/50 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: card.cardColor }}
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium fintech-text-primary">
                    {card.cardName}
                  </span>
                  <div className="text-xs fintech-text-muted">
                    ({card.count} {card.count === 1 ? 'parcela' : 'parcelas'})
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">
                {formatCurrency(card.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}