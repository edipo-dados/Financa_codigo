'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { formatCurrency } from '@/lib/utils'
import { calculateFutureOccurrences, groupByMonth } from '@/lib/recurrence'
import { format, addMonths } from 'date-fns'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
}

export default function ProjectionChartCore({ expenses, investments, incomes }: Props) {
  const { theme } = useTheme()

  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#f0f0f0',
    axis: theme === 'dark' ? '#9ca3af' : '#8e8e93',
    tooltipBg: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: theme === 'dark' ? '#ffffff' : '#000000',
    legendText: theme === 'dark' ? '#e5e7eb' : '#374151',
  }

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

    // Criar dados para o gráfico de projeção
    const chartData = []
    const today = new Date()
    
    for (let i = 0; i < 6; i++) {
      const month = format(addMonths(today, i), 'yyyy-MM')
      const monthLabel = format(addMonths(today, i), 'MMM/yy')
      
      const incomeMonth = incomesByMonth.find(m => m.month === month)
      const expenseMonth = expensesByMonth.find(m => m.month === month)
      
      chartData.push({
        month: monthLabel,
        receitas: incomeMonth?.total || 0,
        despesas: expenseMonth?.total || 0,
        saldo: (incomeMonth?.total || 0) - (expenseMonth?.total || 0),
      })
    }

    return chartData
  }, [expenses, investments, incomes])

  if (projectionData.every(item => item.receitas === 0 && item.despesas === 0)) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-2 block">📊</span>
        <p className="fintech-text-muted">Nenhuma projeção disponível</p>
        <p className="text-xs fintech-text-muted mt-1">Configure receitas e despesas recorrentes para ver projeções</p>
      </div>
    )
  }

  return (
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
          dataKey="receitas" 
          stroke="#10b981" 
          strokeWidth={3}
          name="Receitas"
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="despesas" 
          stroke="#ef4444" 
          strokeWidth={3}
          name="Despesas"
          dot={{ fill: '#ef4444', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="saldo" 
          stroke="#3b82f6" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Saldo"
          dot={{ fill: '#3b82f6', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}