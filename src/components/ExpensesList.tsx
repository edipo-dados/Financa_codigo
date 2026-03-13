'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { calculateFutureOccurrences, generateRecurrenceOccurrences, RecurrenceEndType } from '@/lib/recurrence'
import ExpenseForm from './ExpenseForm'
import EditRecurrenceModal from './EditRecurrenceModal'
import EditValueModal from './EditValueModal'
import EditExpenseModal from './EditExpenseModal'
import ActionsDropdown from './ActionsDropdown'
import { Expense } from '@/types'

interface Props {
  userId: string
  startDate?: string
  endDate?: string
}

export default function ExpensesList({ userId, startDate, endDate }: Props) {
  const { expenses, loading, deleteExpense, refetch } = useExpenses(userId)
  const { members } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurrence, setEditingRecurrence] = useState<Expense | null>(null)
  const [editingValue, setEditingValue] = useState<Expense | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  
  // Estados para seleção múltipla
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // Estado para controlar quais faturas estão expandidas
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set())
  
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

  // Gerar despesas futuras baseadas em recorrências
  useEffect(() => {
    if (!isFuturePeriod || !startDate || !endDate) {
      return
    }

    const generateFutureExpenses = () => {
      // Buscar despesas recorrentes
      const recurringExpenses = expenses.filter(e => e.is_recurring)
      
      if (recurringExpenses.length === 0) return
      
      // Gerar ocorrências futuras
      const futureOccurrences = calculateFutureOccurrences(recurringExpenses, 24)
      
      // Filtrar apenas as ocorrências do período selecionado
      const periodFutureExpenses = futureOccurrences
        .filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= startDate && occDate <= endDate
        })
        .map((occ, index) => {
          // Encontrar a despesa original
          const originalExpense = recurringExpenses.find(e => e.amount === occ.amount)
          
          return {
            id: `future-${originalExpense?.id}-${index}`,
            user_id: userId,
            category_id: originalExpense?.category_id || null,
            member_id: originalExpense?.member_id || null,
            amount: occ.amount,
            description: `${originalExpense?.description || 'Despesa recorrente'} (Projeção)`,
            expense_date: occ.date.toISOString().split('T')[0],
            payment_method: originalExpense?.payment_method || null,
            is_recurring: true,
            is_paid: false, // Despesas futuras não estão pagas
            is_credit_card: false,
            is_installment: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: originalExpense?.category || null,
            member: originalExpense?.member || null,
            isFutureProjection: true // Flag para identificar projeções
          }
        })

      // Adicionar as projeções às despesas existentes
      setFutureExpenses(periodFutureExpenses)
    }

    generateFutureExpenses()
  }, [expenses, isFuturePeriod, startDate, endDate, userId])

  const [futureExpenses, setFutureExpenses] = useState<any[]>([])

  // Filtrar para não mostrar despesas parent de cartão (apenas parcelas), mas manter despesas normais
  const displayExpenses = expenses.filter(e => {
    // Se não é cartão de crédito, sempre mostrar
    if (!e.is_credit_card) return true
    
    // Se é cartão de crédito, mostrar apenas as parcelas (não a compra parent)
    return e.is_installment
  })

  // Combinar despesas reais com futuras baseado no período
  const currentMonthExpenses = useMemo(() => {
    // Usar o período dos filtros se definido, senão usar o período das props
    const effectiveStartDate = filters.dateFrom || startDate
    const effectiveEndDate = filters.dateTo || endDate
    
    if (isFuturePeriod) {
      // Se é período futuro, mostrar apenas projeções
      return futureExpenses
    } else if (effectiveStartDate && effectiveEndDate) {
      // Filtrar despesas pelo período selecionado
      const periodExpenses = displayExpenses.filter(expense => {
        // Incluir despesas do período
        if (expense.expense_date >= effectiveStartDate && expense.expense_date <= effectiveEndDate) {
          return true
        }
        
        // IMPORTANTE: Incluir despesas que são edições de recorrentes (têm parent_expense_id)
        // mesmo que estejam fora do período, para evitar duplicação
        if (expense.parent_expense_id && !expense.is_recurring && !expense.is_installment) {
          return true
        }
        
        return false
      })
      
      // Gerar despesas recorrentes para o período atual se necessário
      const recurringExpenses = expenses.filter(e => e.is_recurring && !e.is_installment)
      const generatedExpenses: any[] = []
      
      recurringExpenses.forEach(recurringExpense => {
        if (!recurringExpense.recurrence_start_date || !recurringExpense.recurrence_frequency) return
        
        const config = {
          startDate: parseISO(recurringExpense.recurrence_start_date),
          frequency: recurringExpense.recurrence_frequency,
          endType: recurringExpense.recurrence_end_type || 'never' as RecurrenceEndType,
          endDate: recurringExpense.recurrence_end_date ? parseISO(recurringExpense.recurrence_end_date) : undefined,
          occurrences: recurringExpense.recurrence_count || undefined,
        }
        
        // Gerar ocorrências para um período amplo
        const occurrences = generateRecurrenceOccurrences(config, 24)
        
        // Filtrar apenas as ocorrências do período selecionado
        const periodOccurrences = occurrences.filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= effectiveStartDate && occDate <= effectiveEndDate
        })
        
        // Verificar se já existe uma despesa real para essas datas
        periodOccurrences.forEach(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          
          // Verificar se já existe uma despesa para esta data e recorrência
          // Priorizar verificação pelo parent_expense_id (mais confiável)
          const existingExpense = periodExpenses.find(expense => {
            // Verificar se é uma ocorrência desta recorrência pela data e parent_expense_id
            if (expense.parent_expense_id === recurringExpense.id && expense.expense_date === occDate) {
              return true
            }
            
            // Verificar se é a própria despesa recorrente (não criar ocorrência na mesma data)
            if (expense.id === recurringExpense.id && expense.expense_date === occDate) {
              return true
            }
            
            return false
          })
          
          // Se não existe, criar uma ocorrência virtual
          if (!existingExpense) {
            generatedExpenses.push({
              id: `recurring-${recurringExpense.id}-${occDate}`,
              user_id: userId,
              category_id: recurringExpense.category_id,
              member_id: recurringExpense.member_id,
              amount: recurringExpense.amount,
              description: recurringExpense.description,
              expense_date: occDate,
              payment_method: recurringExpense.payment_method,
              is_recurring: true,
              is_paid: false,
              is_credit_card: false,
              is_installment: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category: recurringExpense.category,
              member: recurringExpense.member,
              isRecurringOccurrence: true,
              parentRecurringId: recurringExpense.id
            })
          }
        })
      })
      
      return [...periodExpenses, ...generatedExpenses]
    } else {
      // Quando não há período específico, mostrar todas as despesas
      return displayExpenses
    }
  }, [displayExpenses, futureExpenses, isFuturePeriod, startDate, endDate, expenses, userId, filters.dateFrom, filters.dateTo])

  // Calcular totais
  const totals = useMemo(() => {
    let currentExpenses = expenses
    
    if (startDate && endDate) {
      currentExpenses = expenses.filter(expense => {
        return expense.expense_date >= startDate && expense.expense_date <= endDate
      })
      
      // Adicionar despesas recorrentes geradas
      const recurringExpenses = expenses.filter(e => e.is_recurring)
      recurringExpenses.forEach(recurringExpense => {
        if (!recurringExpense.recurrence_start_date || !recurringExpense.recurrence_frequency) return
        
        const config = {
          startDate: parseISO(recurringExpense.recurrence_start_date),
          frequency: recurringExpense.recurrence_frequency,
          endType: recurringExpense.recurrence_end_type || 'never' as RecurrenceEndType,
          endDate: recurringExpense.recurrence_end_date ? parseISO(recurringExpense.recurrence_end_date) : undefined,
          occurrences: recurringExpense.recurrence_count || undefined,
        }
        
        const occurrences = generateRecurrenceOccurrences(config, 24)
        const periodOccurrences = occurrences.filter(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          return occDate >= startDate && occDate <= endDate
        })
        
        periodOccurrences.forEach(occ => {
          const occDate = occ.date.toISOString().split('T')[0]
          const existingExpense = currentExpenses.find(expense => {
            const expenseDesc = expense.description.replace(/\s*\(Recorrente\)\s*$/i, '').trim()
            const recurringDesc = recurringExpense.description.replace(/\s*\(Recorrente\)\s*$/i, '').trim()
            
            return expense.expense_date === occDate && 
              expenseDesc === recurringDesc &&
              Math.abs(Number(expense.amount) - Number(recurringExpense.amount)) < 0.01
          })
          
          if (!existingExpense) {
            currentExpenses.push({
              ...recurringExpense,
              id: `recurring-${recurringExpense.id}-${occDate}`,
              expense_date: occDate,
              is_paid: false,
            } as any)
          }
        })
      })
    }
    
    const total = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const paid = currentExpenses.filter(exp => exp.is_paid).reduce((sum, exp) => sum + Number(exp.amount), 0)
    const unpaid = currentExpenses.filter(exp => !exp.is_paid).reduce((sum, exp) => sum + Number(exp.amount), 0)
    
    return { total, paid, unpaid, count: currentExpenses.length }
  }, [expenses, startDate, endDate])

  // Aplicar filtros
  const filteredExpenses = useMemo(() => {
    return currentMonthExpenses.filter(expense => {
      // Filtro por membro
      if (filters.member && expense.member_id !== filters.member) return false
      
      // Filtro por categoria
      if (filters.category && expense.category_id !== filters.category) return false
      
      // Filtro por status
      if (filters.status === 'paid' && !expense.is_paid) return false
      if (filters.status === 'unpaid' && expense.is_paid) return false
      
      // Filtro por busca
      if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      return true
    })
  }, [currentMonthExpenses, filters])

  // Agrupar despesas de cartão por fatura
  const groupedExpenses = useMemo(() => {
    const creditCardExpenses = filteredExpenses.filter(e => e.is_credit_card && e.is_installment)
    const normalExpenses = filteredExpenses.filter(e => !e.is_credit_card || !e.is_installment)
    
    // Agrupar parcelas de cartão por cartão e mês de vencimento
    const creditCardGroups = new Map<string, {
      cardId: string
      cardName: string
      cardColor?: string
      month: string
      monthLabel: string
      expenses: any[]
      totalAmount: number
      allPaid: boolean
      anyPaid: boolean
    }>()
    
    creditCardExpenses.forEach(expense => {
      if (!expense.credit_card) return
      
      // Usar split para evitar problemas de timezone
      const [year, month] = expense.expense_date.split('-')
      const monthKey = `${expense.credit_card.id}-${year}-${month}`
      const monthLabel = new Date(parseInt(year), parseInt(month) - 1, 15).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!creditCardGroups.has(monthKey)) {
        creditCardGroups.set(monthKey, {
          cardId: expense.credit_card.id,
          cardName: expense.credit_card.name,
          cardColor: expense.credit_card.color,
          month: monthKey,
          monthLabel,
          expenses: [],
          totalAmount: 0,
          allPaid: true,
          anyPaid: false
        })
      }
      
      const group = creditCardGroups.get(monthKey)!
      group.expenses.push(expense)
      group.totalAmount += Number(expense.amount)
      
      if (!expense.is_paid) group.allPaid = false
      if (expense.is_paid) group.anyPaid = true
    })
    
    return {
      normalExpenses,
      creditCardGroups: Array.from(creditCardGroups.values()).sort((a, b) => a.monthLabel.localeCompare(b.monthLabel))
    }
  }, [filteredExpenses])

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

  // Funções de seleção múltipla
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedExpenses(new Set())
  }

  const toggleExpenseSelection = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const selectAllExpenses = () => {
    const allIds = new Set(filteredExpenses.map(e => e.id))
    setSelectedExpenses(allIds)
  }

  const deselectAllExpenses = () => {
    setSelectedExpenses(new Set())
  }

  const markSelectedAsPaid = async () => {
    if (selectedExpenses.size === 0) {
      alert('Selecione pelo menos uma despesa')
      return
    }

    const confirmMsg = `Deseja marcar ${selectedExpenses.size} despesa(s) como paga(s)?`
    if (!confirm(confirmMsg)) return

    try {
      // Atualizar todas as despesas selecionadas
      for (const expenseId of selectedExpenses) {
        await (supabase as any)
          .from('expenses')
          .update({ is_paid: true })
          .eq('id', expenseId)
      }

      // Limpar seleção e atualizar lista
      setSelectedExpenses(new Set())
      setIsSelectionMode(false)
      refetch()
    } catch (error) {
      console.error('Erro ao marcar despesas como pagas:', error)
      alert('Erro ao atualizar despesas')
    }
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
    // Se é uma despesa recorrente gerada, criar uma despesa real
    if (expense.isRecurringOccurrence) {
      const parentExpense = expenses.find(e => e.id === expense.parentRecurringId)
      if (!parentExpense) {
        alert('Erro: despesa recorrente original não encontrada')
        return
      }
      
      // Criar uma despesa real baseada na recorrente
      const newExpense = {
        user_id: userId,
        category_id: parentExpense.category_id,
        member_id: parentExpense.member_id,
        amount: parentExpense.amount,
        description: parentExpense.description,
        expense_date: expense.expense_date,
        payment_method: parentExpense.payment_method,
        is_recurring: false, // A ocorrência específica não é recorrente
        is_paid: true, // Marcar como paga imediatamente
        is_credit_card: false,
        is_installment: false,
        parent_expense_id: parentExpense.id
      }
      
      const { error } = await supabase
        .from('expenses')
        .insert(newExpense as any)
      
      if (error) {
        console.error('Error creating expense occurrence:', error)
        alert('Erro ao criar despesa: ' + error.message)
      } else {
        refetch()
      }
    } else {
      // Despesa normal - apenas atualizar status
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
  }

  // Função para pagar toda a fatura de um cartão
  const payEntireInvoice = async (group: any) => {
    const unpaidExpenses = group.expenses.filter((e: any) => !e.is_paid)
    
    if (unpaidExpenses.length === 0) {
      alert('Todas as despesas desta fatura já estão pagas')
      return
    }
    
    const confirmMsg = `Deseja pagar toda a fatura do ${group.cardName} de ${group.monthLabel}?\n\nTotal: ${formatCurrency(group.totalAmount)}\nItens não pagos: ${unpaidExpenses.length}`
    
    if (!confirm(confirmMsg)) return
    
    try {
      // Atualizar todas as despesas não pagas da fatura
      const expenseIds = unpaidExpenses.map((e: any) => e.id)
      
      const { error } = await (supabase as any)
        .from('expenses')
        .update({ is_paid: true })
        .in('id', expenseIds)
      
      if (error) {
        console.error('Error paying invoice:', error)
        alert('Erro ao pagar fatura: ' + error.message)
      } else {
        alert(`Fatura paga com sucesso! ${unpaidExpenses.length} itens marcados como pagos.`)
        refetch()
      }
    } catch (error) {
      console.error('Error in payEntireInvoice:', error)
      alert('Erro ao pagar fatura')
    }
  }

  // Função para alternar expansão da fatura
  const toggleInvoiceExpansion = (invoiceKey: string) => {
    const newExpanded = new Set(expandedInvoices)
    if (newExpanded.has(invoiceKey)) {
      newExpanded.delete(invoiceKey)
    } else {
      newExpanded.add(invoiceKey)
    }
    setExpandedInvoices(newExpanded)
  }

  // Função para alternar pagamento de toda a fatura
  const toggleInvoicePayment = async (group: any) => {
    const newStatus = !group.allPaid
    const expenseIds = group.expenses.map((e: any) => e.id)
    
    const actionText = newStatus ? 'pagar' : 'desmarcar como paga'
    const confirmMsg = `Deseja ${actionText} toda a fatura do ${group.cardName} de ${group.monthLabel}?\n\nTotal: ${formatCurrency(group.totalAmount)}\nItens: ${group.expenses.length}`
    
    if (!confirm(confirmMsg)) return
    
    try {
      const { error } = await (supabase as any)
        .from('expenses')
        .update({ is_paid: newStatus })
        .in('id', expenseIds)
      
      if (error) {
        console.error('Error toggling invoice payment:', error)
        alert('Erro ao atualizar fatura: ' + error.message)
      } else {
        const statusText = newStatus ? 'paga' : 'desmarcada como paga'
        alert(`Fatura ${statusText} com sucesso! ${group.expenses.length} itens atualizados.`)
        refetch()
      }
    } catch (error) {
      console.error('Error in toggleInvoicePayment:', error)
      alert('Erro ao atualizar fatura')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">
            Despesas
            {isFuturePeriod && (
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                📅 Projeções Futuras
              </span>
            )}
          </h2>
          <p className="text-sm text-apple-gray-500 mt-1">
            {isFuturePeriod 
              ? `Mostrando projeções baseadas em recorrências para o período selecionado`
              : startDate && endDate
                ? `Mostrando despesas do período selecionado`
                : `Mostrando todas as despesas cadastradas`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <>
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 bg-apple-purple text-white rounded-lg font-medium text-sm transition-all duration-200 hover:bg-apple-purple/90"
              >
                ✓ Selecionar
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  showForm 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-apple-blue text-white hover:bg-opacity-90'
                }`}
              >
                {showForm ? '✕ Cancelar' : '+ Nova Despesa'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-apple-gray-600">
                {selectedExpenses.size} selecionada(s)
              </span>
              <button
                onClick={selectAllExpenses}
                className="px-3 py-2 bg-apple-gray-100 text-apple-gray-700 rounded-lg font-medium text-sm hover:bg-apple-gray-200 transition-colors"
              >
                Selecionar Todas
              </button>
              <button
                onClick={deselectAllExpenses}
                className="px-3 py-2 bg-apple-gray-100 text-apple-gray-700 rounded-lg font-medium text-sm hover:bg-apple-gray-200 transition-colors"
              >
                Limpar Seleção
              </button>
              <button
                onClick={markSelectedAsPaid}
                disabled={selectedExpenses.size === 0}
                className="px-4 py-2 bg-apple-green text-white rounded-lg font-medium text-sm hover:bg-apple-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💰 Pagar Selecionadas
              </button>
              <button
                onClick={toggleSelectionMode}
                className="px-3 py-2 bg-apple-gray-100 text-apple-gray-700 rounded-lg font-medium text-sm hover:bg-apple-gray-200 transition-colors"
              >
                ✕ Cancelar
              </button>
            </div>
          )}
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

      {/* Card de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-apple-gray-700 mt-1">{formatCurrency(totals.total)}</p>
            </div>
            <div className="w-12 h-12 bg-apple-blue/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-xs text-apple-gray-400 mt-2">{totals.count} despesa(s)</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">Pagas</p>
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
              <p className="text-xs font-medium text-apple-gray-500 uppercase tracking-wider">A Pagar</p>
              <p className="text-2xl font-bold text-apple-orange mt-1">{formatCurrency(totals.unpaid)}</p>
            </div>
            <div className="w-12 h-12 bg-apple-orange/10 rounded-xl flex items-center justify-center">
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
              Mostrando {groupedExpenses.normalExpenses.length + groupedExpenses.creditCardGroups.reduce((sum, group) => sum + group.expenses.length, 0)} despesas
              {groupedExpenses.creditCardGroups.length > 0 && ` (${groupedExpenses.creditCardGroups.length} faturas de cartão agrupadas)`}
              {startDate && endDate && ` do período selecionado`}
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
            {currentMonthExpenses.length === 0 ? 'Nenhuma despesa cadastrada' : 'Nenhuma despesa encontrada'}
          </h3>
          <p className="text-apple-gray-400 text-sm">
            {currentMonthExpenses.length === 0 
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
                  {isSelectionMode && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllExpenses()
                          } else {
                            deselectAllExpenses()
                          }
                        }}
                        className="w-4 h-4 text-apple-blue rounded focus:ring-2 focus:ring-apple-blue/30"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Membro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Status</th>
                  {!isSelectionMode && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {/* Despesas Normais */}
                {groupedExpenses.normalExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-apple-gray-50/50 transition-colors">
                    {isSelectionMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.has(expense.id)}
                          onChange={() => toggleExpenseSelection(expense.id)}
                          className="w-4 h-4 text-apple-blue rounded focus:ring-2 focus:ring-apple-blue/30"
                        />
                      </td>
                    )}
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
                      {expense.isRecurringOccurrence && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md">
                          Gerada
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600 capitalize">
                      {expense.payment_method === 'cash' ? 'Dinheiro' :
                       expense.payment_method === 'debit' ? 'Débito' :
                       expense.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                       expense.payment_method === 'pix' ? 'PIX' :
                       expense.payment_method === 'transfer' ? 'Transferência' :
                       expense.payment_method || 'Dinheiro'}
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
                      <ActionsDropdown
                        actions={[
                          {
                            id: 'edit',
                            label: 'Editar',
                            icon: '✏️',
                            color: 'text-apple-blue hover:text-apple-blue/80',
                            onClick: () => setEditingExpense(expense),
                            title: 'Editar informações da despesa'
                          },
                          {
                            id: 'edit-value',
                            label: 'Editar Valor',
                            icon: '💰',
                            color: 'text-apple-green hover:text-apple-green/80',
                            onClick: () => setEditingValue(expense),
                            title: 'Editar valor desta ocorrência'
                          },
                          ...(expense.is_recurring ? [
                            {
                              id: 'edit-recurrence',
                              label: 'Editar Recorrência',
                              icon: '⚙️',
                              color: 'text-apple-blue hover:text-apple-blue/80',
                              onClick: () => setEditingRecurrence(expense),
                              title: 'Editar recorrência'
                            },
                            {
                              id: 'delete-series',
                              label: 'Excluir Série',
                              icon: '🗑️',
                              color: 'text-apple-orange hover:text-apple-orange/80',
                              onClick: () => handleDeleteRecurrence(expense),
                              title: 'Excluir toda a recorrência'
                            }
                          ] : []),
                          {
                            id: 'delete',
                            label: expense.is_recurring ? 'Excluir Item' : 'Excluir',
                            icon: '✕',
                            color: 'text-apple-red hover:text-apple-red/80',
                            onClick: () => handleDelete(expense),
                            title: expense.is_recurring ? 'Excluir apenas este item' : 'Excluir despesa'
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}

                {/* Faturas de Cartão Agrupadas */}
                {groupedExpenses.creditCardGroups.map((group) => (
                  <React.Fragment key={group.month}>
                    {/* Cabeçalho da Fatura - Clicável para expandir/recolher */}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors">
                      <td colSpan={isSelectionMode ? 9 : 8} className="px-6 py-4">
                        <div 
                          className="flex items-center justify-between"
                          onClick={() => toggleInvoiceExpansion(group.month)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-blue-600 transition-transform duration-200 ${
                                expandedInvoices.has(group.month) ? 'rotate-90' : ''
                              }`}>
                                ▶️
                              </span>
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: group.cardColor || '#3B82F6' }}
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-800">
                                💳 Fatura {group.cardName} - {group.monthLabel}
                              </h4>
                              <p className="text-sm text-blue-600">
                                {group.expenses.length} {group.expenses.length === 1 ? 'item' : 'itens'} • 
                                Total: {formatCurrency(group.totalAmount)}
                                {expandedInvoices.has(group.month) ? ' • Clique para recolher' : ' • Clique para expandir'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleInvoicePayment(group)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                group.allPaid
                                  ? 'bg-apple-green/10 text-apple-green hover:bg-apple-green/20'
                                  : 'bg-apple-orange/10 text-apple-orange hover:bg-apple-orange/20'
                              }`}
                              title={group.allPaid ? 'Clique para desmarcar toda a fatura' : 'Clique para pagar toda a fatura'}
                            >
                              {group.allPaid ? '✓ Paga' : '⏳ A Pagar'}
                            </button>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              group.allPaid 
                                ? 'bg-green-100 text-green-700' 
                                : group.anyPaid 
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {group.allPaid ? '✓ Completa' : group.anyPaid ? '🔄 Parcial' : '⏳ Pendente'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Itens da Fatura - Mostrar apenas se expandida */}
                    {expandedInvoices.has(group.month) && group.expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-blue-50/30 transition-colors bg-blue-50/10">
                        {isSelectionMode && (
                          <td className="px-6 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.has(expense.id)}
                              onChange={() => toggleExpenseSelection(expense.id)}
                              className="w-4 h-4 text-apple-blue rounded focus:ring-2 focus:ring-apple-blue/30"
                            />
                          </td>
                        )}
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-apple-gray-600 pl-12">
                          {formatDate(expense.expense_date)}
                        </td>
                        <td className="px-6 py-3 text-sm text-apple-gray-700">
                          {expense.description}
                          {expense.installment_number && expense.installments && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md">
                              {expense.installment_number}/{expense.installments}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {expense.member ? (
                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${expense.member.color}15` }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.member.color }} />
                              <span style={{ color: expense.member.color }}>{expense.member.name}</span>
                            </span>
                          ) : (
                            <span className="text-apple-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {expense.category ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${expense.category.color}15` }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                              <span style={{ color: expense.category.color }}>{expense.category.name}</span>
                            </span>
                          ) : (
                            <span className="text-apple-gray-400">Sem categoria</span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-blue-600">
                          💳 {group.cardName}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-apple-red">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
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
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <ActionsDropdown
                            actions={[
                              {
                                id: 'edit',
                                label: 'Editar',
                                icon: '✏️',
                                color: 'text-apple-blue hover:text-apple-blue/80',
                                onClick: () => setEditingExpense(expense),
                                title: 'Editar informações da despesa'
                              },
                              {
                                id: 'delete',
                                label: 'Excluir',
                                icon: '✕',
                                color: 'text-apple-red hover:text-apple-red/80',
                                onClick: () => handleDelete(expense),
                                title: 'Excluir despesa'
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aviso sobre compras de cartão */}
      {groupedExpenses.creditCardGroups.length > 0 && (
        <div className="glass-card p-4 rounded-2xl bg-apple-blue/5 border border-apple-blue/20 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h4 className="text-sm font-semibold text-apple-gray-700 mb-1">Faturas de Cartão Interativas</h4>
              <p className="text-xs text-apple-gray-600">
                <strong>Clique na fatura</strong> para expandir/recolher os detalhes. 
                Use o botão <strong>"✓ Paga" / "⏳ A Pagar"</strong> para marcar/desmarcar toda a fatura de uma vez, 
                igual às outras despesas.
              </p>
            </div>
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

      {/* Modal de Edição de Valor */}
      {editingValue && (
        <EditValueModal
          isOpen={!!editingValue}
          onClose={() => setEditingValue(null)}
          item={{
            id: editingValue.id,
            description: editingValue.description,
            amount: editingValue.amount,
            type: 'expense',
            date: editingValue.expense_date
          }}
          onSuccess={() => {
            refetch()
            setEditingValue(null)
          }}
        />
      )}

      {/* Modal de Edição de Despesa */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          onSuccess={() => {
            refetch()
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}