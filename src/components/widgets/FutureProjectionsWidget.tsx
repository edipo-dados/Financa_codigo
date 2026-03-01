'use client'

import { useMemo, useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  // Calcular quantos meses faltam até o final do ano corrente
  const today = new Date()
  const currentMonth = today.getMonth() // 0-11
  const monthsUntilYearEnd = 12 - currentMonth // Meses restantes incluindo o atual
  const projectionMonths = monthsUntilYearEnd

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const projectionData = useMemo(() => {
    if (!mounted) return { projectedMonths: [], totalFutureIncomes: 0, totalFutureExpenses: 0, totalFutureInvestments: 0, hasRecurringData: false, hasHistoricalData: false, recurringCounts: { incomes: 0, expenses: 0, investments: 0 } }
    
    // Para projeções mensais, vamos buscar dados reais do período selecionado
    // e combinar com recorrências futuras
    
    const today = new Date()
    const projectedMonths: any[] = []
    
    for (let i = -1; i < projectionMonths; i++) {
      const monthStart = addMonths(today, i)
      const monthEnd = endOfMonth(monthStart)
      const monthKey = format(monthStart, 'yyyy-MM')
      const monthLabel = format(monthStart, 'MMM/yy')
      
      // Identificar se é mês passado, atual ou futuro
      const isPastMonth = i === -1
      const isCurrentMonth = i === 0
      const isFutureMonth = i > 0
      
      // Buscar dados reais do mês (se já passou ou é atual)
      const monthStartStr = format(startOfMonth(monthStart), 'yyyy-MM-dd')
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd')
      
      // Receitas do mês (separar pagas e não pagas)
      const monthIncomesPaid = incomes.filter(i => 
        i.income_date >= monthStartStr && i.income_date <= monthEndStr && i.is_paid
      ).reduce((sum, i) => sum + Number(i.amount), 0)
      
      const monthIncomesUnpaid = incomes.filter(i => 
        i.income_date >= monthStartStr && i.income_date <= monthEndStr && !i.is_paid
      ).reduce((sum, i) => sum + Number(i.amount), 0)
      
      const monthIncomes = monthIncomesPaid + monthIncomesUnpaid
      
      // Despesas do mês (separar pagas e não pagas, filtrar apenas parcelas de cartão)
      const monthExpensesPaid = expenses.filter(e => 
        e.expense_date >= monthStartStr && e.expense_date <= monthEndStr &&
        (!e.is_credit_card || e.is_installment) && e.is_paid
      ).reduce((sum, e) => sum + Number(e.amount), 0)
      
      const monthExpensesUnpaid = expenses.filter(e => 
        e.expense_date >= monthStartStr && e.expense_date <= monthEndStr &&
        (!e.is_credit_card || e.is_installment) && !e.is_paid
      ).reduce((sum, e) => sum + Number(e.amount), 0)
      
      const monthExpenses = monthExpensesPaid + monthExpensesUnpaid
      
      // Investimentos do mês
      const monthInvestments = investments.filter(inv => 
        inv.investment_date >= monthStartStr && inv.investment_date <= monthEndStr
      ).reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
      
      // Calcular recorrências para este mês específico (apenas se não há dados reais correspondentes)
      const futureIncomes = calculateFutureOccurrences(
        incomes.filter(i => i.is_recurring),
        projectionMonths + 6 // Buscar mais meses para garantir cobertura
      ).filter(occ => {
        const occMonth = format(occ.date, 'yyyy-MM')
        return occMonth === monthKey
      }).reduce((sum, occ) => sum + occ.amount, 0)
      
      const futureExpenses = calculateFutureOccurrences(
        expenses.filter(e => e.is_recurring),
        projectionMonths + 6
      ).filter(occ => {
        const occMonth = format(occ.date, 'yyyy-MM')
        return occMonth === monthKey
      }).reduce((sum, occ) => sum + occ.amount, 0)
      
      const futureInvestmentsRecurring = calculateFutureOccurrences(
        investments.filter(inv => inv.is_recurring).map(inv => ({
          amount: inv.initial_amount,
          is_recurring: inv.is_recurring,
          recurrence_frequency: inv.recurrence_frequency,
          recurrence_start_date: inv.recurrence_start_date,
          recurrence_end_type: inv.recurrence_end_type,
          recurrence_end_date: inv.recurrence_end_date,
          recurrence_count: inv.recurrence_count
        })),
        projectionMonths + 6
      ).filter(occ => {
        const occMonth = format(occ.date, 'yyyy-MM')
        return occMonth === monthKey
      }).reduce((sum, occ) => sum + occ.amount, 0)

      // Lógica corrigida: 
      // - Se é mês passado/atual: usar apenas dados reais (não somar recorrências)
      // - Se é mês futuro: usar recorrências + média histórica (apenas se não há dados reais)
      let projectedIncomes = monthIncomes
      let projectedExpenses = monthExpenses
      let projectedInvestments = monthInvestments
      let projectedIncomesPaid = monthIncomesPaid
      let projectedIncomesUnpaid = monthIncomesUnpaid
      let projectedExpensesPaid = monthExpensesPaid
      let projectedExpensesUnpaid = monthExpensesUnpaid
      let hasRecurrences = false

      // Se é mês futuro, adicionar recorrências (sempre, mas evitar duplicação)
      if (isFutureMonth) {
        // Adicionar recorrências de receitas
        if (futureIncomes > 0) {
          projectedIncomes += futureIncomes
          projectedIncomesPaid += futureIncomes // Assumir que recorrências serão pagas
          hasRecurrences = true
        }
        
        // Adicionar recorrências de despesas
        if (futureExpenses > 0) {
          projectedExpenses += futureExpenses
          projectedExpensesPaid += futureExpenses // Assumir que recorrências serão pagas
          hasRecurrences = true
        }
        
        // Adicionar recorrências de investimentos
        if (futureInvestmentsRecurring > 0) {
          projectedInvestments += futureInvestmentsRecurring
          hasRecurrences = true
        }

        // Se não há dados reais, adicionar também média histórica
        if (monthIncomes === 0 && monthExpenses === 0) {
        
        // Calcular médias históricas dos últimos 6 meses (apenas não recorrentes)
        const sixMonthsAgo = addMonths(today, -6)
        
        const historicalIncomesPaid = incomes.filter(i => 
          new Date(i.income_date) >= sixMonthsAgo && 
          new Date(i.income_date) <= today &&
          !i.is_recurring && i.is_paid
        )
        const avgHistoricalIncomesPaid = historicalIncomesPaid.length > 0 
          ? historicalIncomesPaid.reduce((sum, i) => sum + Number(i.amount), 0) / 6 
          : 0
        
        const historicalIncomesUnpaid = incomes.filter(i => 
          new Date(i.income_date) >= sixMonthsAgo && 
          new Date(i.income_date) <= today &&
          !i.is_recurring && !i.is_paid
        )
        const avgHistoricalIncomesUnpaid = historicalIncomesUnpaid.length > 0 
          ? historicalIncomesUnpaid.reduce((sum, i) => sum + Number(i.amount), 0) / 6 
          : 0
        
        const historicalExpensesPaid = expenses.filter(e => 
          new Date(e.expense_date) >= sixMonthsAgo && 
          new Date(e.expense_date) <= today &&
          !e.is_recurring && e.is_paid &&
          (!e.is_credit_card || e.is_installment)
        )
        const avgHistoricalExpensesPaid = historicalExpensesPaid.length > 0 
          ? historicalExpensesPaid.reduce((sum, e) => sum + Number(e.amount), 0) / 6 
          : 0
        
        const historicalExpensesUnpaid = expenses.filter(e => 
          new Date(e.expense_date) >= sixMonthsAgo && 
          new Date(e.expense_date) <= today &&
          !e.is_recurring && !e.is_paid &&
          (!e.is_credit_card || e.is_installment)
        )
        const avgHistoricalExpensesUnpaid = historicalExpensesUnpaid.length > 0 
          ? historicalExpensesUnpaid.reduce((sum, e) => sum + Number(e.amount), 0) / 6 
          : 0
        
        const historicalInvestments = investments.filter(inv => 
          new Date(inv.investment_date) >= sixMonthsAgo && 
          new Date(inv.investment_date) <= today &&
          !inv.is_recurring
        )
        const avgHistoricalInvestments = historicalInvestments.length > 0
          ? historicalInvestments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0) / 6
          : 0
        
          // Adicionar média histórica apenas se não há dados reais
          projectedIncomes += avgHistoricalIncomesPaid + avgHistoricalIncomesUnpaid
          projectedExpenses += avgHistoricalExpensesPaid + avgHistoricalExpensesUnpaid
          projectedInvestments += avgHistoricalInvestments
          
          // Para média histórica, distribuir entre pago/não pago
          projectedIncomesPaid += avgHistoricalIncomesPaid
          projectedIncomesUnpaid += avgHistoricalIncomesUnpaid
          projectedExpensesPaid += avgHistoricalExpensesPaid  
          projectedExpensesUnpaid += avgHistoricalExpensesUnpaid
        }
      } else {
        // Se é mês passado/atual, verificar se há recorrências ativas (apenas para indicador visual)
        hasRecurrences = futureIncomes > 0 || futureExpenses > 0 || futureInvestmentsRecurring > 0
      }
      
    // CORRIGIDO: Projeção = (Receitas - Investimentos) - Despesas + Saldo anterior
      const monthBalance = (projectedIncomes - projectedInvestments) - projectedExpenses
      
      projectedMonths.push({
        month: monthLabel,
        incomes: projectedIncomes,
        expenses: projectedExpenses,
        investments: projectedInvestments,
        balance: monthBalance, // Saldo do mês
        incomesPaid: projectedIncomesPaid,
        incomesUnpaid: projectedIncomesUnpaid,
        expensesPaid: projectedExpensesPaid,
        expensesUnpaid: projectedExpensesUnpaid,
        isProjected: monthStart > today && (monthIncomes === 0 && monthExpenses === 0),
        hasRecurrences: hasRecurrences,
        isPastMonth: isPastMonth,
        isCurrentMonth: isCurrentMonth,
        isFutureMonth: isFutureMonth
      })
    }

    // CORRIGIDO: Calcular saldo acumulado (cada mês soma apenas com o mês anterior)
    projectedMonths.forEach((month, index) => {
      if (index === 0) {
        // Primeiro mês: saldo acumulado = saldo do mês
        ;(month as any).accumulatedBalance = month.balance
      } else {
        // Meses seguintes: saldo do mês + saldo acumulado do mês anterior
        const previousAccumulated = (projectedMonths[index - 1] as any).accumulatedBalance
        ;(month as any).accumulatedBalance = month.balance + previousAccumulated
      }
    })

    // Calcular totais
    const totalFutureIncomes = projectedMonths.reduce((sum, month) => sum + month.incomes, 0)
    const totalFutureExpenses = projectedMonths.reduce((sum, month) => sum + month.expenses, 0)
    const totalFutureInvestments = projectedMonths.reduce((sum, month) => sum + month.investments, 0)

    // Contar recorrências ativas
    const recurringIncomes = incomes.filter(i => i.is_recurring).length
    const recurringExpenses = expenses.filter(e => e.is_recurring).length
    const recurringInvestments = investments.filter(inv => inv.is_recurring).length

    return {
      totalFutureIncomes,
      totalFutureExpenses,
      totalFutureInvestments,
      projectedMonths,
      hasRecurringData: recurringIncomes > 0 || recurringExpenses > 0 || recurringInvestments > 0,
      hasHistoricalData: incomes.length > 0 || expenses.length > 0 || investments.length > 0,
      recurringCounts: {
        incomes: recurringIncomes,
        expenses: recurringExpenses,
        investments: recurringInvestments
      }
    }
  }, [expenses, investments, incomes, projectionMonths, mounted])

  if (loading || !mounted) {
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
        <h3 className="text-lg font-semibold fintech-text-primary">📅 Projeções (Ano Corrente)</h3>
        <div className="flex items-center gap-3">
          <div className="text-xs fintech-text-muted">
            Fórmula: (Receitas - Investimentos) - Despesas + Saldo anterior
          </div>
        </div>
      </div>
      
      {/* Cards de Projeções Futuras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Receitas Futuras</h4>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">
            Até o final do ano
            {projectionData.recurringCounts.incomes > 0 && (
              <span className="ml-1 text-green-600">({projectionData.recurringCounts.incomes} recorrentes)</span>
            )}
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(projectionData.totalFutureIncomes)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Despesas Futuras</h4>
            <span className="text-lg">💸</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">
            Até o final do ano
            {projectionData.recurringCounts.expenses > 0 && (
              <span className="ml-1 text-red-600">({projectionData.recurringCounts.expenses} recorrentes)</span>
            )}
          </p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(projectionData.totalFutureExpenses)}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-fintech-dark-surface/50 p-4 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold fintech-text-primary">Investimentos Futuros</h4>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-xs fintech-text-muted mb-2">
            Até o final do ano
            {projectionData.recurringCounts.investments > 0 && (
              <span className="ml-1 text-blue-600">({projectionData.recurringCounts.investments} recorrentes)</span>
            )}
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(projectionData.totalFutureInvestments)}
          </p>
        </div>
      </div>

      {/* Resumo da Projeção */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold fintech-text-primary mb-1">Saldo Acumulado Final</h4>
            <p className="text-xs fintech-text-muted">
              Saldo acumulado até o final do ano (cada mês soma ao anterior)
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              projectionData.projectedMonths.length > 0 && (projectionData.projectedMonths[projectionData.projectedMonths.length - 1] as any).accumulatedBalance >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {projectionData.projectedMonths.length > 0 
                ? formatCurrency((projectionData.projectedMonths[projectionData.projectedMonths.length - 1] as any).accumulatedBalance)
                : formatCurrency(0)
              }
            </p>
            <p className="text-xs fintech-text-muted">
              Saldo total simples: {formatCurrency(projectionData.totalFutureIncomes - projectionData.totalFutureExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalhamento por Mês */}
      {(projectionData.hasRecurringData || projectionData.hasHistoricalData) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium fintech-text-secondary">Projeção Mensal:</h4>
            <div className="text-xs fintech-text-muted">
              Mostrando meses do ano corrente
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {projectionData.projectedMonths.map((monthData, index) => {
              if (monthData.incomes === 0 && monthData.expenses === 0 && monthData.investments === 0) return null

              return (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  monthData.isPastMonth
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : monthData.isCurrentMonth
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : monthData.isProjected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-fintech-dark-elevated'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium fintech-text-primary w-12">
                      {monthData.month}
                      {monthData.isPastMonth && (
                        <span className="ml-1 text-xs text-amber-600">📅</span>
                      )}
                      {monthData.isCurrentMonth && (
                        <span className="ml-1 text-xs text-green-600">🟢</span>
                      )}
                      {monthData.isProjected && (
                        <span className="ml-1 text-xs text-blue-600">📊</span>
                      )}
                      {monthData.hasRecurrences && (
                        <span className="ml-1 text-xs text-purple-600">🔄</span>
                      )}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      {monthData.incomes > 0 && (
                        <div className="flex flex-col">
                          <span className="text-green-600 dark:text-green-400">
                            +{formatCurrency(monthData.incomes)}
                          </span>
                          {(monthData.incomesPaid > 0 || monthData.incomesUnpaid > 0) && (
                            <span className="text-green-500 text-xs">
                              ✓{formatCurrency(monthData.incomesPaid)} | ⏳{formatCurrency(monthData.incomesUnpaid)}
                            </span>
                          )}
                        </div>
                      )}
                      {monthData.expenses > 0 && (
                        <div className="flex flex-col">
                          <span className="text-red-600 dark:text-red-400">
                            -{formatCurrency(monthData.expenses)}
                          </span>
                          {(monthData.expensesPaid > 0 || monthData.expensesUnpaid > 0) && (
                            <span className="text-red-500 text-xs">
                              ✓{formatCurrency(monthData.expensesPaid)} | ⏳{formatCurrency(monthData.expensesUnpaid)}
                            </span>
                          )}
                        </div>
                      )}
                      {monthData.investments > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">
                          📈{formatCurrency(monthData.investments)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    (monthData as any).accumulatedBalance >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(monthData as any).accumulatedBalance >= 0 ? '+' : ''}{formatCurrency((monthData as any).accumulatedBalance)}
                  </span>
                </div>
              )
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs fintech-text-muted">
              <div>
                <span className="font-medium">📊 = Projeção</span> (histórico)
              </div>
              <div>
                <span className="font-medium">🔄 = Recorrências</span> ativas
              </div>
              <div>
                <span className="font-medium">✓ = Pago/Recebido</span> | <span className="font-medium">⏳ = Pendente</span>
              </div>
            </div>
            <div className="mt-2 text-xs fintech-text-muted text-center">
              <span className="font-medium">Valores mostrados:</span> Saldo acumulado (soma com mês anterior)
            </div>
          </div>
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