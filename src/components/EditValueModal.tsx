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
      
      if (item.type === 'expense') {
        const result = await (supabase as any)
          .from('expenses')
          .update({ amount })
          .eq('id', item.id)
        error = result.error
      } else if (item.type === 'income') {
        const result = await (supabase as any)
          .from('incomes')
          .update({ amount })
          .eq('id', item.id)
        error = result.error
      } else if (item.type === 'investment') {
        const result = await (supabase as any)
          .from('investments')
          .update({ 
            initial_amount: amount,
            current_amount: amount
          })
          .eq('id', item.id)
        error = result.error
      }

      if (error) {
        console.error('Erro ao atualizar valor:', error)
        alert('Erro ao atualizar valor: ' + error.message)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao atualizar valor:', error)
      alert('Erro ao atualizar valor')
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