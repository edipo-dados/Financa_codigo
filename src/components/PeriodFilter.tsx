'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'

export interface DateRange {
  startDate: string
  endDate: string
  label: string
}

interface Props {
  onPeriodChange: (range: DateRange) => void
  currentPeriod: DateRange
}

export default function PeriodFilter({ onPeriodChange, currentPeriod }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const quickFilters: DateRange[] = [
    {
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      label: 'Mês Atual',
    },
    {
      startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      label: 'Últimos 3 Meses',
    },
    {
      startDate: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      label: 'Últimos 6 Meses',
    },
    {
      startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfYear(new Date()), 'yyyy-MM-dd'),
      label: 'Ano Atual',
    },
  ]

  const handleQuickFilter = (filter: DateRange) => {
    setShowCustom(false)
    onPeriodChange(filter)
  }

  const handleCustomFilter = () => {
    if (customStart && customEnd) {
      onPeriodChange({
        startDate: customStart,
        endDate: customEnd,
        label: 'Período Personalizado',
      })
      setShowCustom(false)
    }
  }

  return (
    <div className="glass-card p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-apple-gray-700">Período</h3>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-apple-blue hover:text-apple-blue/80 font-medium"
        >
          {showCustom ? 'Filtros Rápidos' : 'Personalizar'}
        </button>
      </div>

      {!showCustom ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleQuickFilter(filter)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentPeriod.label === filter.label
                  ? 'bg-apple-blue text-white shadow-apple-lg'
                  : 'bg-white/50 text-apple-gray-600 hover:bg-white hover:shadow-apple'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart}
                className="input-field"
              />
            </div>
          </div>
          <button
            onClick={handleCustomFilter}
            disabled={!customStart || !customEnd}
            className="btn-primary w-full"
          >
            Aplicar Filtro
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-apple-gray-200">
        <p className="text-sm text-apple-gray-500">
          Período selecionado: <span className="font-medium text-apple-gray-700">{currentPeriod.label}</span>
        </p>
        <p className="text-xs text-apple-gray-400 mt-1">
          {format(new Date(currentPeriod.startDate), 'dd/MM/yyyy')} até {format(new Date(currentPeriod.endDate), 'dd/MM/yyyy')}
        </p>
      </div>
    </div>
  )
}
