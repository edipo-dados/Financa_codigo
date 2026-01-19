'use client'

import { Expense, Investment, Income } from '@/types'
import FinancialInsights from '@/components/FinancialInsights'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function FinancialInsightsWidget({ expenses, investments, incomes, loading }: Props) {
  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FinancialInsights 
      expenses={expenses}
      investments={investments}
      incomes={incomes}
    />
  )
}