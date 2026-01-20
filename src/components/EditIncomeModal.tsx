'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { Income, IncomeCategory } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  income: Income
  onSuccess: () => void
}

export default function EditIncomeModal({ isOpen, onClose, income, onSuccess }: Props) {
  const { members } = useFamilyMembers(income.user_id)
  const [categories, setCategories] = useState<IncomeCategory[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    description: income.description,
    amount: income.amount.toString(),
    income_date: income.income_date,
    category_id: income.category_id || '',
    member_id: income.member_id || '',
    source: income.source || '',
    is_paid: income.is_paid
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      // Reset form data when income changes
      setFormData({
        description: income.description,
        amount: income.amount.toString(),
        income_date: income.income_date,
        category_id: income.category_id || '',
        member_id: income.member_id || '',
        source: income.source || '',
        is_paid: income.is_paid
      })
    }
  }, [isOpen, income])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('income_categories')
      .select('*')
      .eq('user_id', income.user_id)
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
      const updateData = {
        description: formData.description.trim(),
        amount,
        income_date: formData.income_date,
        category_id: formData.category_id || null,
        member_id: formData.member_id || null,
        source: formData.source.trim() || null,
        is_paid: formData.is_paid
      }

      const { error } = await (supabase as any)
        .from('incomes')
        .update(updateData)
        .eq('id', income.id)

      if (error) {
        console.error('Erro ao atualizar receita:', error)
        alert('Erro ao atualizar receita: ' + error.message)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao atualizar receita:', error)
      alert('Erro ao atualizar receita')
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
              💰 Editar Receita
            </h3>
            <p className="text-sm text-apple-gray-500 mt-1">
              Altere as informações da receita
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
                placeholder="Ex: Salário, Freelance, Vendas..."
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
                Data da Receita *
              </label>
              <input
                type="date"
                value={formData.income_date}
                onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
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

            {/* Fonte */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Fonte da Receita
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: Empresa XYZ, Cliente ABC, Loja Online..."
              />
            </div>

            {/* Status de Recebimento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Status de Recebimento
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
                  <span className="text-sm text-apple-gray-700">⏳ A Receber</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: true })}
                    className="w-4 h-4 text-apple-green focus:ring-apple-green"
                  />
                  <span className="text-sm text-apple-gray-700">✓ Recebido</span>
                </label>
              </div>
            </div>
          </div>

          {/* Informações da Receita Original */}
          <div className="bg-apple-gray-50 p-4 rounded-lg border border-apple-gray-200">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-2">Informações da receita:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p><strong>Criada em:</strong> {new Date(income.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>ID:</strong> {income.id.slice(0, 8)}...</p>
                  {income.is_recurring && (
                    <p className="md:col-span-2"><strong>Tipo:</strong> Receita recorrente</p>
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