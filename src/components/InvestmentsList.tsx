'use client'

import { useState, useMemo, useEffect } from 'react'
import { useInvestments } from '@/hooks/useInvestments'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { calculateFutureOccurrences } from '@/lib/recurrence'
import InvestmentForm from './InvestmentForm'
import EditRecurrenceModal from './EditRecurrenceModal'
import EditValueModal from './EditValueModal'
import EditInvestmentModal from './EditInvestmentModal'
import ActionsDropdown from './ActionsDropdown'
import { Investment } from '@/types'

interface Props {
  userId: string
  startDate?: string
  endDate?: string
}

export default function InvestmentsList({ userId, startDate, endDate }: Props) {
  const { investments, loading, deleteInvestment, refetch } = useInvestments(userId)
  const { members } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<Investment | null>(null)
  const [editingValue, setEditingValue] = useState<Investment | null>(null)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [futureInvestments, setFutureInvestments] = useState<any[]>([])
  
  // Estados dos filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    member: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Verificar se o período selecionado é futuro
  const isFuturePeriod = useMemo(() => {
    if (!startDate) return false
    const today = new Date()
    const periodStart = new Date(startDate)
    return periodStart > today
  }, [startDate])

  // Gerar investimentos futuros baseados em recorrências
  useEffect(() => {
    if (!isFuturePeriod || !startDate || !endDate) {
      setFutureInvestments([])
      return
    }

    const generateFutureInvestments = () => {
      const recurringInvestments = investments.filter(inv => inv.is_recurring)
      
      if (recurringInvestments.length === 0) return
      
      const futureOccurrences = calculateFutureOccurrences(
        recurringInvestments.map(inv => ({
          amount: inv.initial_amount,
          is_recurring: inv.is_recurring,
          recurrence_frequency: inv.recurrence_frequency,
          recurrence_start_date: inv.recurrence_start_date,
          recurrence_end_type: inv.recurrence_end_type,
          recurrence_end_date: inv.recurrence_end_date,
          recurrence_count: inv.recurrence_count
        })), 
        24
      )
      
      const periodFutureInvestments = futureOccurrences
        .filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= startDate && occDate <= endDate
        })
        .map((occ, index) => {
          const originalInvestment = recurringInvestments.find(inv => inv.initial_amount === occ.amount)
          
          return {
            id: `future-${originalInvestment?.id}-${index}`,
            user_id: userId,
            investment_type_id: originalInvestment?.investment_type_id || null,
            member_id: originalInvestment?.member_id || null,
            name: `${originalInvestment?.name || 'Investimento recorrente'} (Projeção)`,
            institution: originalInvestment?.institution || null,
            initial_amount: occ.amount,
            current_amount: occ.amount,
            investment_date: occ.date.toISOString().split('T')[0],
            expected_return: originalInvestment?.expected_return || null,
            is_recurring: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            investment_type: originalInvestment?.investment_type || null,
            member: originalInvestment?.member || null,
            isFutureProjection: true
          }
        })

      setFutureInvestments(periodFutureInvestments)
    }

    generateFutureInvestments()
  }, [investments, isFuturePeriod, startDate, endDate, userId])

  // Aplicar filtros
  const filteredInvestments = useMemo(() => {
    let currentInvestments
    
    if (isFuturePeriod) {
      currentInvestments = futureInvestments
    } else if (startDate && endDate) {
      currentInvestments = investments.filter(investment => {
        return investment.investment_date >= startDate && investment.investment_date <= endDate
      })
    } else {
      // Filtrar investimentos para mostrar apenas os do mês atual ou anteriores
      const currentDate = new Date()
      currentInvestments = investments.filter(investment => {
        const investmentDate = new Date(investment.investment_date)
        return investmentDate <= currentDate
      })
    }

    return currentInvestments.filter(investment => {
      // Filtro por membro
      if (filters.member && investment.member_id !== filters.member) return false
      
      // Filtro por tipo
      if (filters.type && investment.investment_type_id !== filters.type) return false
      
      // Filtro por data
      if (filters.dateFrom && investment.investment_date < filters.dateFrom) return false
      if (filters.dateTo && investment.investment_date > filters.dateTo) return false
      
      // Filtro por busca
      if (filters.search && !investment.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      return true
    })
  }, [investments, filters])

  // Obter tipos únicos
  const investmentTypes = useMemo(() => {
    const uniqueTypes = new Map()
    investments.forEach(investment => {
      if (investment.investment_type) {
        uniqueTypes.set(investment.investment_type.id, investment.investment_type)
      }
    })
    return Array.from(uniqueTypes.values())
  }, [investments])

  const clearFilters = () => {
    setFilters({
      member: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }

  const handleDeleteRecurrence = async (investment: Investment) => {
    const confirmMsg = `Deseja excluir TODA a recorrência "${investment.name}"?\n\nIsso excluirá este item e impedirá a criação de futuras ocorrências.`
    
    if (!confirm(confirmMsg)) return
    
    try {
      // Excluir todas as ocorrências futuras desta recorrência
      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('parent_investment_id', investment.id)
      
      if (deleteError) {
        console.error('Erro ao excluir ocorrências futuras:', deleteError)
      }
      
      // Excluir o item principal
      await deleteInvestment(investment.id)
      refetch()
    } catch (error) {
      console.error('Erro ao excluir recorrência:', error)
      alert('Erro ao excluir recorrência')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este investimento?')) {
      await deleteInvestment(id)
      refetch()
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
          <h2 className="text-2xl font-semibold text-apple-gray-700">
            Investimentos
            {isFuturePeriod && (
              <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                📅 Projeções Futuras
              </span>
            )}
          </h2>
          <p className="text-sm text-apple-gray-500 mt-1">
            {isFuturePeriod 
              ? `Mostrando projeções baseadas em recorrências para o período selecionado`
              : startDate && endDate
                ? `Mostrando investimentos do período selecionado`
                : `Mostrando apenas investimentos realizados ou do mês atual`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
              showForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-apple-blue text-white hover:bg-opacity-90'
            }`}
          >
            {showForm ? '✕ Cancelar' : '+ Novo Investimento'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <InvestmentForm 
            userId={userId} 
            onSuccess={() => setShowForm(false)} 
            onRefresh={refetch}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold text-apple-gray-700 hover:text-apple-blue transition-colors"
          >
            <span className="text-base">{showFilters ? '🔽' : '▶️'}</span>
            <span className="text-base">🔍</span>
            <span>Filtros</span>
            {(filters.member || filters.type || filters.dateFrom || filters.dateTo || filters.search) && (
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
          {/* Filtro por Membro */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Membro
            </label>
            <select
              value={filters.member}
              onChange={(e) => setFilters({ ...filters, member: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="">Todos os membros</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="">Todos os tipos</option>
              {investmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Data - De */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Data de
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>

          {/* Filtro por Data - Até */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Data até
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>

          {/* Busca */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Nome do investimento..."
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>
          </div>
          
          {/* Resumo dos filtros */}
          <div className="mt-3 pt-3 border-t border-apple-gray-200">
            <p className="text-xs text-apple-gray-500">
              Mostrando {filteredInvestments.length} investimentos (apenas realizados ou do mês atual)
            </p>
          </div>
        </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-apple-gray-400 text-sm">Carregando investimentos...</p>
          </div>
        </div>
      ) : filteredInvestments.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
            {investments.length === 0 ? 'Nenhum investimento cadastrado' : 'Nenhum investimento encontrado'}
          </h3>
          <p className="text-apple-gray-400 text-sm">
            {investments.length === 0 ? 'Comece a construir seu patrimônio' : 'Tente ajustar os filtros para encontrar seus investimentos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestments.map((investment) => {
            const returns = calculateReturn(
              Number(investment.initial_amount),
              Number(investment.current_amount)
            )
            
            return (
              <div key={investment.id} className="glass-card-hover p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-apple-gray-700 mb-1">{investment.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {investment.member && (
                        <span 
                          className="text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${investment.member.color}20`, 
                            color: investment.member.color 
                          }}
                        >
                          <span style={{ color: investment.member.color }}>●</span>
                          {investment.member.name}
                        </span>
                      )}
                      {investment.investment_type && (
                        <span className="text-xs px-2 py-1 bg-apple-blue/10 text-apple-blue rounded-lg font-medium">
                          {investment.investment_type.name}
                        </span>
                      )}
                      {investment.is_recurring && (
                        <span className="text-xs px-2 py-1 bg-apple-green/10 text-apple-green rounded-lg font-medium">
                          Recorrente
                        </span>
                      )}
                    </div>
                    {investment.institution && (
                      <p className="text-xs text-apple-gray-400 mt-1">{investment.institution}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionsDropdown
                      actions={[
                        {
                          id: 'edit',
                          label: 'Editar',
                          icon: '✏️',
                          color: 'text-apple-blue hover:text-apple-blue/80',
                          onClick: () => setEditingInvestment(investment),
                          title: 'Editar informações do investimento'
                        },
                        {
                          id: 'edit-value',
                          label: 'Editar Valor',
                          icon: '💰',
                          color: 'text-apple-green hover:text-apple-green/80',
                          onClick: () => setEditingValue(investment),
                          title: 'Editar valor desta ocorrência'
                        },
                        ...(investment.is_recurring ? [
                          {
                            id: 'edit-recurrence',
                            label: 'Editar Recorrência',
                            icon: '⚙️',
                            color: 'text-apple-blue hover:text-apple-blue/80',
                            onClick: () => setEditingRecurrence(investment),
                            title: 'Editar recorrência'
                          },
                          {
                            id: 'delete-series',
                            label: 'Excluir Série',
                            icon: '🗑️',
                            color: 'text-apple-orange hover:text-apple-orange/80',
                            onClick: () => handleDeleteRecurrence(investment),
                            title: 'Excluir toda a recorrência'
                          }
                        ] : []),
                        {
                          id: 'delete',
                          label: investment.is_recurring ? 'Excluir Item' : 'Excluir',
                          icon: '✕',
                          color: 'text-apple-red hover:text-apple-red/80',
                          onClick: () => handleDelete(investment.id),
                          title: investment.is_recurring ? 'Excluir apenas este item' : 'Excluir investimento'
                        }
                      ]}
                    />
                  </div>
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

      {/* Modal de Edição de Recorrência */}
      <EditRecurrenceModal
        isOpen={!!editingRecurrence}
        onClose={() => setEditingRecurrence(null)}
        item={editingRecurrence}
        type="investment"
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
            description: editingValue.name,
            amount: editingValue.initial_amount,
            type: 'investment',
            date: editingValue.investment_date
          }}
          onSuccess={() => {
            refetch()
            setEditingValue(null)
          }}
        />
      )}

      {/* Modal de Edição de Investimento */}
      {editingInvestment && (
        <EditInvestmentModal
          isOpen={!!editingInvestment}
          onClose={() => setEditingInvestment(null)}
          investment={editingInvestment}
          onSuccess={() => {
            refetch()
            setEditingInvestment(null)
          }}
        />
      )}
    </div>
  )
}
