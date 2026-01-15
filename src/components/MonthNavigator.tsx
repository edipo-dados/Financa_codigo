'use client'

import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export default function MonthNavigator({ currentMonth, onMonthChange }: Props) {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    onMonthChange(new Date())
  }

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

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
