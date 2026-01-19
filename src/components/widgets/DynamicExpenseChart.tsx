'use client'

import dynamic from 'next/dynamic'
import { Expense } from '@/types'

// Importação dinâmica do componente de gráfico para evitar problemas de SSR
const ExpenseChart = dynamic(() => import('./ExpenseChartCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-200 dark:bg-fintech-dark-elevated rounded animate-pulse flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Carregando gráfico...</span>
    </div>
  )
})

interface Props {
  expenses: Expense[]
  loading: boolean
}

export default function DynamicExpenseChart({ expenses, loading }: Props) {
  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="w-full h-64 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">💸 Despesas por Categoria</h3>
      <ExpenseChart expenses={expenses} />
    </div>
  )
}