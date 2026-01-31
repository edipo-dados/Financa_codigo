'use client'

import { useMemo, useState, useEffect } from 'react'
import { Expense, Investment, Income } from '@/types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { formatCurrency } from '@/lib/utils'
import { calculateFutureOccurrences, groupByMonth } from '@/lib/recurrence'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
}

export default function ProjectionChartWidget({ expenses, investments, incomes, loading }: Props) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [projectionMonths] = useState(6) // Fixo em 6 meses para o gráfico

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#f0f0f0',
    axis: theme === 'dark' ? '#9ca3af' : '#8e8e93',
    tooltipBg: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: theme === 'dark' ? '#ffffff' : '#000000',
    legendText: theme === 'dark' ? '#e5e7eb' : '#374151',
  }

  // USAR EXATAMENTE A MESMA LÓGICA DO FutureProjectionsWidget
  const projectionData = useMemo(() => {
    if (!mounted) return []
    
    const projectedMonths: any[] = []
    const today = new Date()
    
    for (let i = 0; i < projectionMonths; i++) {
      const monthStart = addMonths(today, i)
      const monthEnd = endOfMonth(monthStart)
      const monthKey = format(monthStart, 'yyyy-MM')
      const monthLabel = format(monthStart, 'MMM/yy')
      
      // Buscar dados reais do mês (MESMA LÓGICA)
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
      
      // Calcular recorrências para este mês específico
      const futureIncomes = calculateFutureOccurrences(
        incomes.filter(i => i.is_recurring),
        projectionMonths + 6
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

      // Lógica de projeção (MESMA DO FutureProjectionsWidget)
      let projectedIncomes = monthIncomes
      let projectedExpenses = monthExpenses
      let projectedInvestments = monthInvestments

      // Se é mês futuro, adicionar recorrências
      if (monthStart > today) {
        if (futureIncomes > 0) {
          projectedIncomes += futureIncomes
        }
        
        if (futureExpenses > 0) {
          projectedExpenses += futureExpenses
        }

        // Se não há dados reais, adicionar também média histórica
        if (monthIncomes === 0 && monthExpenses === 0) {
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
        }
      }
      
      // CORRIGIDO: Saldo = Receitas - Despesas (SEM subtrair investimentos)
      const monthBalance = projectedIncomes - projectedExpenses
      
      projectedMonths.push({
        month: monthLabel,
        incomes: projectedIncomes,
        expenses: projectedExpenses,
        investments: projectedInvestments,
        balance: monthBalance,
      })
    }

    // Calcular saldo acumulado (cada mês soma apenas com o mês anterior)
    projectedMonths.forEach((month, index) => {
      if (index === 0) {
        month.accumulatedBalance = month.balance
      } else {
        const previousAccumulated = projectedMonths[index - 1].accumulatedBalance
        month.accumulatedBalance = month.balance + previousAccumulated
      }
    })

    return projectedMonths
  }, [expenses, investments, incomes, projectionMonths, mounted])

  if (loading || !mounted) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="w-full h-64 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
        </div>
      </div>
    )
  }

  if (projectionData.every(item => item.incomes === 0 && item.expenses === 0)) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <h3 className="text-lg font-semibold fintech-text-primary mb-4">📈 Projeção: Receitas x Despesas</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">📊</span>
          <p className="fintech-text-muted">Nenhuma projeção disponível</p>
          <p className="text-xs fintech-text-muted mt-1">Configure receitas e despesas recorrentes para ver projeções</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold fintech-text-primary">📈 Projeção: Receitas x Despesas</h3>
          <p className="text-sm fintech-text-muted mt-1">Próximos 6 meses - mesmos dados do widget "Projeções Futuras"</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={projectionData}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis 
            dataKey="month" 
            stroke={chartColors.axis}
            style={{ fontSize: '12px', fill: chartColors.axis }}
          />
          <YAxis 
            stroke={chartColors.axis}
            style={{ fontSize: '12px', fill: chartColors.axis }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: chartColors.tooltipBg,
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              color: chartColors.tooltipText,
            }}
            labelStyle={{ color: chartColors.tooltipText }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', color: chartColors.legendText }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="incomes" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Receitas"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={3}
            name="Despesas"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="accumulatedBalance" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Saldo Acumulado"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}