'use client'

import { useMemo, useEffect, useState } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

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
    previousMonthBalance: number
  }>({
    periodExpenses: [],
    periodInvestments: [],
    periodIncomes: [],
    previousMonthBalance: 0
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Criar hash simples dos IDs para detectar mudanças
  const expensesHash = useMemo(() => expenses.map(e => e.id).sort().join(','), [expenses])
  const incomesHash = useMemo(() => incomes.map(i => i.id).sort().join(','), [incomes])
  const investmentsHash = useMemo(() => investments.map(i => i.id).sort().join(','), [investments])

  // Buscar dados do período com a mesma lógica do CurrentBalanceWidget
  useEffect(() => {
    console.log('🔄 StatsCardsWidget: Recalculando dados...', { 
      startDate, 
      endDate, 
      expensesCount: expenses.length,
      expensesHash: expensesHash.substring(0, 20) + '...'
    })
    
    const fetchPeriodData = async () => {
      try {
        const start = startDate || getCurrentMonthRange().start
        const end = endDate || getCurrentMonthRange().end

        // Calcular saldo acumulado até o mês anterior (não apenas do mês anterior)
        const currentDate = new Date(start)
        const previousMonthEnd = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0), 'yyyy-MM-dd')

        const [expensesRes, investmentsRes, incomesRes, prevExpensesRes, prevIncomesRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('*, category:expense_categories(*), credit_card:credit_cards(*), member:family_members(*)')
            .gte('expense_date', start)
            .lte('expense_date', end),
            // REMOVIDO: .eq('is_paid', true) - Para projeções, considerar todas as despesas
          
          supabase
            .from('investments')
            .select('*, investment_type:investment_types(*), member:family_members(*)')
            .gte('investment_date', start)
            .lte('investment_date', end),
          
          supabase
            .from('incomes')
            .select('*, category:income_categories(*), member:family_members(*)')
            .gte('income_date', start)
            .lte('income_date', end),
            // REMOVIDO: .eq('is_paid', true) - Para projeções, considerar todas as receitas

          // Buscar TODAS as despesas até o final do mês anterior (saldo acumulado)
          // CORRIGIDO: Filtrar apenas parcelas de cartão, não compras parent
          supabase
            .from('expenses')
            .select('amount, is_credit_card, is_installment')
            .lte('expense_date', previousMonthEnd)
            .eq('is_paid', true), // Para saldo acumulado anterior, manter apenas pagas

          // Buscar TODAS as receitas até o final do mês anterior (saldo acumulado)
          supabase
            .from('incomes')
            .select('amount')
            .lte('income_date', previousMonthEnd)
            .eq('is_paid', true) // Para saldo acumulado anterior, manter apenas recebidas
        ])

        // Calcular saldo acumulado até o mês anterior
        const accumulatedIncomes = (prevIncomesRes.data || []).reduce((sum, i: any) => sum + Number(i.amount), 0)
        
        // CORRIGIDO: Filtrar despesas para incluir apenas parcelas de cartão, não compras parent
        const accumulatedExpenses = (prevExpensesRes.data || [])
          .filter((e: any) => !e.is_credit_card || e.is_installment)
          .reduce((sum, e: any) => sum + Number(e.amount), 0)
        
        const accumulatedBalance = accumulatedIncomes - accumulatedExpenses

        console.log('💰 StatsCardsWidget: Saldo acumulado calculado', {
          accumulatedIncomes,
          accumulatedExpenses,
          accumulatedBalance,
          previousMonthEnd
        })

        setPeriodData({
          periodExpenses: expensesRes.data || [],
          periodInvestments: investmentsRes.data || [],
          periodIncomes: incomesRes.data || [],
          previousMonthBalance: accumulatedBalance
        })
      } catch (error) {
        console.error('Erro ao buscar dados do período:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchPeriodData()
  }, [startDate, endDate, expensesHash, incomesHash, investmentsHash]) // Usar hashes para detectar mudanças nos dados

  const stats = useMemo(() => {
    const { periodExpenses, periodInvestments, periodIncomes, previousMonthBalance } = periodData
    
    // CORRIGIDO: Filtrar despesas do período para incluir apenas parcelas de cartão, não compras parent
    const filteredPeriodExpenses = periodExpenses.filter(e => !e.is_credit_card || e.is_installment)
    
    // Separar despesas pagas e não pagas para melhor visibilidade
    const paidExpenses = filteredPeriodExpenses.filter(e => e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0)
    const unpaidExpenses = filteredPeriodExpenses.filter(e => !e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0)
    const monthlyExpenses = paidExpenses + unpaidExpenses
    
    // Separar receitas recebidas e a receber para melhor visibilidade
    const receivedIncomes = periodIncomes.filter(i => i.is_paid).reduce((sum, i) => sum + Number(i.amount), 0)
    const pendingIncomes = periodIncomes.filter(i => !i.is_paid).reduce((sum, i) => sum + Number(i.amount), 0)
    const monthlyIncomes = receivedIncomes + pendingIncomes
    
    // Para investimentos do período, usar initial_amount (valor investido)
    const monthlyInvestments = periodInvestments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
    
    // Saldo do período = Receitas - Despesas - Investimentos
    // Investimentos reduzem o saldo líquido pois saem da conta corrente
    const monthlyBalance = monthlyIncomes - monthlyExpenses - monthlyInvestments

    // Saldo líquido acumulado = Saldo do período + Saldo acumulado anterior
    const cumulativeBalance = monthlyBalance + previousMonthBalance

    // Saldo de Patrimônio = Saldo Líquido + Investimentos (recupera o valor investido como patrimônio)
    const patrimonialBalance = cumulativeBalance + monthlyInvestments

    return {
      monthlyExpenses,
      monthlyIncomes,
      monthlyBalance,
      cumulativeBalance, // Saldo líquido acumulado
      patrimonialBalance, // Novo: Saldo de patrimônio
      monthlyInvestments, // Valor investido no período
      expenseCount: filteredPeriodExpenses.length,
      incomeCount: periodIncomes.length,
      investmentCount: periodInvestments.length,
      previousMonthBalance, // Para exibir informação adicional
      paidExpenses,
      unpaidExpenses,
      receivedIncomes,
      pendingIncomes
    }
  }, [periodData])

  if (loading || dataLoading || !mounted) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map(i => (
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
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Receitas do Período"
          value={formatCurrency(stats.monthlyIncomes)}
          icon="💰"
          color="green"
          subtitle={`✓${formatCurrency(stats.receivedIncomes)} | ⏳${formatCurrency(stats.pendingIncomes)}`}
        />
        <StatCard
          title="Despesas do Período"
          value={formatCurrency(stats.monthlyExpenses)}
          icon="💸"
          color="red"
          subtitle={`✓${formatCurrency(stats.paidExpenses)} | ⏳${formatCurrency(stats.unpaidExpenses)}`}
        />
        <StatCard
          title="Saldo Líquido"
          value={formatCurrency(stats.cumulativeBalance)}
          icon="📊"
          color={stats.cumulativeBalance >= 0 ? 'green' : 'red'}
          subtitle={`(Receitas - Despesas - Investimentos) + Acumulado anterior`}
        />
        <StatCard
          title="Investido no Período"
          value={formatCurrency(stats.monthlyInvestments)}
          icon="📈"
          color="blue"
          subtitle={`${stats.investmentCount} investimento(s)`}
        />
        <StatCard
          title="Saldo de Patrimônio"
          value={formatCurrency(stats.patrimonialBalance)}
          icon="💎"
          color={stats.patrimonialBalance >= 0 ? 'green' : 'red'}
          subtitle={`Saldo Líquido + Investimentos`}
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