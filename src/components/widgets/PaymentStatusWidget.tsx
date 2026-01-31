'use client'

import { useMemo, useEffect, useState } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange, getPaymentStatus } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Props {
  expenses: Expense[]
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
  userId?: string
}

export default function PaymentStatusWidget({ expenses, incomes, loading, startDate, endDate, userId }: Props) {
  const [periodData, setPeriodData] = useState<{
    periodExpenses: Expense[]
    periodIncomes: Income[]
  }>({
    periodExpenses: [],
    periodIncomes: []
  })
  const [dataLoading, setDataLoading] = useState(true)

  // Buscar dados do período específico para cálculo preciso
  useEffect(() => {
    if (!userId) {
      setDataLoading(false)
      return
    }

    const fetchPeriodData = async () => {
      try {
        const start = startDate || getCurrentMonthRange().start
        const end = endDate || getCurrentMonthRange().end

        const [expensesRes, incomesRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('*, category:expense_categories(*), credit_card:credit_cards(*), member:family_members(*)')
            .eq('user_id', userId)
            .gte('expense_date', start)
            .lte('expense_date', end),
          
          supabase
            .from('incomes')
            .select('*, category:income_categories(*), member:family_members(*)')
            .eq('user_id', userId)
            .gte('income_date', start)
            .lte('income_date', end)
        ])

        // Filtrar despesas para não mostrar despesas parent de cartão (apenas parcelas)
        const filteredExpenses = (expensesRes.data || []).filter((e: any) => 
          !e.is_credit_card || e.is_installment
        )

        setPeriodData({
          periodExpenses: filteredExpenses,
          periodIncomes: incomesRes.data || []
        })
      } catch (error) {
        console.error('Erro ao buscar dados do período:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchPeriodData()
  }, [userId, startDate, endDate])

  const stats = useMemo(() => {
    // Usar dados específicos do período
    const { periodExpenses, periodIncomes } = periodData
    
    // Calcular despesas com status correto baseado na data
    const expensesPaid = periodExpenses
      .filter(e => getPaymentStatus(e) === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    
    const expensesToPay = periodExpenses
      .filter(e => getPaymentStatus(e) === 'pending')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const expensesFuture = periodExpenses
      .filter(e => getPaymentStatus(e) === 'future')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Calcular receitas com status correto baseado na data
    const incomesPaid = periodIncomes
      .filter(i => getPaymentStatus(i) === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    
    const incomesToReceive = periodIncomes
      .filter(i => getPaymentStatus(i) === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0)

    const incomesFuture = periodIncomes
      .filter(i => getPaymentStatus(i) === 'future')
      .reduce((sum, i) => sum + Number(i.amount), 0)

    return {
      expensesPaid,
      expensesToPay,
      expensesFuture,
      incomesPaid,
      incomesToReceive,
      incomesFuture,
      totalExpenses: periodExpenses.length,
      totalIncomes: periodIncomes.length,
    }
  }, [periodData])

  if (loading || dataLoading) {
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold fintech-text-primary">💳 Status de Pagamentos</h3>
        <span className="text-xs fintech-text-muted">
          {stats.totalExpenses} despesas • {stats.totalIncomes} receitas
        </span>
      </div>

      {/* Aviso sobre filtros */}
      {stats.totalExpenses !== (expenses?.length || 0) && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            ℹ️ Mostra apenas parcelas de cartão (compras parent são ocultadas para evitar duplicação)
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
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
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Despesas Vencidas</h4>
            <span className="text-lg sm:text-xl">⏳</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.expensesToPay)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Despesas Futuras</h4>
            <span className="text-lg sm:text-xl">📅</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.expensesFuture)}
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
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Receitas Vencidas</h4>
            <span className="text-lg sm:text-xl">⏳</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.incomesToReceive)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 sm:p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-medium fintech-text-muted">Receitas Futuras</h4>
            <span className="text-lg sm:text-xl">📅</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.incomesFuture)}
          </p>
        </div>
      </div>
    </div>
  )
}