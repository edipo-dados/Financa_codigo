'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { Expense, ExpenseCategory } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  expense: Expense
  onSuccess: () => void
}

export default function EditExpenseModal({ isOpen, onClose, expense, onSuccess }: Props) {
  const { members } = useFamilyMembers(expense.user_id)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    description: expense.description,
    amount: expense.amount.toString(),
    expense_date: expense.expense_date,
    category_id: expense.category_id || '',
    member_id: expense.member_id || '',
    is_paid: expense.is_paid
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      // Reset form data when expense changes
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        expense_date: expense.expense_date,
        category_id: expense.category_id || '',
        member_id: expense.member_id || '',
        is_paid: expense.is_paid
      })
    }
  }, [isOpen, expense])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', expense.user_id)
      .order('name')
    
    if (data) setCategories(data)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido')
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      alert('Por favor, insira uma descrição')
      setLoading(false)
      return
    }

    try {
      // Verificar se é uma despesa recorrente virtual (gerada dinamicamente)
      const isVirtualRecurring = expense.id.startsWith('recurring-')
      
      if (isVirtualRecurring) {
        // Para despesas recorrentes virtuais, criar uma nova despesa real
        const newExpense = {
          user_id: expense.user_id,
          description: formData.description.trim(),
          amount,
          expense_date: formData.expense_date,
          category_id: formData.category_id || null,
          member_id: formData.member_id || null,
          is_paid: formData.is_paid,
          payment_method: expense.payment_method || null,
          is_recurring: false, // Não é mais recorrente, é uma ocorrência específica
          is_credit_card: false,
          is_installment: false,
          parent_expense_id: (expense as any).parentRecurringId || null
        }

        const { error } = await (supabase as any)
          .from('expenses')
          .insert(newExpense)

        if (error) {
          console.error('Erro ao criar despesa:', error)
          alert('Erro ao criar despesa: ' + error.message)
        } else {
          alert('✅ Despesa criada com sucesso! Esta é agora uma despesa independente.')
          onSuccess()
          onClose()
        }
      } else if (expense.is_recurring) {
        // Se é uma despesa recorrente REAL, perguntar se quer editar apenas esta ou toda a série
        const choice = confirm(
          'Esta é uma despesa recorrente.\n\n' +
          'Clique em OK para editar APENAS esta ocorrência (recomendado).\n' +
          'Clique em Cancelar para editar TODA a série de recorrências.\n\n' +
          'ATENÇÃO: Editar toda a série afetará todas as ocorrências futuras!'
        )
        
        if (choice) {
          // Editar apenas esta ocorrência - criar uma nova despesa não recorrente
          // Se é uma despesa virtual, usar parentRecurringId
          let parentId = expense.id
          if ((expense as any).parentRecurringId) {
            parentId = (expense as any).parentRecurringId
          } else if (expense.id.startsWith('recurring-')) {
            // Fallback: extrair do ID se não tiver parentRecurringId
            const parts = expense.id.split('-')
            parentId = parts.slice(1, 6).join('-')
          }
          
          const newExpense = {
            user_id: expense.user_id,
            description: formData.description.trim(),
            amount,
            expense_date: formData.expense_date,
            category_id: formData.category_id || null,
            member_id: formData.member_id || null,
            is_paid: formData.is_paid,
            payment_method: expense.payment_method || null,
            is_recurring: false,
            is_credit_card: false,
            is_installment: false,
            parent_expense_id: parentId
          }

          const { error } = await supabase
            .from('expenses')
            .insert(newExpense as any)

          if (error) {
            console.error('Erro ao criar despesa:', error)
            alert('Erro ao criar despesa: ' + error.message)
          } else {
            onSuccess()
            onClose()
          }
          setLoading(false)
          return
        }
        
        // Se escolheu editar toda a série, continua com o update normal
        const updateData = {
          description: formData.description.trim(),
          amount,
          expense_date: formData.expense_date,
          category_id: formData.category_id || null,
          member_id: formData.member_id || null,
          is_paid: formData.is_paid
        }

        const { error } = await (supabase as any)
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id)

        if (error) {
          console.error('Erro ao atualizar despesa:', error)
          alert('Erro ao atualizar despesa: ' + error.message)
        } else {
          onSuccess()
          onClose()
        }
      } else {
        // Para despesas normais, atualizar normalmente
        const updateData = {
          description: formData.description.trim(),
          amount,
          expense_date: formData.expense_date,
          category_id: formData.category_id || null,
          member_id: formData.member_id || null,
          is_paid: formData.is_paid
        }

        const { error } = await (supabase as any)
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id)

        if (error) {
          console.error('Erro ao atualizar despesa:', error)
          alert('Erro ao atualizar despesa: ' + error.message)
        } else {
          onSuccess()
          onClose()
        }
      }
    } catch (error) {
      console.error('Erro ao processar despesa:', error)
      alert('Erro ao processar despesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl max-w-2xl w-full mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-apple-gray-700 flex items-center gap-2">
              💸 Editar Despesa
            </h3>
            <p className="text-sm text-apple-gray-500 mt-1">
              Altere as informações da despesa
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: Supermercado, Combustível..."
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="0,00"
                required
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data da Despesa *
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Membro da Família */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Membro da Família
              </label>
              <select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="">Selecione um membro (opcional)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.relationship && `(${member.relationship})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status de Pagamento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Status de Pagamento
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_paid"
                    checked={!formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: false })}
                    className="w-4 h-4 text-apple-orange focus:ring-apple-orange"
                  />
                  <span className="text-sm text-apple-gray-700">⏳ A Pagar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: true })}
                    className="w-4 h-4 text-apple-green focus:ring-apple-green"
                  />
                  <span className="text-sm text-apple-gray-700">✓ Pago</span>
                </label>
              </div>
            </div>
          </div>

          {/* Informações da Despesa Original */}
          <div className="bg-apple-gray-50 p-4 rounded-lg border border-apple-gray-200">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-2">Informações da despesa:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p><strong>Criada em:</strong> {new Date(expense.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>ID:</strong> {expense.id.slice(0, 8)}...</p>
                  {expense.id.startsWith('recurring-') && (
                    <p className="md:col-span-2 text-orange-600 font-medium">
                      ⚠️ Esta é uma ocorrência de despesa recorrente. Ao salvar, será criada uma despesa independente para este mês.
                    </p>
                  )}
                  {expense.is_recurring && !expense.id.startsWith('recurring-') && (
                    <p className="md:col-span-2"><strong>Tipo:</strong> Despesa recorrente</p>
                  )}
                  {expense.is_credit_card && (
                    <p className="md:col-span-2"><strong>Tipo:</strong> Compra no cartão de crédito</p>
                  )}
                </div>
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
                '💾 Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}