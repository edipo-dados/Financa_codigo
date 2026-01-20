'use client'

import { useState, useMemo } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import IncomeForm from './IncomeForm'
import EditRecurrenceModal from './EditRecurrenceModal'
import EditValueModal from './EditValueModal'
import { Income } from '@/types'

interface Props {
  userId: string
}

export default function IncomesList({ userId }: Props) {
  const { incomes, loading, deleteIncome, refetch } = useIncomes(userId)
  const { members } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<Income | null>(null)
  const [editingValue, setEditingValue] = useState<Income | null>(null)
  
  // Estados dos filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    member: '',
    category: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Aplicar filtros
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      // Filtro por membro
      if (filters.member && income.member_id !== filters.member) return false
      
      // Filtro por categoria
      if (filters.category && income.category_id !== filters.category) return false
      
      // Filtro por status
      if (filters.status === 'paid' && !income.is_paid) return false
      if (filters.status === 'unpaid' && income.is_paid) return false
      
      // Filtro por data
      if (filters.dateFrom && income.income_date < filters.dateFrom) return false
      if (filters.dateTo && income.income_date > filters.dateTo) return false
      
      // Filtro por busca
      if (filters.search && !income.description.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      return true
    })
  }, [incomes, filters])

  // Obter categorias únicas
  const categories = useMemo(() => {
    const uniqueCategories = new Map()
    incomes.forEach(income => {
      if (income.category) {
        uniqueCategories.set(income.category.id, income.category)
      }
    })
    return Array.from(uniqueCategories.values())
  }, [incomes])

  const clearFilters = () => {
    setFilters({
      member: '',
      category: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }



  const handleDeleteRecurrence = async (income: Income) => {
    const confirmMsg = `Deseja excluir TODA a recorrência "${income.description}"?\n\nIsso excluirá este item e impedirá a criação de futuras ocorrências.`
    
    if (!confirm(confirmMsg)) return
    
    try {
      // Excluir todas as ocorrências futuras desta recorrência
      const { error: deleteError } = await supabase
        .from('incomes')
        .delete()
        .eq('parent_income_id', income.id)
      
      if (deleteError) {
        console.error('Erro ao excluir ocorrências futuras:', deleteError)
      }
      
      // Excluir o item principal
      await deleteIncome(income.id)
      refetch()
    } catch (error) {
      console.error('Erro ao excluir recorrência:', error)
      alert('Erro ao excluir recorrência')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta receita?')) {
      await deleteIncome(id)
      refetch()
    }
  }

  const togglePaid = async (income: any) => {
    const { error } = await supabase
      .from('incomes')
      // @ts-ignore
      .update({ is_paid: !income.is_paid })
      .eq('id', income.id)
    
    if (error) {
      console.error('Error updating paid status:', error)
      alert('Erro ao atualizar status: ' + error.message)
    } else {
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Receitas</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? '✕ Cancelar' : '+ Nova Receita'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold text-apple-gray-700 hover:text-apple-blue transition-colors"
          >
            <span>{showFilters ? '🔽' : '▶️'}</span>
            🔍 Filtros
            {(filters.member || filters.category || filters.status || filters.dateFrom || filters.dateTo || filters.search) && (
              <span className="ml-2 px-2 py-0.5 bg-apple-blue text-white text-xs rounded-full">
                Ativos
              </span>
            )}
          </button>
          {showFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-apple-blue hover:text-apple-blue/80 font-medium"
            >
              Limpar Filtros
            </button>
          )}
        </div>
        
        {showFilters && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Busca */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
              placeholder="Descrição da receita..."
            />
          </div>

          {/* Membro da Família */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Membro da Família
            </label>
            <select
              value={filters.member}
              onChange={(e) => setFilters({ ...filters, member: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="">Todos os membros</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.relationship && `(${member.relationship})`}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="">Todos os status</option>
              <option value="paid">Recebido</option>
              <option value="unpaid">A Receber</option>
            </select>
          </div>

          {/* Data De */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Data De
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>

          {/* Data Até */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Data Até
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>
        </div>
        
        {/* Resumo dos filtros */}
        <div className="mt-3 pt-3 border-t border-apple-gray-200">
          <p className="text-xs text-apple-gray-500">
            Mostrando {filteredIncomes.length} de {incomes.length} receitas
          </p>
        </div>
        </div>
        )}
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <IncomeForm 
            userId={userId} 
            onSuccess={() => setShowForm(false)} 
            onRefresh={refetch}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-apple-gray-400 text-sm">Carregando receitas...</p>
          </div>
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
            {incomes.length === 0 ? 'Nenhuma receita cadastrada' : 'Nenhuma receita encontrada'}
          </h3>
          <p className="text-apple-gray-400 text-sm">
            {incomes.length === 0 
              ? 'Comece adicionando sua primeira receita'
              : 'Tente ajustar os filtros para encontrar suas receitas'
            }
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-apple-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Membro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Fonte</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {filteredIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-apple-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {formatDate(income.income_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-apple-gray-700 font-medium">
                      {income.description}
                      {income.is_recurring && (
                        <span className="ml-2 px-2 py-0.5 bg-apple-green/10 text-apple-green text-xs rounded-md">
                          Recorrente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {income.member ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${income.member.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: income.member.color }} />
                          <span style={{ color: income.member.color }}>{income.member.name}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {income.category ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${income.category.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: income.category.color }} />
                          <span style={{ color: income.category.color }}>{income.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400">Sem categoria</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {income.source || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-apple-green">
                      {formatCurrency(Number(income.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => togglePaid(income)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          income.is_paid
                            ? 'bg-apple-green/10 text-apple-green hover:bg-apple-green/20'
                            : 'bg-apple-orange/10 text-apple-orange hover:bg-apple-orange/20'
                        }`}
                        title="Clique para alterar o status"
                      >
                        {income.is_paid ? '✓ Recebido' : '⏳ A Receber'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingValue(income)}
                          className="text-apple-green hover:text-apple-green/80 transition-colors font-medium text-xs"
                          title="Editar valor desta ocorrência"
                        >
                          💰 Valor
                        </button>
                        {income.is_recurring && (
                          <button
                            onClick={() => setEditingRecurrence(income)}
                            className="text-apple-blue hover:text-apple-blue/80 transition-colors font-medium text-xs"
                            title="Editar recorrência"
                          >
                            ⚙️ Recorrência
                          </button>
                        )}
                        {income.is_recurring && (
                          <button
                            onClick={() => handleDeleteRecurrence(income)}
                            className="text-apple-orange hover:text-apple-orange/80 transition-colors font-medium text-xs"
                            title="Excluir toda a recorrência"
                          >
                            🗑️ Série
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="text-apple-red hover:text-apple-red/80 transition-colors font-medium text-xs"
                          title={income.is_recurring ? 'Excluir apenas este item' : 'Excluir receita'}
                        >
                          {income.is_recurring ? 'Excluir Item' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edição de Recorrência */}
      <EditRecurrenceModal
        isOpen={!!editingRecurrence}
        onClose={() => setEditingRecurrence(null)}
        item={editingRecurrence}
        type="income"
        onSuccess={() => {
          refetch()
          setEditingRecurrence(null)
        }}
      />

      {/* Modal de Edição de Valor */}
      {editingValue && (
        <EditValueModal
          isOpen={!!editingValue}
          onClose={() => setEditingValue(null)}
          item={{
            id: editingValue.id,
            description: editingValue.description,
            amount: editingValue.amount,
            type: 'income',
            date: editingValue.income_date
          }}
          onSuccess={() => {
            refetch()
            setEditingValue(null)
          }}
        />
      )}
    </div>
  )
}
