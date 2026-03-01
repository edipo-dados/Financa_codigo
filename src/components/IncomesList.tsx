'use client'

import { useState, useMemo, useEffect } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { calculateFutureOccurrences, generateRecurrenceOccurrences, RecurrenceEndType } from '@/lib/recurrence'
import IncomeForm from './IncomeForm'
import EditRecurrenceModal from './EditRecurrenceModal'
import EditValueModal from './EditValueModal'
import EditIncomeModal from './EditIncomeModal'
import ActionsDropdown from './ActionsDropdown'
import { Income } from '@/types'

interface Props {
  userId: string
  startDate?: string
  endDate?: string
}

export default function IncomesList({ userId, startDate, endDate }: Props) {
  const { incomes, loading, deleteIncome, refetch } = useIncomes(userId)
  const { members } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<Income | null>(null)
  const [editingValue, setEditingValue] = useState<Income | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [futureIncomes, setFutureIncomes] = useState<any[]>([])
  
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

  // Verificar se o período selecionado é futuro (mais de 30 dias no futuro)
  const isFuturePeriod = useMemo(() => {
    if (!startDate) return false
    const today = new Date()
    const periodStart = new Date(startDate)
    
    // Considerar como futuro apenas se for mais de 30 dias no futuro
    const diffInDays = (periodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diffInDays > 30
  }, [startDate])

  // Gerar receitas futuras baseadas em recorrências
  useEffect(() => {
    if (!isFuturePeriod || !startDate || !endDate) {
      setFutureIncomes([])
      return
    }

    const generateFutureIncomes = () => {
      const recurringIncomes = incomes.filter(i => i.is_recurring)
      
      if (recurringIncomes.length === 0) return
      
      const futureOccurrences = calculateFutureOccurrences(recurringIncomes, 24)
      
      const periodFutureIncomes = futureOccurrences
        .filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= startDate && occDate <= endDate
        })
        .map((occ, index) => {
          const originalIncome = recurringIncomes.find(i => i.amount === occ.amount)
          
          return {
            id: `future-${originalIncome?.id}-${index}`,
            user_id: userId,
            category_id: originalIncome?.category_id || null,
            member_id: originalIncome?.member_id || null,
            amount: occ.amount,
            description: `${originalIncome?.description || 'Receita recorrente'} (Projeção)`,
            income_date: occ.date.toISOString().split('T')[0],
            source: originalIncome?.source || null,
            is_recurring: true,
            is_paid: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: originalIncome?.category || null,
            member: originalIncome?.member || null,
            isFutureProjection: true
          }
        })

      setFutureIncomes(periodFutureIncomes)
    }

    generateFutureIncomes()
  }, [incomes, isFuturePeriod, startDate, endDate, userId])

  // Calcular totais
  const totals = useMemo(() => {
    let currentIncomes = incomes
    
    if (startDate && endDate) {
      currentIncomes = incomes.filter(income => {
        return income.income_date >= startDate && income.income_date <= endDate
      })
      
      // Adicionar receitas recorrentes geradas
      const recurringIncomes = incomes.filter(i => i.is_recurring)
      recurringIncomes.forEach(recurringIncome => {
        if (!recurringIncome.recurrence_start_date || !recurringIncome.recurrence_frequency) return
        
        const config = {
          startDate: parseISO(recurringIncome.recurrence_start_date),
          frequency: recurringIncome.recurrence_frequency,
          endType: recurringIncome.recurrence_end_type || 'never' as RecurrenceEndType,
          endDate: recurringIncome.recurrence_end_date ? parseISO(recurringIncome.recurrence_end_date) : undefined,
          occurrences: recurringIncome.recurrence_count || undefined,
        }
        
        const occurrences = generateRecurrenceOccurrences(config, 24)
        const periodOccurrences = occurrences.filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= startDate && occDate <= endDate
        })
        
        periodOccurrences.forEach(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          const existingIncome = currentIncomes.find(income => {
            const incomeDesc = income.description.replace(/\s*\(Recorrente\)\s*$/i, '').trim()
            const recurringDesc = recurringIncome.description.replace(/\s*\(Recorrente\)\s*$/i, '').trim()
            
            return income.income_date === occDate && 
              incomeDesc === recurringDesc &&
              Math.abs(Number(income.amount) - Number(recurringIncome.amount)) < 0.01
          })
          
          if (!existingIncome) {
            currentIncomes.push({
              ...recurringIncome,
              id: `recurring-${recurringIncome.id}-${occDate}`,
              income_date: occDate,
              is_paid: false,
            } as any)
          }
        })
      })
    }
    
    const total = currentIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
    const paid = currentIncomes.filter(inc => inc.is_paid).reduce((sum, inc) => sum + Number(inc.amount), 0)
    const unpaid = currentIncomes.filter(inc => !inc.is_paid).reduce((sum, inc) => sum + Number(inc.amount), 0)
    
    return { total, paid, unpaid, count: currentIncomes.length }
  }, [incomes, startDate, endDate])

  // Aplicar filtros
  const filteredIncomes = useMemo(() => {
    let currentIncomes
    
    // Usar o período dos filtros se definido, senão usar o período das props
    const effectiveStartDate = filters.dateFrom || startDate
    const effectiveEndDate = filters.dateTo || endDate
    
    if (isFuturePeriod) {
      currentIncomes = futureIncomes
    } else if (effectiveStartDate && effectiveEndDate) {
      // Filtrar receitas pelo período selecionado
      const periodIncomes = incomes.filter(income => {
        return income.income_date >= effectiveStartDate && income.income_date <= effectiveEndDate
      })
      
      // Gerar receitas recorrentes para o período atual se necessário
      // CORREÇÃO: Usar TODAS as receitas recorrentes, não apenas as do período
      const recurringIncomes = incomes.filter(i => i.is_recurring)
      const generatedIncomes: any[] = []
      
      recurringIncomes.forEach(recurringIncome => {
        if (!recurringIncome.recurrence_start_date || !recurringIncome.recurrence_frequency) return
        
        const config = {
          startDate: parseISO(recurringIncome.recurrence_start_date),
          frequency: recurringIncome.recurrence_frequency,
          endType: recurringIncome.recurrence_end_type || 'never' as RecurrenceEndType,
          endDate: recurringIncome.recurrence_end_date ? parseISO(recurringIncome.recurrence_end_date) : undefined,
          occurrences: recurringIncome.recurrence_count || undefined,
        }
        
        // Gerar ocorrências para um período amplo
        const occurrences = generateRecurrenceOccurrences(config, 24)
        
        // Filtrar apenas as ocorrências do período selecionado
        const periodOccurrences = occurrences.filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= effectiveStartDate && occDate <= effectiveEndDate
        })
        
        // Verificar se já existe uma receita real para essas datas
        periodOccurrences.forEach(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          
          // Verificar se já existe uma receita para esta data e recorrência
          // Priorizar verificação pelo parent_income_id (mais confiável)
          const existingIncome = periodIncomes.find(income => {
            // Verificar se é uma ocorrência desta recorrência pela data e parent_income_id
            if (income.parent_income_id === recurringIncome.id && income.income_date === occDate) {
              return true
            }
            
            // Verificar se é a própria receita recorrente (não criar ocorrência na mesma data)
            if (income.id === recurringIncome.id && income.income_date === occDate) {
              return true
            }
            
            return false
          })
          
          // Se não existe, criar uma ocorrência virtual
          if (!existingIncome) {
            generatedIncomes.push({
              id: `recurring-${recurringIncome.id}-${occDate}`,
              user_id: userId,
              category_id: recurringIncome.category_id,
              member_id: recurringIncome.member_id,
              amount: recurringIncome.amount,
              description: recurringIncome.description,
              income_date: occDate,
              source: recurringIncome.source,
              is_recurring: true,
              is_paid: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category: recurringIncome.category,
              member: recurringIncome.member,
              isRecurringOccurrence: true,
              parentRecurringId: recurringIncome.id
            })
          }
        })
      })
      
      currentIncomes = [...periodIncomes, ...generatedIncomes]
    } else {
      // Quando não há período específico, mostrar todas as receitas
      currentIncomes = incomes
    }

    return currentIncomes.filter(income => {
      // Filtro por membro
      if (filters.member && income.member_id !== filters.member) return false
      
      // Filtro por categoria
      if (filters.category && income.category_id !== filters.category) return false
      
      // Filtro por status
      if (filters.status === 'paid' && !income.is_paid) return false
      if (filters.status === 'unpaid' && income.is_paid) return false
      
      // Filtro por busca
      if (filters.search && !income.description.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      return true
    })
  }, [incomes, filters, isFuturePeriod, futureIncomes, startDate, endDate, userId])

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
    // Se é uma receita recorrente gerada, criar uma receita real
    if (income.isRecurringOccurrence) {
      const parentIncome = incomes.find(i => i.id === income.parentRecurringId)
      if (!parentIncome) {
        alert('Erro: receita recorrente original não encontrada')
        return
      }
      
      // Criar uma receita real baseada na recorrente
      const newIncome = {
        user_id: userId,
        category_id: parentIncome.category_id,
        member_id: parentIncome.member_id,
        amount: parentIncome.amount,
        description: parentIncome.description,
        income_date: income.income_date,
        source: parentIncome.source,
        is_recurring: false, // A ocorrência específica não é recorrente
        is_paid: true, // Marcar como paga imediatamente
        parent_income_id: parentIncome.id
      }
      
      const { error } = await supabase
        .from('incomes')
        .insert(newIncome as any)
      
      if (error) {
        console.error('Error creating income occurrence:', error)
        alert('Erro ao criar receita: ' + error.message)
      } else {
        refetch()
      }
    } else {
      // Receita normal - apenas atualizar status
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
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">
            Receitas
            {isFuturePeriod && (
              <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                📅 Projeções Futuras
              </span>
            )}
          </h2>
          <p className="text-sm text-apple-gray-500 mt-1">
            {isFuturePeriod 
              ? `Mostrando projeções baseadas em recorrências para o período selecionado`
              : startDate && endDate
                ? `Mostrando receitas do período selecionado`
                : `Mostrando todas as receitas cadastradas`
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
            {showForm ? '✕ Cancelar' : '+ Nova Receita'}
          </button>
        </div>
      </div>

      {/* Card de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-apple-gray-700 mt-1">{formatCurrency(totals.total)}</p>
            </div>
            <div className="w-12 h-12 bg-apple-green/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-xs text-apple-gray-400 mt-2">{totals.count} receita(s)</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">Recebidas</p>
              <p className="text-2xl font-bold text-apple-green mt-1">{formatCurrency(totals.paid)}</p>
            </div>
            <div className="w-12 h-12 bg-apple-green/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">A Receber</p>
              <p className="text-2xl font-bold text-apple-blue mt-1">{formatCurrency(totals.unpaid)}</p>
            </div>
            <div className="w-12 h-12 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">Período</p>
              <p className="text-sm font-semibold text-apple-gray-700 mt-2">
                {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Todas'}
              </p>
            </div>
            <div className="w-12 h-12 bg-apple-purple/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>

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

          {/* Mês */}
          <div>
            <label className="block text-xs font-medium text-apple-gray-600 mb-1">
              Mês
            </label>
            <input
              type="month"
              value={filters.dateFrom ? filters.dateFrom.substring(0, 7) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const year = e.target.value.split('-')[0]
                  const month = e.target.value.split('-')[1]
                  const firstDay = `${year}-${month}-01`
                  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                  const lastDayFormatted = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
                  setFilters({ ...filters, dateFrom: firstDay, dateTo: lastDayFormatted })
                } else {
                  setFilters({ ...filters, dateFrom: '', dateTo: '' })
                }
              }}
              className="w-full px-3 py-2 text-sm border border-apple-gray-200 rounded-lg focus:ring-1 focus:ring-apple-blue focus:border-apple-blue"
            />
          </div>
        </div>
        
        {/* Resumo dos filtros */}
        <div className="mt-3 pt-3 border-t border-apple-gray-200">
          <p className="text-xs text-apple-gray-500">
            Mostrando {filteredIncomes.length} receitas
            {startDate && endDate && ` do período selecionado`}
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
                      <ActionsDropdown
                        actions={[
                          {
                            id: 'edit',
                            label: 'Editar',
                            icon: '✏️',
                            color: 'text-apple-blue hover:text-apple-blue/80',
                            onClick: () => setEditingIncome(income),
                            title: 'Editar informações da receita'
                          },
                          {
                            id: 'edit-value',
                            label: 'Editar Valor',
                            icon: '💰',
                            color: 'text-apple-green hover:text-apple-green/80',
                            onClick: () => setEditingValue(income),
                            title: 'Editar valor desta ocorrência'
                          },
                          ...(income.is_recurring ? [
                            {
                              id: 'edit-recurrence',
                              label: 'Editar Recorrência',
                              icon: '⚙️',
                              color: 'text-apple-blue hover:text-apple-blue/80',
                              onClick: () => setEditingRecurrence(income),
                              title: 'Editar recorrência'
                            },
                            {
                              id: 'delete-series',
                              label: 'Excluir Série',
                              icon: '🗑️',
                              color: 'text-apple-orange hover:text-apple-orange/80',
                              onClick: () => handleDeleteRecurrence(income),
                              title: 'Excluir toda a recorrência'
                            }
                          ] : []),
                          {
                            id: 'delete',
                            label: income.is_recurring ? 'Excluir Item' : 'Excluir',
                            icon: '✕',
                            color: 'text-apple-red hover:text-apple-red/80',
                            onClick: () => handleDelete(income.id),
                            title: income.is_recurring ? 'Excluir apenas este item' : 'Excluir receita'
                          }
                        ]}
                      />
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

      {/* Modal de Edição de Receita */}
      {editingIncome && (
        <EditIncomeModal
          isOpen={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          income={editingIncome}
          onSuccess={() => {
            refetch()
            setEditingIncome(null)
          }}
        />
      )}
    </div>
  )
}
