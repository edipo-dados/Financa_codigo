'use client'

import { useMemo, useEffect, useState } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function StatsCardsWidget({ expenses, investments, incomes, loading, startDate, endDate }: Props) {
  const [periodData, setPeriodData] = useState<{
    periodExpenses: Expense[]
    periodInvestments: Investment[]
    periodIncomes: Income[]
  }>({
    periodExpenses: [],
    periodInvestments: [],
    periodIncomes: []
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Buscar dados do período com a mesma lógica do CurrentBalanceWidget
  useEffect(() => {
    const fetchPeriodData = async () => {
      try {
        const start = startDate || getCurrentMonthRange().start
        const end = endDate || getCurrentMonthRange().end

        const [expensesRes, investmentsRes, incomesRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('*, category:expense_categories(*), credit_card:credit_cards(*), member:family_members(*)')
            .gte('expense_date', start)
            .lte('expense_date', end)
            .eq('is_paid', true), // Apenas despesas pagas (mesma lógica do saldo líquido)
          
          supabase
            .from('investments')
            .select('*, investment_type:investment_types(*), member:family_members(*)')
            .gte('investment_date', start)
            .lte('investment_date', end),
          
          supabase
            .from('incomes')
            .select('*, category:income_categories(*), member:family_members(*)')
            .gte('income_date', start)
            .lte('income_date', end)
            .eq('is_paid', true) // Apenas receitas recebidas (mesma lógica do saldo líquido)
        ])

        setPeriodData({
          periodExpenses: expensesRes.data || [],
          periodInvestments: investmentsRes.data || [],
          periodIncomes: incomesRes.data || []
        })
      } catch (error) {
        console.error('Erro ao buscar dados do período:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchPeriodData()
  }, [startDate, endDate])

  const stats = useMemo(() => {
    const { periodExpenses, periodInvestments, periodIncomes } = periodData
    
    // MESMA LÓGICA DO SALDO LÍQUIDO: Incluir TODAS as despesas (não filtrar parent de cartão)
    const monthlyExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const monthlyIncomes = periodIncomes.reduce((sum, i) => sum + Number(i.amount), 0)
    
    // Para investimentos do período, usar initial_amount (valor investido)
    const monthlyInvestments = periodInvestments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
    
    // Saldo do mês = Receitas - Despesas (SEM subtrair investimentos)
    const monthlyBalance = monthlyIncomes - monthlyExpenses

    return {
      monthlyExpenses,
      monthlyIncomes,
      monthlyBalance,
      monthlyInvestments, // Valor investido no período
      expenseCount: periodExpenses.length,
      incomeCount: periodIncomes.length,
      investmentCount: periodInvestments.length
    }
  }, [periodData])

  if (loading || dataLoading || !mounted) {
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
          title="Receitas do Período"
          value={formatCurrency(stats.monthlyIncomes)}
          icon="💰"
          color="green"
          subtitle={`${stats.incomeCount} receita(s) recebida(s)`}
        />
        <StatCard
          title="Despesas do Período"
          value={formatCurrency(stats.monthlyExpenses)}
          icon="💸"
          color="red"
          subtitle={`${stats.expenseCount} despesa(s) paga(s)`}
        />
        <StatCard
          title="Saldo do Período"
          value={formatCurrency(stats.monthlyBalance)}
          icon="📊"
          color={stats.monthlyBalance >= 0 ? 'green' : 'red'}
          subtitle="Receitas - Despesas"
        />
        <StatCard
          title="Investido no Período"
          value={formatCurrency(stats.monthlyInvestments)}
          icon="📈"
          color="blue"
          subtitle={`${stats.investmentCount} investimento(s)`}
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
  subtitle?: string
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
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
      </div>
      <h3 className="text-xs sm:text-sm fintech-text-muted mb-1">{title}</h3>
      <p className={`text-sm sm:text-lg font-semibold ${colorClasses[color].split(' ')[1]} mb-1`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs fintech-text-muted">
          {subtitle}
        </p>
      )}
    </div>
  )
}