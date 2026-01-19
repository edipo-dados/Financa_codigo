'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { calculateFutureOccurrences, groupByMonth } from '@/lib/recurrence'
import { format, addMonths } from 'date-fns'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function FutureProjectionsWidget({ expenses, investments, incomes, loading }: Props) {
  const projectionData = useMemo(() => {
    // Calcular projeções futuras (próximos 6 meses)
    const futureIncomes = calculateFutureOccurrences(
      incomes.filter(i => i.is_recurring),
      6
    )
    const futureExpenses = calculateFutureOccurrences(
      expenses.filter(e => e.is_recurring),
      6
    )

    // Agrupar por mês
    const incomesByMonth = groupByMonth(futureIncomes)
    const expensesByMonth = groupByMonth(futureExpenses)

    // Calcular totais
    const totalFutureIncomes = futureIncomes.reduce((sum, occ) => sum + occ.amount, 0)
    const totalFutureExpenses = futureExpenses.reduce((sum, occ) => sum + occ.amount, 0)

    return {
      totalFutureIncomes,
      totalFutureExpenses,
      incomesByMonth,
      expensesByMonth,
    }
  }, [expenses, investments, incomes])

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">📅 Projeções Futuras</h3>
      
      {/* Cards de Projeções Futuras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold fintech-text-primary">Receitas Futuras</h4>
            <span className="text-xl">📅</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">Próximos 6 meses (recorrências)</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(projectionData.totalFutureIncomes)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold fintech-text-primary">Despesas Futuras</h4>
            <span className="text-xl">📅</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">Próximos 6 meses (recorrências)</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(projectionData.totalFutureExpenses)}
          </p>
        </div>
      </div>

      {/* Detalhamento por Mês */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium fintech-text-secondary">Detalhamento Mensal:</h4>
        
        {Array.from({ length: 6 }, (_, i) => {
          const month = format(addMonths(new Date(), i), 'yyyy-MM')
          const monthLabel = format(addMonths(new Date(), i), 'MMM/yy')
          
          const incomeMonth = projectionData.incomesByMonth.find(m => m.month === month)
          const expenseMonth = projectionData.expensesByMonth.find(m => m.month === month)
          
          const monthIncomes = incomeMonth?.total || 0
          const monthExpenses = expenseMonth?.total || 0
          const monthBalance = monthIncomes - monthExpenses

          if (monthIncomes === 0 && monthExpenses === 0) return null

          return (
            <div key={month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-fintech-dark-elevated rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium fintech-text-primary w-12">{monthLabel}</span>
                <div className="flex items-center gap-4 text-xs">
                  {monthIncomes > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      +{formatCurrency(monthIncomes)}
                    </span>
                  )}
                  {monthExpenses > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency(monthExpenses)}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                monthBalance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {monthBalance >= 0 ? '+' : ''}{formatCurrency(monthBalance)}
              </span>
            </div>
          )
        })}
      </div>

      {projectionData.totalFutureIncomes === 0 && projectionData.totalFutureExpenses === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">📅</span>
          <p className="fintech-text-muted">Nenhuma receita ou despesa recorrente configurada</p>
          <p className="text-xs fintech-text-muted mt-1">Configure recorrências para ver projeções futuras</p>
        </div>
      )}
    </div>
  )
}