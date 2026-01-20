'use client'

import { useMemo, useState } from 'react'
import { Expense, Income, Investment } from '@/types'
import { calculateFutureOccurrences } from '@/lib/recurrence'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import EditRecurrenceModal from './EditRecurrenceModal'

interface Props {
  userId: string
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
  originalItem?: Expense | Income | Investment // Item original completo
  member?: {
    id: string
    name: string
    color: string
  }
}

export default function FutureLaunches({ userId, expenses, incomes, investments, onRefresh }: Props) {
  const { members } = useFamilyMembers(userId)
  const [monthsAhead, setMonthsAhead] = useState(3)
  const [filterType, setFilterType] = useState<LaunchType | 'all'>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<{ item: Expense | Income | Investment, type: LaunchType } | null>(null)
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    member: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

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
            originalItem: income,
            date: occ.date,
            amount: occ.amount,
            description: income.description,
            type: 'income',
            category: income.category?.name,
            color: income.category?.color || '#34c759',
            member: income.member ? {
              id: income.member.id,
              name: income.member.name,
              color: income.member.color
            } : undefined,
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
            originalItem: expense,
            date: occ.date,
            amount: occ.amount,
            description: expense.description,
            type: 'expense',
            category: expense.category?.name,
            color: expense.category?.color || '#ff3b30',
            member: expense.member ? {
              id: expense.member.id,
              name: expense.member.name,
              color: expense.member.color
            } : undefined,
          })
        }
      })
    })

    // Investimentos futuros (recorrências - incluindo mês atual)
    investments.filter(i => i.is_recurring).forEach(investment => {
      // Adaptar investment para a interface esperada pela função
      const adaptedInvestment = {
        ...investment,
        amount: investment.initial_amount // Usar initial_amount como amount
      }
      const futureOccurrences = calculateFutureOccurrences([adaptedInvestment], monthsAhead)
      futureOccurrences.forEach(occ => {
        if (occ.date >= startOfCurrentMonth) {
          launches.push({
            id: `investment-${investment.id}-${format(occ.date, 'yyyy-MM-dd')}`,
            originalId: investment.id,
            originalItem: investment,
            date: occ.date,
            amount: occ.amount,
            description: investment.name,
            type: 'investment',
            category: investment.investment_type?.name,
            color: '#007aff',
            member: investment.member ? {
              id: investment.member.id,
              name: investment.member.name,
              color: investment.member.color
            } : undefined,
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
        originalItem: expense,
        date: new Date(expense.expense_date),
        amount: expense.amount,
        description: expense.description,
        type: 'expense',
        category: expense.category?.name,
        color: expense.credit_card?.color || '#ff3b30',
        member: expense.member ? {
          id: expense.member.id,
          name: expense.member.name,
          color: expense.member.color
        } : undefined,
      })
    })

    // Ordenar por data
    return launches.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [expenses, incomes, investments, monthsAhead])

  const filteredLaunches = useMemo(() => {
    let filtered = futureLaunches
    
    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(l => l.type === filterType)
    }
    
    // Filtro por membro
    if (filters.member) {
      filtered = filtered.filter(l => l.member?.id === filters.member)
    }
    
    // Filtro por categoria
    if (filters.category) {
      filtered = filtered.filter(l => l.category?.toLowerCase().includes(filters.category.toLowerCase()))
    }
    
    // Filtro por data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(l => l.date >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Final do dia
      filtered = filtered.filter(l => l.date <= toDate)
    }
    
    // Filtro por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(l => 
        l.description.toLowerCase().includes(searchTerm) ||
        l.category?.toLowerCase().includes(searchTerm) ||
        l.member?.name.toLowerCase().includes(searchTerm)
      )
    }
    
    return filtered
  }, [futureLaunches, filterType, filters])

  const summary = useMemo(() => {
    const totalIncomes = futureLaunches
      .filter(l => l.type === 'income')
      .reduce((sum, l) => sum + l.amount, 0)
    
    const totalExpenses = futureLaunches
      .filter(l => l.type === 'expense')
      .reduce((sum, l) => sum + l.amount, 0)

    const totalInvestments = futureLaunches
      .filter(l => l.type === 'investment')
      .reduce((sum, l) => sum + l.amount, 0)
    
    return {
      totalIncomes,
      totalExpenses,
      totalInvestments,
      balance: totalIncomes - totalExpenses - totalInvestments,
    }
  }, [futureLaunches])

  // Obter categorias únicas para o filtro
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    futureLaunches.forEach(launch => {
      if (launch.category) {
        categories.add(launch.category)
      }
    })
    return Array.from(categories).sort()
  }, [futureLaunches])

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      member: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }

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

  // Função de edição
  const handleEdit = (launch: FutureLaunch) => {
    if (launch.originalItem && (launch.type === 'expense' || launch.type === 'income' || launch.type === 'investment')) {
      setEditingRecurrence({
        item: launch.originalItem,
        type: launch.type
      })
    }
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
        } else if (item.type === 'investment') {
          await supabase.from('investments').delete().eq('id', item.originalId)
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

        {/* Filtros Avançados */}
        <div className="border-t border-apple-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-apple-gray-700">Filtros Avançados</h4>
            <button
              onClick={clearFilters}
              className="text-sm text-apple-blue hover:text-apple-blue/80 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por Membro */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Membro
              </label>
              <select
                value={filters.member}
                onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">Todos os membros</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Categoria */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">Todas as categorias</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Data - De */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data de
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            {/* Filtro por Data - Até */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data até
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Descrição, categoria..."
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Resumo dos filtros */}
          <div className="mt-4 flex items-center gap-4 text-sm text-apple-gray-500">
            <span>
              Mostrando {filteredLaunches.length} de {futureLaunches.length} lançamentos
            </span>
            {(filters.member || filters.category || filters.dateFrom || filters.dateTo || filters.search) && (
              <span className="text-apple-blue">• Filtros ativos</span>
            )}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <span className="text-sm text-apple-gray-500">Total Investimentos</span>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-bold text-apple-blue">
            {formatCurrency(summary.totalInvestments)}
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
              Cadastre receitas, despesas ou investimentos recorrentes para ver projeções futuras
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase">Membro</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {launch.member ? (
                        <span 
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium"
                          style={{ 
                            backgroundColor: `${launch.member.color}20`, 
                            color: launch.member.color 
                          }}
                        >
                          <span style={{ color: launch.member.color }}>●</span>
                          {launch.member.name}
                        </span>
                      ) : (
                        <span className="text-apple-gray-400">-</span>
                      )}
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
                      <span className={launch.type === 'income' ? 'text-apple-green' : launch.type === 'investment' ? 'text-apple-blue' : 'text-apple-red'}>
                        {launch.type === 'income' ? '+' : '-'} {formatCurrency(launch.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isSelectionMode && (
                        <div className="flex items-center gap-2">
                          {launch.originalItem && (launch.originalItem as any).is_recurring && (
                            <button
                              onClick={() => handleEdit(launch)}
                              className="px-3 py-1 bg-apple-blue text-white rounded-lg hover:bg-apple-blue/90 transition-colors text-xs"
                              title="Editar recorrência"
                            >
                              ✏️ Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleSingleDelete(launch.id)}
                            disabled={isDeleting}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs disabled:opacity-50"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição de Recorrência */}
      {editingRecurrence && (
        <EditRecurrenceModal
          isOpen={!!editingRecurrence}
          onClose={() => setEditingRecurrence(null)}
          item={editingRecurrence.item}
          type={editingRecurrence.type}
          onSuccess={() => {
            if (onRefresh) {
              onRefresh()
            }
            setEditingRecurrence(null)
          }}
        />
      )}
    </div>
  )
}
