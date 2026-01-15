'use client'

import { useState } from 'react'
import { useInvestments } from '@/hooks/useInvestments'
import { formatCurrency, formatDate } from '@/lib/utils'
import InvestmentForm from './InvestmentForm'

interface Props {
  userId: string
}

export default function InvestmentsList({ userId }: Props) {
  const { investments, loading, deleteInvestment } = useInvestments(userId)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este investimento?')) {
      await deleteInvestment(id)
    }
  }

  const calculateReturn = (initial: number, current: number) => {
    const returnValue = current - initial
    const returnPercent = (returnValue / initial) * 100
    return { value: returnValue, percent: returnPercent }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Investimentos</h2>
          <p className="text-sm text-apple-gray-400 mt-1">Acompanhe seu patrimônio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Investimento'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <InvestmentForm userId={userId} onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-apple-gray-400 text-sm">Carregando investimentos...</p>
          </div>
        </div>
      ) : investments.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">Nenhum investimento cadastrado</h3>
          <p className="text-apple-gray-400 text-sm">Comece a construir seu patrimônio</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((investment) => {
            const returns = calculateReturn(
              Number(investment.initial_amount),
              Number(investment.current_amount)
            )
            
            return (
              <div key={investment.id} className="glass-card-hover p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-apple-gray-700 mb-1">{investment.name}</h3>
                    <div className="flex items-center gap-2">
                      {investment.investment_type && (
                        <span className="text-xs px-2 py-1 bg-apple-blue/10 text-apple-blue rounded-lg font-medium">
                          {investment.investment_type.name}
                        </span>
                      )}
                    </div>
                    {investment.institution && (
                      <p className="text-xs text-apple-gray-400 mt-1">{investment.institution}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(investment.id)}
                    className="text-apple-red hover:text-apple-red/80 transition-colors text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 pt-4 border-t border-apple-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-apple-gray-500">Investido</span>
                    <span className="font-semibold text-apple-gray-700">
                      {formatCurrency(Number(investment.initial_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-apple-gray-500">Atual</span>
                    <span className="font-semibold text-apple-gray-700">
                      {formatCurrency(Number(investment.current_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-apple-gray-50 to-transparent rounded-xl">
                    <span className="text-sm font-medium text-apple-gray-600">Retorno</span>
                    <div className="text-right">
                      <span className={`font-bold ${returns.value >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                        {formatCurrency(returns.value)}
                      </span>
                      <span className={`block text-xs ${returns.value >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                        {returns.value >= 0 ? '↑' : '↓'} {Math.abs(returns.percent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-apple-gray-400">Data</span>
                    <span className="text-xs text-apple-gray-600">{formatDate(investment.investment_date)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
