'use client'

import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import ExpenseForm from './ExpenseForm'
import EditRecurrenceModal from './EditRecurrenceModal'
import { Expense } from '@/types'

interface Props {
  userId: string
}

export default function ExpensesList({ userId }: Props) {
  const { expenses, loading, deleteExpense, refetch } = useExpenses(userId)
  const { members } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<Expense | null>(null)
  
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

  // Filtrar para não mostrar despesas parent de cartão (apenas parcelas)
  const displayExpenses = expenses.filter(e => 
    !e.is_credit_card || e.is_installment
  )

  // Aplicar filtros
  const filteredExpenses = useMemo(() => {
    return displayExpenses.filter(expense => {
      // Filtro por membro
      if (filters.member && expense.member_id !== filters.member) return false
      
      // Filtro por categoria
      if (filters.category && expense.category_id !== filters.category) return false
      
      // Filtro por status
      if (filters.status === 'paid' && !expense.is_paid) return false
      if (filters.status === 'unpaid' && expense.is_paid) return false
      
      // Filtro por data
      if (filters.dateFrom && expense.expense_date < filters.dateFrom) return false
      if (filters.dateTo && expense.expense_date > filters.dateTo) return false
      
      // Filtro por busca
      if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      return true
    })
  }, [displayExpenses, filters])

  // Obter categorias únicas
  const categories = useMemo(() => {
    const uniqueCategories = new Map()
    expenses.forEach(expense => {
      if (expense.category) {
        uniqueCategories.set(expense.category.id, expense.category)
      }
    })
    return Array.from(uniqueCategories.values())
  }, [expenses])

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

  const handleDeleteRecurrence = async (expense: Expense) => {
    const confirmMsg = `Deseja excluir TODA a recorrência "${expense.description}"?\n\nIsso excluirá este item e impedirá a criação de futuras ocorrências.`
    
    if (!confirm(confirmMsg)) return
    
    try {
      // Excluir todas as ocorrências futuras desta recorrência
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('parent_expense_id', expense.id)
      
      if (deleteError) {
        console.error('Erro ao excluir ocorrências futuras:', deleteError)
      }
      
      // Excluir o item principal
      await deleteExpense(expense.id)
      refetch()
    } catch (error) {
      console.error('Erro ao excluir recorrência:', error)
      alert('Erro ao excluir recorrência')
    }
  }

  const handleDelete = async (expense: any) => {
    // Se for parcela de cartão, oferecer opção de excluir a compra completa
    if (expense.is_installment && expense.parent_expense_id) {
      const confirmMsg = `Esta é a parcela ${expense.installment_number}/${expense.installments}.\n\nDeseja excluir TODA a compra (todas as ${expense.installments} parcelas)?`
      
      if (!confirm(confirmMsg)) return

      // Buscar a compra parent
      const { data: parentExpense } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expense.parent_expense_id)
        .single()

      if (!parentExpense) {
        alert('Erro: Compra original não encontrada')
        return
      }

      // Buscar todas as parcelas irmãs
      const { data: allInstallments } = await supabase
        .from('expenses')
        .select('id')
        .eq('parent_expense_id', expense.parent_expense_id)

      // Excluir todas as parcelas
      if (allInstallments && allInstallments.length > 0) {
        await supabase
          .from('expenses')
          .delete()
          .eq('parent_expense_id', expense.parent_expense_id) as any
      }

      // Excluir a compra parent
      await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.parent_expense_id) as any

      refetch()
      return
    }

    // Se for compra de cartão (parent), avisar que vai excluir todas as parcelas
    if (expense.is_credit_card && !expense.is_installment) {
      const confirmMsg = expense.installments 
        ? `Esta é uma compra parcelada em ${expense.installments}x. Todas as parcelas serão excluídas. Deseja continuar?`
        : 'Deseja realmente excluir esta despesa?'
      
      if (!confirm(confirmMsg)) return

      // Buscar e excluir todas as parcelas filhas
      const childExpenses = expenses.filter(e => e.parent_expense_id === expense.id)
      
      for (const child of childExpenses) {
        await supabase.from('expenses').delete().eq('id', child.id) as any
      }
    } else {
      if (!confirm('Deseja realmente excluir esta despesa?')) return
    }
    
    await deleteExpense(expense.id)
    refetch()
  }

  const togglePaid = async (expense: any) => {
    const { error } = await supabase
      .from('expenses')
      // @ts-ignore
      .update({ is_paid: !expense.is_paid })
      .eq('id', expense.id)
    
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
          <h2 className="text-2xl font-semibold text-apple-gray-700">Despesas</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? '✕ Cancelar' : '+ Nova Despesa'}
          </button>
        </div>
      </div>

      {/* Aviso sobre compras de cartão */}
      {displayExpenses.some(e => e.is_credit_card) && (
        <div className="glass-card p-4 rounded-2xl bg-apple-blue/5 border border-apple-blue/20 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💳</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-apple-gray-700 mb-1">Compras no Cartão</h4>
              <p className="text-xs text-apple-gray-600">
                Para gerenciar suas compras parceladas de forma mais fácil, acesse a aba{' '}
                <strong className="text-apple-blue">💳 Compras no Cartão</strong>.
                Lá você pode ver todas as compras e excluir a compra completa (todas as parcelas de uma vez).
              </p>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Descrição da despesa..."
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
                <option value="paid">Pago</option>
                <option value="unpaid">A Pagar</option>
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
              Mostrando {filteredExpenses.length} de {displayExpenses.length} despesas
            </p>
          </div>
        </div>
        )}
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <ExpenseForm 
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
            <p className="text-apple-gray-400 text-sm">Carregando despesas...</p>
          </div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💸</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
            {displayExpenses.length === 0 ? 'Nenhuma despesa cadastrada' : 'Nenhuma despesa encontrada'}
          </h3>
          <p className="text-apple-gray-400 text-sm">
            {displayExpenses.length === 0 
              ? 'Comece adicionando sua primeira despesa'
              : 'Tente ajustar os filtros para encontrar suas despesas'
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-apple-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-apple-gray-700 font-medium">
                      {expense.description}
                      {expense.is_recurring && (
                        <span className="ml-2 px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs rounded-md">
                          Recorrente
                        </span>
                      )}
                      {expense.is_installment && expense.installment_number && expense.installments && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-apple-purple/10 text-apple-purple text-xs rounded-md">
                            Parcela {expense.installment_number}/{expense.installments}
                          </span>
                          <span className="text-xs text-apple-gray-400">
                            (Clique em "Excluir Compra" para remover todas)
                          </span>
                        </div>
                      )}
                      {expense.is_credit_card && expense.credit_card && (
                        <span 
                          className="ml-2 px-2 py-0.5 text-xs rounded-md inline-flex items-center gap-1" 
                          style={{ 
                            backgroundColor: `${expense.credit_card.color}15`, 
                            color: expense.credit_card.color 
                          }}
                        >
                          💳 {expense.credit_card.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.member ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${expense.member.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.member.color }} />
                          <span style={{ color: expense.member.color }}>{expense.member.name}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.category ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${expense.category.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                          <span style={{ color: expense.category.color }}>{expense.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400">Sem categoria</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-apple-red">
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => togglePaid(expense)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          expense.is_paid
                            ? 'bg-apple-green/10 text-apple-green hover:bg-apple-green/20'
                            : 'bg-apple-orange/10 text-apple-orange hover:bg-apple-orange/20'
                        }`}
                        title="Clique para alterar o status"
                      >
                        {expense.is_paid ? '✓ Pago' : '⏳ A Pagar'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {expense.is_recurring && (
                          <button
                            onClick={() => setEditingRecurrence(expense)}
                            className="text-apple-blue hover:text-apple-blue/80 transition-colors font-medium text-xs"
                            title="Editar recorrência"
                          >
                            ⚙️ Recorrência
                          </button>
                        )}
                        {expense.is_recurring && (
                          <button
                            onClick={() => handleDeleteRecurrence(expense)}
                            className="text-apple-orange hover:text-apple-orange/80 transition-colors font-medium text-xs"
                            title="Excluir toda a recorrência"
                          >
                            🗑️ Série
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(expense)}
                          className="text-apple-red hover:text-apple-red/80 transition-colors font-medium text-xs"
                          title={expense.is_installment 
                            ? `Excluir toda a compra (${expense.installments} parcelas)`
                            : expense.is_recurring 
                              ? 'Excluir apenas este item'
                              : 'Excluir despesa'
                          }
                        >
                          {expense.is_installment ? '🗑️ Compra' : expense.is_recurring ? 'Excluir Item' : 'Excluir'}
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
        type="expense"
        onSuccess={() => {
          refetch()
          setEditingRecurrence(null)
        }}
      />
    </div>
  )
}