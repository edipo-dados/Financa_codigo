'use client'

import { useMemo, useState } from 'react'
import { Expense, Income, Investment } from '@/types'
import { calculateFutureOccurrences } from '@/lib/recurrence'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'

interface Props {
  expenses: Expense[]
  incomes: Income[]
  investments: Investment[]
}

type LaunchType = 'income' | 'expense' | 'investment'

interface FutureLaunch {
  date: Date
  amount: number
  description: string
  type: LaunchType
  category?: string
  color?: string
}

export default function FutureLaunches({ expenses, incomes, investments }: Props) {
  const [monthsAhead, setMonthsAhead] = useState(3)
  const [filterType, setFilterType] = useState<LaunchType | 'all'>('all')

  const futureLaunches = useMemo(() => {
    const launches: FutureLaunch[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Incluir mês atual (não apenas futuro)
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Receitas futuras (incluindo mês atual)
    const futureIncomes = calculateFutureOccurrences(
      incomes.filter(i => i.is_recurring),
      monthsAhead
    )
    futureIncomes.forEach(occ => {
      if (occ.date >= startOfCurrentMonth) {
        const income = incomes.find(i => 
          i.is_recurring && 
          i.recurrence_start_date === format(occ.date, 'yyyy-MM-dd')
        )
        launches.push({
          date: occ.date,
          amount: occ.amount,
          description: income?.description || 'Receita',
          type: 'income',
          category: income?.category?.name,
          color: income?.category?.color || '#34c759',
        })
      }
    })

    // Despesas futuras (recorrências - incluindo mês atual)
    const futureExpenses = calculateFutureOccurrences(
      expenses.filter(e => e.is_recurring),
      monthsAhead
    )
    futureExpenses.forEach(occ => {
      if (occ.date >= startOfCurrentMonth) {
        const expense = expenses.find(e => 
          e.is_recurring && 
          e.recurrence_start_date === format(occ.date, 'yyyy-MM-dd')
        )
        launches.push({
          date: occ.date,
          amount: occ.amount,
          description: expense?.description || 'Despesa',
          type: 'expense',
          category: expense?.category?.name,
          color: expense?.category?.color || '#ff3b30',
        })
      }
    })

    // Parcelas de cartão de crédito (mês atual e futuras)
    const creditCardInstallments = expenses.filter(e => 
      e.is_installment && 
      new Date(e.expense_date) >= startOfCurrentMonth
    )
    
    creditCardInstallments.forEach(expense => {
      launches.push({
        date: new Date(expense.expense_date),
        amount: expense.amount,
        description: `${expense.description}`,
        type: 'expense',
        category: expense.category?.name,
        color: expense.credit_card?.color || '#ff3b30',
      })
    })

    // Ordenar por data
    return launches.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [expenses, incomes, investments, monthsAhead])

  const filteredLaunches = useMemo(() => {
    if (filterType === 'all') return futureLaunches
    return futureLaunches.filter(l => l.type === filterType)
  }, [futureLaunches, filterType])

  const summary = useMemo(() => {
    const totalIncomes = futureLaunches
      .filter(l => l.type === 'income')
      .reduce((sum, l) => sum + l.amount, 0)
    
    const totalExpenses = futureLaunches
      .filter(l => l.type === 'expense')
      .reduce((sum, l) => sum + l.amount, 0)
    
    return {
      totalIncomes,
      totalExpenses,
      balance: totalIncomes - totalExpenses,
    }
  }, [futureLaunches])

  const typeLabels = {
    all: 'Todos',
    income: 'Receitas',
    expense: 'Despesas',
    investment: 'Investimentos',
  }

  const typeIcons = {
    income: '💰',
    expense: '💸',
    investment: '📈',
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-apple-gray-700">Lançamentos Futuros</h3>
          <span className="px-3 py-1 bg-apple-blue/10 text-apple-blue text-sm font-medium rounded-lg">
            {filteredLaunches.length} lançamentos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Período de Projeção
            </label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              className="input-field"
            >
              <option value={3}>Próximos 3 meses</option>
              <option value={6}>Próximos 6 meses</option>
              <option value={12}>Próximos 12 meses</option>
              <option value={24}>Próximos 24 meses</option>
            </select>
          </div>

          {/* Filtro de Tipo */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Tipo de Lançamento
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="investment">Investimentos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-apple-gray-500">Total Receitas</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-apple-green">
            {formatCurrency(summary.totalIncomes)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-apple-gray-500">Total Despesas</span>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-2xl font-bold text-apple-red">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-apple-gray-500">Saldo Projetado</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Lista de Lançamentos */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {filteredLaunches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
              Nenhum lançamento futuro
            </h3>
            <p className="text-apple-gray-400 text-sm">
              Cadastre receitas ou despesas recorrentes para ver projeções futuras
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-apple-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {filteredLaunches.map((launch, idx) => (
                  <tr key={idx} className="hover:bg-apple-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {formatDate(format(launch.date, 'yyyy-MM-dd'))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-apple-gray-100 text-apple-gray-700">
                        <span>{typeIcons[launch.type]}</span>
                        {typeLabels[launch.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-apple-gray-700 font-medium">
                      {launch.description}
                      <span className="ml-2 px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs rounded-md">
                        Futuro
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {launch.category ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${launch.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: launch.color }} />
                          <span style={{ color: launch.color }}>{launch.category}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={launch.type === 'income' ? 'text-apple-green' : 'text-apple-red'}>
                        {launch.type === 'income' ? '+' : '-'} {formatCurrency(launch.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
