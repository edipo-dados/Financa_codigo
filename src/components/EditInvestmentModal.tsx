'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { Investment, InvestmentType } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  investment: Investment
  onSuccess: () => void
}

export default function EditInvestmentModal({ isOpen, onClose, investment, onSuccess }: Props) {
  const { members } = useFamilyMembers(investment.user_id)
  const [types, setTypes] = useState<InvestmentType[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: investment.name,
    investment_type_id: investment.investment_type_id || '',
    member_id: investment.member_id || '',
    institution: investment.institution || '',
    initial_amount: investment.initial_amount.toString(),
    current_amount: investment.current_amount.toString(),
    investment_date: investment.investment_date,
    expected_return: investment.expected_return?.toString() || ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchTypes()
      // Reset form data when investment changes
      setFormData({
        name: investment.name,
        investment_type_id: investment.investment_type_id || '',
        member_id: investment.member_id || '',
        institution: investment.institution || '',
        initial_amount: investment.initial_amount.toString(),
        current_amount: investment.current_amount.toString(),
        investment_date: investment.investment_date,
        expected_return: investment.expected_return?.toString() || ''
      })
    }
  }, [isOpen, investment])

  const fetchTypes = async () => {
    const { data } = await supabase
      .from('investment_types')
      .select('*')
      .eq('user_id', investment.user_id)
      .order('name')
    
    if (data) setTypes(data)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const initialAmount = parseFloat(formData.initial_amount)
    const currentAmount = parseFloat(formData.current_amount)
    
    if (isNaN(initialAmount) || initialAmount <= 0) {
      alert('Por favor, insira um valor investido válido')
      setLoading(false)
      return
    }

    if (isNaN(currentAmount) || currentAmount < 0) {
      alert('Por favor, insira um valor atual válido')
      setLoading(false)
      return
    }

    if (!formData.name.trim()) {
      alert('Por favor, insira um nome para o investimento')
      setLoading(false)
      return
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        investment_type_id: formData.investment_type_id || null,
        member_id: formData.member_id || null,
        institution: formData.institution.trim() || null,
        initial_amount: initialAmount,
        current_amount: currentAmount,
        investment_date: formData.investment_date,
        expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null
      }

      const { error } = await (supabase as any)
        .from('investments')
        .update(updateData)
        .eq('id', investment.id)

      if (error) {
        console.error('Erro ao atualizar investimento:', error)
        alert('Erro ao atualizar investimento: ' + error.message)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error)
      alert('Erro ao atualizar investimento')
    } finally {
      setLoading(false)
    }
  }

  const calculateReturn = () => {
    const initial = parseFloat(formData.initial_amount) || 0
    const current = parseFloat(formData.current_amount) || 0
    const returnValue = current - initial
    const returnPercent = initial > 0 ? (returnValue / initial) * 100 : 0
    return { value: returnValue, percent: returnPercent }
  }

  const returns = calculateReturn()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl max-w-2xl w-full mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-apple-gray-700 flex items-center gap-2">
              📈 Editar Investimento
            </h3>
            <p className="text-sm text-apple-gray-500 mt-1">
              Altere as informações do investimento
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
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Nome do Investimento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: Tesouro Selic 2027, Ações PETR4..."
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Tipo de Investimento
              </label>
              <select
                value={formData.investment_type_id}
                onChange={(e) => setFormData({ ...formData, investment_type_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="">Selecione um tipo</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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

            {/* Instituição */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Instituição/Corretora
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: XP Investimentos, Nubank..."
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data de Aplicação *
              </label>
              <input
                type="date"
                value={formData.investment_date}
                onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                required
              />
            </div>

            {/* Valor Investido */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor Investido *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="0,00"
                required
              />
            </div>

            {/* Valor Atual */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor Atual *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="0,00"
                required
              />
            </div>

            {/* Rentabilidade Esperada */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Rentabilidade Esperada (% ao ano)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.expected_return}
                onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: 10.5"
              />
            </div>
          </div>

          {/* Cálculo de Retorno */}
          <div className="bg-gradient-to-r from-apple-gray-50 to-transparent p-4 rounded-lg border border-apple-gray-200">
            <div className="flex items-start gap-3">
              <span className="text-lg">📊</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-2">Retorno Calculado:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-apple-gray-500">Retorno em Valor:</p>
                    <p className={`font-semibold ${returns.value >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                      {returns.value >= 0 ? '+' : ''} R$ {Math.abs(returns.value).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-apple-gray-500">Retorno em %:</p>
                    <p className={`font-semibold ${returns.value >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                      {returns.value >= 0 ? '+' : ''} {returns.percent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Investimento Original */}
          <div className="bg-apple-gray-50 p-4 rounded-lg border border-apple-gray-200">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-2">Informações do investimento:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p><strong>Criado em:</strong> {new Date(investment.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>ID:</strong> {investment.id.slice(0, 8)}...</p>
                  {investment.is_recurring && (
                    <p className="md:col-span-2"><strong>Tipo:</strong> Investimento recorrente</p>
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