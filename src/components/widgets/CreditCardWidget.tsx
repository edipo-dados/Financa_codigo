'use client'

import { useMemo } from 'react'
import { Expense } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { calculateCreditCardTotal, groupByCreditCard } from '@/lib/creditCard'

interface Props {
  expenses: Expense[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function CreditCardWidget({ expenses, loading, startDate, endDate }: Props) {
  const creditCardData = useMemo(() => {
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    // Calcular estatísticas de cartão de crédito
    const creditCardStats = calculateCreditCardTotal(expenses, start, end)
    const creditCardByCard = groupByCreditCard(expenses.filter(e => 
      e.expense_date >= start && e.expense_date <= end
    ))

    return {
      creditCardStats,
      creditCardByCard,
    }
  }, [expenses, startDate, endDate])

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
          <p className="fintech-text-muted">Nenhuma compra no cartão este mês</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold fintech-text-primary">💳 Fatura do Cartão</h3>
          <p className="text-sm fintech-text-muted mt-1">
            {creditCardData.creditCardStats.installments} parcelas no período
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