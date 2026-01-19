'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function StatsCardsWidget({ expenses, investments, incomes, loading, startDate, endDate }: Props) {
  const stats = useMemo(() => {
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    const monthlyExpenses = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const monthlyIncomes = incomes
      .filter(i => i.income_date >= start && i.income_date <= end)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.current_amount), 0)
    const monthlyBalance = monthlyIncomes - monthlyExpenses

    return {
      monthlyExpenses,
      monthlyIncomes,
      monthlyBalance,
      totalInvestments,
    }
  }, [expenses, investments, incomes, startDate, endDate])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="fintech-card p-4 sm:p-6 rounded-2xl animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-fintech-dark-elevated rounded-xl mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">📊 Resumo Financeiro</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(stats.monthlyIncomes)}
          icon="💰"
          color="green"
          trend={8.5}
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(stats.monthlyExpenses)}
          icon="💸"
          color="red"
          trend={-12.5}
        />
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(stats.monthlyBalance)}
          icon="📊"
          color={stats.monthlyBalance >= 0 ? 'green' : 'red'}
          trend={stats.monthlyBalance >= 0 ? 15.2 : -5.3}
        />
        <StatCard
          title="Total Investido"
          value={formatCurrency(stats.totalInvestments)}
          icon="📈"
          color="blue"
          trend={8.3}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: string
  color: 'red' | 'green' | 'blue'
  trend?: number
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    red: 'from-red-500/10 to-red-500/5 text-red-600',
    green: 'from-green-500/10 to-green-500/5 text-green-600',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
  }

  return (
    <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-all duration-200 group hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-lg sm:text-xl`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            trend >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-xs sm:text-sm fintech-text-muted mb-1">{title}</h3>
      <p className={`text-sm sm:text-lg font-semibold ${colorClasses[color].split(' ')[1]}`}>
        {value}
      </p>
    </div>
  )
}