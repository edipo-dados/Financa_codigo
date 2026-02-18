'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function CurrentBalanceWidget({ expenses, investments, incomes, loading }: Props) {
  const balanceData = useMemo(() => {
    // Usar dados filtrados passados via props
    // Filtrar apenas itens pagos/recebidos
    const paidIncomes = incomes.filter(i => i.is_paid)
    const paidExpenses = expenses.filter(e => e.is_paid)
    
    // CORRIGIDO: Filtrar despesas para incluir apenas parcelas de cartão, não compras parent
    const totalIncomes = paidIncomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const totalExpenses = paidExpenses
      .filter(expense => !expense.is_credit_card || expense.is_installment)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
    
    // Para investimentos, usar initial_amount (valor investido)
    const totalInvestments = investments.reduce((sum, investment) => sum + Number(investment.initial_amount), 0)
    const totalInvestmentValue = investments.reduce((sum, investment) => sum + Number(investment.current_amount), 0)
    
    // CORRIGIDO: Saldo líquido = Receitas - Despesas - Investimentos
    const currentBalance = totalIncomes - totalExpenses - totalInvestments

    // Saldo de Patrimônio = Saldo Líquido + Investimentos
    const patrimonialBalance = currentBalance + totalInvestments

    return {
      totalIncomes,
      totalExpenses,
      totalInvestments,
      totalInvestmentValue,
      currentBalance,
      patrimonialBalance,
      expenseCount: paidExpenses.length,
      incomeCount: paidIncomes.length,
      investmentCount: investments.length
    }
  }, [expenses, incomes, investments])

  if (loading) {
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
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">💰 Saldos Financeiros</h3>
      
      {/* Saldo Líquido */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300">Saldo Líquido</h4>
          <span className="text-xl">💵</span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
          Receitas - Despesas - Investimentos (Histórico total: {balanceData.incomeCount} receitas, {balanceData.expenseCount} despesas, {balanceData.investmentCount} investimentos)
        </p>
        <p className={`text-3xl font-bold ${
          balanceData.currentBalance >= 0 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {balanceData.currentBalance >= 0 ? '+' : ''}{formatCurrency(balanceData.currentBalance)}
        </p>
      </div>

      {/* Saldo de Patrimônio */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-xl mb-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">Saldo de Patrimônio</h4>
          <span className="text-xl">💎</span>
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
          Saldo Líquido + Investimentos ({balanceData.investmentCount} investimentos)
        </p>
        <p className={`text-3xl font-bold ${
          balanceData.patrimonialBalance >= 0 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {balanceData.patrimonialBalance >= 0 ? '+' : ''}{formatCurrency(balanceData.patrimonialBalance)}
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