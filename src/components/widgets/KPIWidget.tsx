'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import ConfigurableKPI from '@/components/ConfigurableKPI'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function KPIWidget({ expenses, investments, incomes, loading, startDate, endDate }: Props) {
  const stats = useMemo(() => {
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    const monthlyExpenses = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const monthlyIncomes = incomes
      .filter(i => i.income_date >= start && i.income_date <= end)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    const monthlyBalance = monthlyIncomes - monthlyExpenses

    // Calcular gastos de cartão de crédito
    const totalCreditCardExpenses = expenses
      .filter(e => e.is_credit_card && e.is_installment)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      monthlyExpenses,
      monthlyBalance,
      totalCreditCardExpenses,
    }
  }, [expenses, investments, incomes, startDate, endDate])

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">🎯 KPIs Configuráveis</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ConfigurableKPI
          title="Meta de Gastos"
          currentValue={stats.monthlyExpenses}
          storageKey="kpi_expenses_limit"
          icon="💸"
          color="red"
        />

        <ConfigurableKPI
          title="Meta de Economia"
          currentValue={stats.monthlyBalance}
          storageKey="kpi_savings_goal"
          icon="🎯"
          color="green"
        />

        <ConfigurableKPI
          title="Limite do Cartão"
          currentValue={stats.totalCreditCardExpenses}
          storageKey="kpi_credit_card_limit"
          icon="💳"
          color="orange"
        />
      </div>
    </div>
  )
}