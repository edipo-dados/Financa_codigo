'use client'

import { useMemo, useState } from 'react'
import { Expense, Income, Investment } from '@/types'
import { calculateFutureOccurrences } from '@/lib/recurrence'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface Props {
  expenses: Expense[]
  incomes: Income[]
  investments: Investment[]
  onRefresh?: () => void
}

type LaunchType = 'income' | 'expense' | 'investment'

interface FutureLaunch {
  id: string
  date: Date
  amount: number
  description: string
  type: LaunchType
  category?: string
  color?: string
  originalId: string // ID do item original (expense ou income)
}

export default function FutureLaunches({ expenses, incomes, investments, onRefresh }: Props) {
  const [monthsAhead, setMonthsAhead] = useState(3)
  const [filterType, setFilterType] = useState<LaunchType | 'all'>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const futureLaunches = useMemo(() => {
    const launches: FutureLaunch[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Incluir mês atual (não apenas futuro)
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Receitas futuras (incluindo mês atual)
    incomes.filter(i => i.is_recurring).forEach(income => {
      const futureOccurrences = calculateFutureOccurrences([income], monthsAhead)
      futureOccurrences.forEach(occ => {
        if (occ.date >= startOfCurrentMonth) {
          launches.push({
            id: `income-${income.id}-${format(occ.date, 'yyyy-MM-dd')}`,
            originalId: income.id,
            date: occ.date,
            amount: occ.amount,
            description: income.description,
            type: 'income',
            category: income.category?.name,
            color: income.category?.color || '#34c759',
          })
        }
      })
    })

    // Despesas futuras (recorrências - incluindo mês atual)
    expenses.filter(e => e.is_recurring).forEach(expense => {
      const futureOccurrences = calculateFutureOccurrences([expense], monthsAhead)
      futureOccurrences.forEach(occ => {
        if (occ.date >= startOfCurrentMonth) {
          launches.push({
            id: `expense-${expense.id}-${format(occ.date, 'yyyy-MM-dd')}`,
            originalId: expense.id,
            date: occ.date,
            amount: occ.amount,
            description: expense.description,
            type: 'expense',
            category: expense.category?.name,
            color: expense.category?.color || '#ff3b30',
          })
        }
      })
    })

    // Parcelas de cartão de crédito (mês atual e futuras)
    const creditCardInstallments = expenses.filter(e => 
      e.is_installment && 
      new Date(e.expense_date) >= startOfCurrentMonth
    )
    
    creditCardInstallments.forEach(expense => {
      launches.push({
        id: `installment-${expense.id}`,
        originalId: expense.id,
        date: new Date(expense.expense_date),
        amount: expense.amount,
        description: expense.description,
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

  // Funções de seleção
  const toggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    setSelectedItems(new Set(filteredLaunches.map(l => l.id)))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  // Função de exclusão
  const handleDelete = async (itemIds: string[]) => {
    if (!itemIds.length) return

    setIsDeleting(true)
    try {
      const itemsToDelete = filteredLaunches.filter(l => itemIds.includes(l.id))
      
      for (const item of itemsToDelete) {
        if (item.type === 'income') {
          await supabase.from('incomes').delete().eq('id', item.originalId)
        } else if (item.type === 'expense') {
          await supabase.from('expenses').delete().eq('id', item.originalId)
        }
      }

      // Limpar seleção e sair do modo de seleção
      setSelectedItems(new Set())
      setIsSelectionMode(false)
      
      // Atualizar dados
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Erro ao excluir itens:', error)
      alert('Erro ao excluir itens. Tente novamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSingleDelete = (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      handleDelete([itemId])
    }
  }

  const handleMultipleDelete = () => {
    if (selectedItems.size === 0) return
    
    if (confirm(`Tem certeza que deseja excluir ${selectedItems.size} item(s) selecionado(s)?`)) {
      handleDelete(Array.from(selectedItems))
    }
  }



  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-apple-gray-700">Lançamentos Futuros</h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-apple-blue/10 text-apple-blue text-sm font-medium rounded-lg">
              {filteredLaunches.length} lançamentos
            </span>
          </div>
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

        {/* Controles de Seleção */}
        {filteredLaunches.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-apple-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelectionMode 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {isSelectionMode ? '✗ Cancelar Seleção' : '☑️ Selecionar Múltiplos'}
              </button>
              
              {isSelectionMode && (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    ✓ Selecionar Todos
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                  >
                    ✗ Limpar Seleção
                  </button>
                </>
              )}
            </div>
            
            {isSelectionMode && selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-apple-gray-600">
                  {selectedItems.size} item(s) selecionado(s)
                </span>
                <button
                  onClick={handleMultipleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                >
                  {isDeleting ? '⏳ Excluindo...' : '🗑️ Excluir Selecionados'}
                </button>
              </div>
            )}
          </div>
        )}
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
                  {isSelectionMode && (
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredLaunches.length && filteredLaunches.length > 0}
                        onChange={selectedItems.size === filteredLaunches.length ? clearSelection : selectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {filteredLaunches.map((launch, idx) => (
                  <tr key={launch.id} className={`hover:bg-apple-gray-50/50 transition-colors ${
                    selectedItems.has(launch.id) ? 'bg-blue-50' : ''
                  }`}>
                    {isSelectionMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(launch.id)}
                          onChange={() => toggleSelection(launch.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                    )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isSelectionMode && (
                        <button
                          onClick={() => handleSingleDelete(launch.id)}
                          disabled={isDeleting}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs disabled:opacity-50"
                        >
                          🗑️ Excluir
                        </button>
                      )}
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
