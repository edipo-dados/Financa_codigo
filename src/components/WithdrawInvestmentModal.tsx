'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Investment } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  investment: Investment
  userId: string
  onSuccess: () => void
}

export default function WithdrawInvestmentModal({ isOpen, onClose, investment, userId, onSuccess }: Props) {
  const [amount, setAmount] = useState('')
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [incomeCategoryId, setIncomeCategoryId] = useState<string | null>(null)

  // Buscar ou criar categoria "Retirada de Investimento" nas categorias de receita
  useEffect(() => {
    if (!isOpen) return

    const fetchOrCreateCategory = async () => {
      // Buscar categoria existente
      const { data: existing } = await supabase
        .from('income_categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', 'Retirada de Investimento')
        .maybeSingle() as any

      if (existing?.id) {
        setIncomeCategoryId(existing.id)
        return
      }

      // Criar categoria se não existir
      const { data: created } = await supabase
        .from('income_categories')
        .insert({
          user_id: userId,
          name: 'Retirada de Investimento',
          color: '#10b981'
        })
        .select('id')
        .single() as any

      if (created?.id) {
        setIncomeCategoryId(created.id)
      }
    }

    fetchOrCreateCategory()
  }, [isOpen, userId])

  const maxAmount = Number(investment.current_amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const withdrawAmount = parseFloat(amount)

    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Informe um valor válido para retirada.')
      return
    }

    if (withdrawAmount > maxAmount) {
      setError(`Valor máximo disponível: ${formatCurrency(maxAmount)}`)
      return
    }

    setLoading(true)

    try {
      // 1. Registrar a transação de retirada no investimento
      const { error: txError } = await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment.id,
          transaction_type: 'withdrawal',
          amount: withdrawAmount,
          transaction_date: withdrawDate,
          description: notes || `Retirada de ${investment.name}`
        })

      if (txError) throw txError

      // 2. Atualizar o current_amount do investimento
      const newAmount = maxAmount - withdrawAmount
      const { error: updateError } = await supabase
        .from('investments')
        .update({
          current_amount: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', investment.id)

      if (updateError) throw updateError

      // 3. Criar receita com o valor retirado
      const { error: incomeError } = await supabase
        .from('incomes')
        .insert({
          user_id: userId,
          category_id: incomeCategoryId,
          member_id: investment.member_id || null,
          amount: withdrawAmount,
          description: `Retirada de investimento: ${investment.name}`,
          income_date: withdrawDate,
          is_recurring: false,
          is_paid: true // Já está disponível no saldo
        })

      if (incomeError) throw incomeError

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao realizar retirada:', err)
      setError(err.message || 'Erro ao processar retirada. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-fintech-dark-card rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold fintech-text-primary">💸 Retirar Investimento</h2>
            <p className="text-sm fintech-text-muted mt-1">{investment.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 fintech-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Saldo disponível */}
        <div className="mx-6 mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Saldo disponível para retirada</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(maxAmount)}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium fintech-text-secondary mb-2">
              Valor a Retirar *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium fintech-text-muted">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            {/* Botão retirar tudo */}
            <button
              type="button"
              onClick={() => setAmount(maxAmount.toString())}
              className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Retirar tudo ({formatCurrency(maxAmount)})
            </button>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium fintech-text-secondary mb-2">
              Data da Retirada *
            </label>
            <input
              type="date"
              value={withdrawDate}
              onChange={e => setWithdrawDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium fintech-text-secondary mb-2">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Resgate para emergência"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 O valor retirado será lançado automaticamente como uma <strong>receita</strong> na categoria <strong>"Retirada de Investimento"</strong>, adicionando ao seu saldo disponível.
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl fintech-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : '💸 Confirmar Retirada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
