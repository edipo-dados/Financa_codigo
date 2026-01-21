'use client'

import { useMemo } from 'react'
import { Income } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  incomes: Income[]
  loading: boolean
  startDate?: string
  endDate?: string
}

export default function IncomesByMemberPieChart({ incomes, loading, startDate, endDate }: Props) {
  const chartData = useMemo(() => {
    // Filtrar receitas por período se especificado
    let filteredIncomes = incomes
    if (startDate && endDate) {
      filteredIncomes = incomes.filter(i => 
        i.income_date >= startDate && i.income_date <= endDate
      )
    }

    // Agrupar por membro
    const memberTotals = filteredIncomes.reduce((acc, income) => {
      const memberName = income.member?.name || 'Sem membro'
      const memberColor = income.member?.color || '#10b981'
      
      if (!acc[memberName]) {
        acc[memberName] = {
          name: memberName,
          value: 0,
          color: memberColor,
          count: 0
        }
      }
      
      acc[memberName].value += Number(income.amount)
      acc[memberName].count += 1
      
      return acc
    }, {} as Record<string, { name: string; value: number; color: string; count: number }>)

    const data = Object.values(memberTotals).sort((a, b) => b.value - a.value)
    const total = data.reduce((sum, item) => sum + item.value, 0)

    return { data, total }
  }, [incomes, startDate, endDate])

  if (loading) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-4 w-1/2"></div>
          <div className="h-64 bg-gray-200 dark:bg-fintech-dark-elevated rounded"></div>
        </div>
      </div>
    )
  }

  if (chartData.data.length === 0) {
    return (
      <div className="fintech-card p-4 sm:p-6 rounded-2xl">
        <h3 className="text-lg font-semibold fintech-text-primary mb-4">💰 Receitas por Membro</h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <div className="w-16 h-16 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="fintech-text-muted">Nenhuma receita encontrada no período</p>
          </div>
        </div>
      </div>
    )
  }

  // Calcular ângulos para o gráfico de pizza
  const angles = chartData.data.map((item, index) => {
    const percentage = (item.value / chartData.total) * 100
    const angle = (item.value / chartData.total) * 360
    const startAngle = chartData.data.slice(0, index).reduce((sum, prev) => sum + (prev.value / chartData.total) * 360, 0)
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      endAngle: startAngle + angle
    }
  })

  // Função para criar path do arco SVG
  const createArcPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  const centerX = 120
  const centerY = 120
  const radius = 100

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg font-semibold fintech-text-primary mb-4">💰 Receitas por Membro</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Gráfico de Pizza */}
        <div className="flex-shrink-0">
          <svg width="240" height="240" className="drop-shadow-sm">
            {angles.map((item, index) => (
              <path
                key={index}
                d={createArcPath(centerX, centerY, radius, item.startAngle, item.endAngle)}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
            {/* Círculo central para donut effect */}
            <circle
              cx={centerX}
              cy={centerY}
              r="40"
              fill="white"
              className="dark:fill-fintech-dark-surface"
            />
            {/* Total no centro */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-xs font-medium fill-current fintech-text-muted"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-sm font-bold fill-current fintech-text-primary"
            >
              {formatCurrency(chartData.total)}
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div className="flex-1 space-y-3">
          {angles.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-fintech-dark-surface/50 rounded-lg hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium fintech-text-primary text-sm">{item.name}</p>
                  <p className="text-xs fintech-text-muted">{item.count} receita(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm fintech-text-primary">{formatCurrency(item.value)}</p>
                <p className="text-xs fintech-text-muted">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}