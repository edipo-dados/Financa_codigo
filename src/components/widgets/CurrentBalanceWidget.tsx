'use client'

import { useMemo, useEffect, useState } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  userId?: string
}

export default function CurrentBalanceWidget({ expenses, investments, incomes, loading, userId }: Props) {
  const [allData, setAllData] = useState<{
    allExpenses: Expense[]
    allInvestments: Investment[]
    allIncomes: Income[]
  }>({
    allExpenses: [],
    allInvestments: [],
    allIncomes: []
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Buscar TODOS os dados para cálculo real do saldo
  useEffect(() => {
    if (!userId) {
      setDataLoading(false)
      return
    }

    const fetchAllData = async () => {
      try {
        const [expensesRes, investmentsRes, incomesRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('*, category:expense_categories(*), credit_card:credit_cards(*), member:family_members(*)')
            .eq('user_id', userId)
            .eq('is_paid', true), // Apenas despesas pagas para saldo real
          
          supabase
            .from('investments')
            .select('*, investment_type:investment_types(*), member:family_members(*)')
            .eq('user_id', userId),
          
          supabase
            .from('incomes')
            .select('*, category:income_categories(*), member:family_members(*)')
            .eq('user_id', userId)
            .eq('is_paid', true) // Apenas receitas recebidas para saldo real
        ])

        setAllData({
          allExpenses: expensesRes.data || [],
          allInvestments: investmentsRes.data || [],
          allIncomes: incomesRes.data || []
        })
      } catch (error) {
        console.error('Erro ao buscar dados completos:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchAllData()
  }, [userId])

  const balanceData = useMemo(() => {
    // Usar dados completos para cálculo real do saldo
    const { allExpenses, allInvestments, allIncomes } = allData
    
    // CORRIGIDO: Usar a mesma lógica do StatsCardsWidget - incluir TODAS as despesas
    // Não filtrar despesas parent de cartão, pois elas representam o valor real gasto
    const totalIncomes = allIncomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    
    // Para investimentos, usar initial_amount (valor investido)
    const totalInvestments = allInvestments.reduce((sum, investment) => sum + Number(investment.initial_amount), 0)
    const totalInvestmentValue = allInvestments.reduce((sum, investment) => sum + Number(investment.current_amount), 0)
    
    // CORRIGIDO: Saldo líquido = Receitas - Despesas (SEM subtrair investimentos)
    // Investimentos não devem ser subtraídos do saldo líquido, pois são patrimônio
    const currentBalance = totalIncomes - totalExpenses

    return {
      totalIncomes,
      totalExpenses,
      totalInvestments, // Valor investido (initial_amount)
      totalInvestmentValue, // Valor atual dos investimentos
      currentBalance, // Saldo líquido em conta (receitas - despesas)
      expenseCount: allExpenses.length,
      incomeCount: allIncomes.length,
      investmentCount: allInvestments.length
    }
  }, [allData])

  if (loading || dataLoading || !mounted) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">💰 Saldo Líquido</h3>
      
      {/* Saldo Principal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300">Saldo Líquido</h4>
          <span className="text-xl">💵</span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
          Receitas - Despesas (Histórico total: {balanceData.incomeCount} receitas, {balanceData.expenseCount} despesas)
        </p>
        <p className={`text-3xl font-bold ${
          balanceData.currentBalance >= 0 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {balanceData.currentBalance >= 0 ? '+' : ''}{formatCurrency(balanceData.currentBalance)}
        </p>
      </div>

      {/* Detalhamento dos Investimentos */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-3 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-1">
            <h5 className="text-sm font-medium fintech-text-muted">Investimentos ({balanceData.investmentCount})</h5>
            <span className="text-sm">📈</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="fintech-text-muted">Valor Investido:</span>
              <span className="font-medium text-blue-600">-{formatCurrency(balanceData.totalInvestments)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="fintech-text-muted">Valor Atual:</span>
              <span className="font-medium text-green-600">+{formatCurrency(balanceData.totalInvestmentValue)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold pt-1 border-t border-gray-200 dark:border-gray-600">
              <span className="fintech-text-muted">Rendimento:</span>
              <span className={`${
                (balanceData.totalInvestmentValue - balanceData.totalInvestments) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(balanceData.totalInvestmentValue - balanceData.totalInvestments) >= 0 ? '+' : ''}
                {formatCurrency(balanceData.totalInvestmentValue - balanceData.totalInvestments)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo dos Componentes */}
      <div className="space-y-2 pt-3 border-t fintech-border">
        <div className="flex items-center justify-between text-sm">
          <span className="fintech-text-muted">💰 Receitas Recebidas:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            +{formatCurrency(balanceData.totalIncomes)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="fintech-text-muted">💸 Despesas Pagas:</span>
          <span className="font-medium text-red-600 dark:text-red-400">
            -{formatCurrency(balanceData.totalExpenses)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="fintech-text-muted">📈 Valor Investido:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {formatCurrency(balanceData.totalInvestments)} (separado)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="fintech-text-primary">💵 Saldo Líquido:</span>
          <span className={`${
            balanceData.currentBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {balanceData.currentBalance >= 0 ? '+' : ''}{formatCurrency(balanceData.currentBalance)}
          </span>
        </div>
      </div>
    </div>
  )
}