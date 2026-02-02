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
    
    // Widget mostra fatura do mês atual (considerando closing_day)
    const currentDate = new Date(start)
    const selectedInvoiceMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    // Função para calcular o mês de fechamento da fatura (da aba de cartões)
    const getInvoiceMonth = (purchase: any, cardClosingDay: number) => {
      if (!purchase.purchase_date) return null
      
      const purchaseDate = new Date(purchase.purchase_date)
      const purchaseDay = purchaseDate.getDate()
      
      // Se a compra foi antes do fechamento, entra na fatura do mês atual
      // Se foi depois, entra na fatura do próximo mês
      if (purchaseDay <= cardClosingDay) {
        return `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
      } else {
        const nextMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, 1)
        return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
      }
    }
    
    // Buscar compras parent de cartão
    const creditCardPurchases = expenses.filter(e => 
      e.is_credit_card && 
      !e.is_installment &&
      e.purchase_date &&
      e.credit_card
    )
    
    // Filtrar compras que fecham na fatura do mês atual
    const invoicePurchases = creditCardPurchases.filter(purchase => {
      const cardClosingDay = purchase.credit_card.closing_day
      const purchaseInvoiceMonth = getInvoiceMonth(purchase, cardClosingDay)
      return purchaseInvoiceMonth === selectedInvoiceMonth
    })
    
    // Calcular total das compras que fecham na fatura
    const total = invoicePurchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0)
    
    console.log('💳 CreditCardWidget - Compras que fecham na fatura do mês:', {
      selectedInvoiceMonth,
      invoicePurchases: invoicePurchases.length,
      total,
      purchasesList: invoicePurchases.map(p => ({
        id: p.id,
        description: p.description,
        amount: p.amount,
        purchase_date: p.purchase_date,
        card_name: p.credit_card?.name,
        closing_day: p.credit_card?.closing_day,
        invoice_month: getInvoiceMonth(p, p.credit_card?.closing_day || 15)
      }))
    })

    // Agrupar por cartão para exibição
    const cardTotals = new Map<string, {
      cardId: string
      cardName: string
      cardColor: string
      total: number
      count: number
    }>()
    
    invoicePurchases.forEach(purchase => {
      const cardId = purchase.credit_card.id
      
      if (!cardTotals.has(cardId)) {
        cardTotals.set(cardId, {
          cardId,
          cardName: purchase.credit_card.name,
          cardColor: purchase.credit_card.color,
          total: 0,
          count: 0
        })
      }
      
      const cardData = cardTotals.get(cardId)!
      cardData.total += Number(purchase.amount)
      cardData.count += 1
    })
    
    const creditCardByCard = Array.from(cardTotals.values())

    return {
      creditCardStats: { total, installments: invoicePurchases.length, singlePurchases: 0 },
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
          <p className="fintech-text-muted">Nenhuma fatura do mês anterior</p>
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
            Compras que fecham na fatura do mês ({creditCardData.creditCardStats.installments} compras)
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