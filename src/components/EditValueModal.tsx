'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    description: string
    amount: number
    type: 'expense' | 'income' | 'investment'
    date?: string
  }
  onSuccess: () => void
}

export default function EditValueModal({ isOpen, onClose, item, onSuccess }: Props) {
  const [newAmount, setNewAmount] = useState(item.amount.toString())
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido')
      setLoading(false)
      return
    }

    try {
      let error: any = null
      
      // Verificar se é uma ocorrência virtual de recorrência
      const isVirtualRecurrence = item.id.startsWith('recurring-')
      
      if (item.type === 'expense') {
        if (isVirtualRecurrence) {
          // Se é uma ocorrência virtual, criar uma nova despesa real
          // Extrair o ID da despesa pai e a data
          const parts = item.id.split('-')
          const parentId = parts[1]
          const occurrenceDate = parts[2]
          
          // Buscar a despesa pai para copiar os dados
          const { data: parentExpense, error: fetchError } = await (supabase as any)
            .from('expenses')
            .select('*')
            .eq('id', parentId)
            .single()
          
          if (fetchError) {
            throw new Error('Erro ao buscar despesa pai: ' + fetchError.message)
          }
          
          // Criar uma nova despesa com o valor editado
          const result = await (supabase as any)
            .from('expenses')
            .insert({
              user_id: parentExpense.user_id,
              category_id: parentExpense.category_id,
              member_id: parentExpense.member_id,
              amount: amount,
              description: parentExpense.description,
              expense_date: occurrenceDate,
              payment_method: parentExpense.payment_method,
              is_recurring: false, // Esta ocorrência específica não é recorrente
              is_paid: true, // Marcar como paga
              is_credit_card: false,
              is_installment: false,
              parent_expense_id: parentId // Referência à despesa pai
            })
          
          error = result.error
        } else {
          // Se é uma despesa real, atualizar normalmente
          const result = await (supabase as any)
            .from('expenses')
            .update({ amount })
            .eq('id', item.id)
          error = result.error
        }
      } else if (item.type === 'income') {
        if (isVirtualRecurrence) {
          // Se é uma ocorrência virtual, criar uma nova receita real
          const parts = item.id.split('-')
          const parentId = parts[1]
          const occurrenceDate = parts[2]
          
          // Buscar a receita pai para copiar os dados
          const { data: parentIncome, error: fetchError } = await (supabase as any)
            .from('incomes')
            .select('*')
            .eq('id', parentId)
            .single()
          
          if (fetchError) {
            throw new Error('Erro ao buscar receita pai: ' + fetchError.message)
          }
          
          // Criar uma nova receita com o valor editado
          const result = await (supabase as any)
            .from('incomes')
            .insert({
              user_id: parentIncome.user_id,
              category_id: parentIncome.category_id,
              member_id: parentIncome.member_id,
              amount: amount,
              description: parentIncome.description,
              income_date: occurrenceDate,
              source: parentIncome.source,
              is_recurring: false, // Esta ocorrência específica não é recorrente
              is_paid: true, // Marcar como paga
              parent_income_id: parentId // Referência à receita pai
            })
          
          error = result.error
        } else {
          // Se é uma receita real, atualizar normalmente
          const result = await (supabase as any)
            .from('incomes')
            .update({ amount })
            .eq('id', item.id)
          error = result.error
        }
      } else if (item.type === 'investment') {
        if (isVirtualRecurrence) {
          // Se é uma ocorrência virtual, criar um novo investimento real
          const parts = item.id.split('-')
          const parentId = parts[1]
          const occurrenceDate = parts[2]
          
          // Buscar o investimento pai para copiar os dados
          const { data: parentInvestment, error: fetchError } = await (supabase as any)
            .from('investments')
            .select('*')
            .eq('id', parentId)
            .single()
          
          if (fetchError) {
            throw new Error('Erro ao buscar investimento pai: ' + fetchError.message)
          }
          
          // Criar um novo investimento com o valor editado
          const result = await (supabase as any)
            .from('investments')
            .insert({
              user_id: parentInvestment.user_id,
              investment_type_id: parentInvestment.investment_type_id,
              member_id: parentInvestment.member_id,
              name: parentInvestment.name,
              institution: parentInvestment.institution,
              initial_amount: amount,
              current_amount: amount,
              investment_date: occurrenceDate,
              expected_return: parentInvestment.expected_return,
              is_recurring: false, // Esta ocorrência específica não é recorrente
              recurrence_frequency: null,
              recurrence_start_date: null,
              recurrence_end_type: null,
              recurrence_end_date: null,
              recurrence_count: null,
              parent_investment_id: parentId // Referência ao investimento pai
            })
          
          error = result.error
        } else {
          // Se é um investimento real, atualizar normalmente
          const result = await (supabase as any)
            .from('investments')
            .update({ 
              initial_amount: amount,
              current_amount: amount
            })
            .eq('id', item.id)
          error = result.error
        }
      }

      if (error) {
        console.error('Erro ao atualizar valor:', error)
        alert('Erro ao atualizar valor: ' + error.message)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Erro ao atualizar valor:', error)
      alert('Erro ao atualizar valor: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = () => {
    switch (item.type) {
      case 'expense': return 'Despesa'
      case 'income': return 'Receita'
      case 'investment': return 'Investimento'
      default: return 'Item'
    }
  }

  const getTypeIcon = () => {
    switch (item.type) {
      case 'expense': return '💸'
      case 'income': return '💰'
      case 'investment': return '📈'
      default: return '💰'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-apple-gray-700 flex items-center gap-2">
              {getTypeIcon()} Editar Valor
            </h3>
            <p className="text-sm text-apple-gray-500 mt-1">
              {getTypeLabel()}: {item.description}
            </p>
            {item.date && (
              <p className="text-xs text-apple-gray-400 mt-1">
                Data: {new Date(item.date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Valor Atual
            </label>
            <div className="p-3 bg-apple-gray-50 rounded-lg">
              <span className="text-lg font-semibold text-apple-gray-700">
                {formatCurrency(item.amount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Novo Valor *
            </label>
            <input
              type="number"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue text-lg font-medium"
              placeholder="0,00"
              required
              autoFocus
            />
            <p className="text-xs text-apple-gray-500 mt-1">
              Preview: {formatCurrency(parseFloat(newAmount) || 0)}
            </p>
          </div>

          <div className="bg-apple-blue/5 p-4 rounded-lg border border-apple-blue/20">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-1">Importante:</p>
                <p>Esta alteração afetará apenas esta ocorrência específica. As próximas ocorrências da recorrência manterão o valor original.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-apple-gray-200 text-apple-gray-600 rounded-lg hover:bg-apple-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-apple-blue text-white px-4 py-3 rounded-lg hover:bg-apple-blue/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                '💾 Salvar Alteração'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}