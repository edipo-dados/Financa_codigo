'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { calculateFutureOccurrences, groupByMonth } from '@/lib/recurrence'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function FutureProjectionsWidget({ expenses, investments, incomes, loading }: Props) {
  const projectionData = useMemo(() => {
    // 1. Calcular projeções baseadas em recorrências
    const futureIncomes = calculateFutureOccurrences(
      incomes.filter(i => i.is_recurring),
      6
    )
    const futureExpenses = calculateFutureOccurrences(
      expenses.filter(e => e.is_recurring),
      6
    )

    // 2. Calcular médias mensais dos últimos 3 meses para projeção
    const today = new Date()
    const threeMonthsAgo = addMonths(today, -3)
    
    const recentIncomes = incomes.filter(i => 
      new Date(i.income_date) >= threeMonthsAgo && !i.is_recurring
    )
    const recentExpenses = expenses.filter(e => 
      new Date(e.expense_date) >= threeMonthsAgo && !e.is_recurring
    )

    const avgMonthlyIncomes = recentIncomes.length > 0 
      ? recentIncomes.reduce((sum, i) => sum + Number(i.amount), 0) / 3 
      : 0
    const avgMonthlyExpenses = recentExpenses.length > 0 
      ? recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0) / 3 
      : 0

    // 3. Projetar investimentos futuros (baseado na média dos últimos investimentos)
    const recentInvestments = investments.filter(inv => 
      new Date(inv.investment_date) >= threeMonthsAgo
    )
    const avgMonthlyInvestments = recentInvestments.length > 0
      ? recentInvestments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0) / 3
      : 0

    // 4. Combinar recorrências + projeções baseadas em histórico
    const totalFutureIncomes = futureIncomes.reduce((sum, occ) => sum + occ.amount, 0) + (avgMonthlyIncomes * 6)
    const totalFutureExpenses = futureExpenses.reduce((sum, occ) => sum + occ.amount, 0) + (avgMonthlyExpenses * 6)
    const totalFutureInvestments = avgMonthlyInvestments * 6

    // 5. Agrupar por mês
    const incomesByMonth = groupByMonth(futureIncomes)
    const expensesByMonth = groupByMonth(futureExpenses)

    // 6. Adicionar projeções baseadas em histórico aos meses
    const projectedMonths = []
    for (let i = 0; i < 6; i++) {
      const month = format(addMonths(today, i), 'yyyy-MM')
      const monthLabel = format(addMonths(today, i), 'MMM/yy')
      
      const incomeMonth = incomesByMonth.find(m => m.month === month)
      const expenseMonth = expensesByMonth.find(m => m.month === month)
      
      const monthIncomes = (incomeMonth?.total || 0) + avgMonthlyIncomes
      const monthExpenses = (expenseMonth?.total || 0) + avgMonthlyExpenses
      const monthInvestments = avgMonthlyInvestments
      
      projectedMonths.push({
        month: monthLabel,
        incomes: monthIncomes,
        expenses: monthExpenses,
        investments: monthInvestments,
        balance: monthIncomes - monthExpenses - monthInvestments
      })
    }

    return {
      totalFutureIncomes,
      totalFutureExpenses,
      totalFutureInvestments,
      projectedMonths,
      hasRecurringData: futureIncomes.length > 0 || futureExpenses.length > 0,
      hasHistoricalData: avgMonthlyIncomes > 0 || avgMonthlyExpenses > 0 || avgMonthlyInvestments > 0,
    }
  }, [expenses, investments, incomes])

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold fintech-text-primary">📅 Projeções Futuras</h3>
        <div className="text-xs fintech-text-muted">
          {projectionData.hasRecurringData && projectionData.hasHistoricalData && "Recorrências + Histórico"}
          {projectionData.hasRecurringData && !projectionData.hasHistoricalData && "Baseado em Recorrências"}
          {!projectionData.hasRecurringData && projectionData.hasHistoricalData && "Baseado no Histórico"}
          {!projectionData.hasRecurringData && !projectionData.hasHistoricalData && "Sem dados suficientes"}
        </div>
      </div>
      
      {/* Cards de Projeções Futuras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Receitas Futuras</h4>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">Próximos 6 meses</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(projectionData.totalFutureIncomes)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Despesas Futuras</h4>
            <span className="text-lg">💸</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">Próximos 6 meses</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(projectionData.totalFutureExpenses)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Investimentos Futuros</h4>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">Próximos 6 meses</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(projectionData.totalFutureInvestments)}
          </p>
        </div>
      </div>

      {/* Detalhamento por Mês */}
      {(projectionData.hasRecurringData || projectionData.hasHistoricalData) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium fintech-text-secondary">Projeção Mensal:</h4>
          
          {projectionData.projectedMonths.map((monthData, index) => {
            if (monthData.incomes === 0 && monthData.expenses === 0 && monthData.investments === 0) return null

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-fintech-dark-elevated rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium fintech-text-primary w-12">{monthData.month}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {monthData.incomes > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        +{formatCurrency(monthData.incomes)}
                      </span>
                    )}
                    {monthData.expenses > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        -{formatCurrency(monthData.expenses)}
                      </span>
                    )}
                    {monthData.investments > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        📈{formatCurrency(monthData.investments)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  monthData.balance >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {monthData.balance >= 0 ? '+' : ''}{formatCurrency(monthData.balance)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!projectionData.hasRecurringData && !projectionData.hasHistoricalData && (
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">📅</span>
          <p className="fintech-text-muted">Dados insuficientes para projeções</p>
          <p className="text-xs fintech-text-muted mt-1">
            Configure recorrências ou adicione mais transações para ver projeções futuras
          </p>
        </div>
      )}
    </div>
  )
}