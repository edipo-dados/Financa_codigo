'use client'

import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'

interface Props {
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export default function MonthNavigator({ currentMonth, onMonthChange }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    onMonthChange(new Date())
  }

  const isCurrentMonth = mounted ? format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM') : false

  if (!mounted) {
    return (
      <div className="glass-card p-4 rounded-3xl">
        <div className="animate-pulse flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-200 dark:bg-fintech-dark-elevated rounded-xl"></div>
          <div className="text-center">
            <div className="h-8 bg-gray-200 dark:bg-fintech-dark-elevated rounded mb-2 w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-fintech-dark-elevated rounded w-32"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-fintech-dark-elevated rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-4 rounded-3xl flex items-center justify-between">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-apple-gray-100 rounded-xl transition-colors"
        title="Mês anterior"
      >
        <svg className="w-6 h-6 text-apple-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-apple-gray-700 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-sm text-apple-gray-400 mt-1">
            {format(startOfMonth(currentMonth), 'dd/MM')} - {format(endOfMonth(currentMonth), 'dd/MM/yyyy')}
          </p>
        </div>

        {!isCurrentMonth && (
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-apple-blue text-white rounded-xl text-sm font-medium hover:bg-apple-blue/90 transition-colors"
          >
            Hoje
          </button>
        )}
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-apple-gray-100 rounded-xl transition-colors"
        title="Próximo mês"
      >
        <svg className="w-6 h-6 text-apple-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
