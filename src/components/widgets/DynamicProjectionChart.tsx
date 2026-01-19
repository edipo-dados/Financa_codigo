'use client'

import dynamic from 'next/dynamic'
import { Expense, Investment, Income } from '@/types'

// Importação dinâmica do componente de gráfico para evitar problemas de SSR
const ProjectionChart = dynamic(() => import('./ProjectionChartCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-gray-200 dark:bg-fintech-dark-elevated rounded animate-pulse flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Carregando gráfico...</span>
    </div>
  )
})

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function DynamicProjectionChart({ expenses, investments, incomes, loading }: Props) {
  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="w-full h-80 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold fintech-text-primary">📈 Projeção: Receitas x Despesas</h3>
          <p className="text-sm fintech-text-muted mt-1">Próximos 6 meses baseado em recorrências</p>
        </div>
      </div>
      <ProjectionChart expenses={expenses} investments={investments} incomes={incomes} />
    </div>
  )
}