'use client'

import { useMemo } from 'react'
import { Expense } from '@/types'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { formatCurrency } from '@/lib/utils'

interface Props {
  expenses: Expense[]
}

const COLORS = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30']

export default function ExpenseChartCore({ expenses }: Props) {
  const { theme } = useTheme()

  const chartColors = {
    tooltipBg: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: theme === 'dark' ? '#ffffff' : '#000000',
  }

  const categoryData = useMemo(() => {
    // Filtrar apenas parcelas de cartão (não parent)
    const filteredExpenses = expenses.filter(e => !e.is_credit_card || e.is_installment)
    
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Sem categoria'
      const categoryColor = expense.category?.color || '#6B7280'
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0, color: categoryColor }
      }
      acc[categoryName].value += Number(expense.amount)
      return acc
    }, {} as Record<string, { name: string; value: number; color: string }>)

    return Object.values(expensesByCategory)
  }, [expenses])

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-2 block">📊</span>
        <p className="fintech-text-muted">Nenhuma despesa encontrada</p>
      </div>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Valor']}
            contentStyle={{
              backgroundColor: chartColors.tooltipBg,
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              color: chartColors.tooltipText,
            }}
            labelStyle={{ color: chartColors.tooltipText }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {categoryData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
            />
            <span className="text-sm fintech-text-secondary truncate">{entry.name}</span>
          </div>
        ))}
      </div>
    </>
  )
}