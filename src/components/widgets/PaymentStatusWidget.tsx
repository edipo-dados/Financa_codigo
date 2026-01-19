'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function PaymentStatusWidget({ expenses, incomes, loading, startDate, endDate }: Props) {
  const stats = useMemo(() => {
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    // Calcular despesas e receitas pagas vs a pagar
    const expensesPaid = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end && e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    
    const expensesToPay = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end && !e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const incomesPaid = incomes
      .filter(i => i.income_date >= start && i.income_date <= end && i.is_paid)
      .reduce((sum, i) => sum + Number(i.amount), 0)
    
    const incomesToReceive = incomes
      .filter(i => i.income_date >= start && i.income_date <= end && !i.is_paid)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    return {
      expensesPaid,
      expensesToPay,
      incomesPaid,
      incomesToReceive,
    }
  }, [expenses, incomes, startDate, endDate])

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">💳 Status de Pagamentos</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Despesas Pagas</h4>
            <span className="text-lg sm:text-xl">✓</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(stats.expensesPaid)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Despesas A Pagar</h4>
            <span className="text-lg sm:text-xl">⏳</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(stats.expensesToPay)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Receitas Recebidas</h4>
            <span className="text-lg sm:text-xl">✓</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(stats.incomesPaid)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Receitas A Receber</h4>
            <span className="text-lg sm:text-xl">⏳</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(stats.incomesToReceive)}
          </p>
        </div>
      </div>
    </div>
  )
}