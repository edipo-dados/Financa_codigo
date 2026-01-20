'use client'

import { useState, useEffect } from 'react'
import { useInvestments } from '@/hooks/useInvestments'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { supabase } from '@/lib/supabase'
import { InvestmentType, RecurrenceFrequency, RecurrenceEndType } from '@/types'
import { validateRecurrenceConfig, getRecurrenceDescription } from '@/lib/recurrence'
import { parseISO } from 'date-fns'

interface Props {
  userId: string
  onSuccess: () => void
  onRefresh?: () => void
}

export default function InvestmentForm({ userId, onSuccess, onRefresh }: Props) {
  const { addInvestment } = useInvestments(userId)
  const { members } = useFamilyMembers(userId)
  const [types, setTypes] = useState<InvestmentType[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    investment_type_id: '',
    institution: '',
    initial_amount: '',
    investment_date: new Date().toISOString().split('T')[0],
    expected_return: '',
    member_id: '',
    is_recurring: false,
    recurrence_frequency: 'monthly' as RecurrenceFrequency,
    recurrence_end_type: 'never' as RecurrenceEndType,
    recurrence_count: '12',
    recurrence_end_date: '',
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    const { data } = await supabase
      .from('investment_types')
      .select('*')
      .eq('user_id', userId)
    
    if (data) setTypes(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar recorrência se habilitada
    if (formData.is_recurring) {
      const config = {
        startDate: parseISO(formData.investment_date),
        frequency: formData.recurrence_frequency,
        endType: formData.recurrence_end_type,
        endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
        occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
      }
      
      const validation = validateRecurrenceConfig(config)
      if (!validation.valid) {
        alert(validation.error)
        setLoading(false)
        return
      }
    }

    const investment = {
      user_id: userId,
      name: formData.name,
      investment_type_id: formData.investment_type_id || null,
      member_id: formData.member_id || null,
      institution: formData.institution || null,
      initial_amount: parseFloat(formData.initial_amount),
      current_amount: parseFloat(formData.initial_amount),
      investment_date: formData.investment_date,
      expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null,
      is_recurring: formData.is_recurring,
      recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : null,
      recurrence_start_date: formData.is_recurring ? formData.investment_date : null,
      recurrence_end_type: formData.is_recurring ? formData.recurrence_end_type : null,
      recurrence_end_date: formData.is_recurring && formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
      recurrence_count: formData.is_recurring && formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
      parent_investment_id: null,
    }

    const { error } = await addInvestment(investment)
    
    if (!error) {
      onSuccess()
      if (onRefresh) onRefresh()
    }
    
    setLoading(false)
  }

  const getRecurrencePreview = () => {
    if (!formData.is_recurring) return null
    
    try {
      const config = {
        startDate: parseISO(formData.investment_date),
        frequency: formData.recurrence_frequency,
        endType: formData.recurrence_end_type,
        endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
        occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
      }
      
      return getRecurrenceDescription(config)
    } catch {
      return 'Configuração inválida'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Nome do Investimento *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="Ex: Tesouro Selic 2027"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Tipo de Investimento
          </label>
          <select
            value={formData.investment_type_id}
            onChange={(e) => setFormData({ ...formData, investment_type_id: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione um tipo</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Membro da Família
          </label>
          <select
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione um membro (opcional)</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                <span style={{ color: member.color }}>●</span> {member.name}
                {member.relationship && ` (${member.relationship})`}
              </option>
            ))}
          </select>
          {members.length === 0 && (
            <p className="text-xs text-apple-gray-400 mt-1">
              Cadastre membros da família em Configurações para organizar melhor seus investimentos
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Instituição/Corretora
          </label>
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="input-field"
            placeholder="Ex: XP Investimentos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Valor Investido *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.initial_amount}
            onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
            className="input-field"
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Data de Aplicação *
          </label>
          <input
            type="date"
            value={formData.investment_date}
            onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Rentabilidade Esperada (% ao ano)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.expected_return}
            onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
            className="input-field"
            placeholder="Ex: 10.5"
          />
        </div>

        {/* Seção de Recorrência */}
        <div className="md:col-span-2 p-4 bg-apple-blue/5 rounded-xl border border-apple-blue/20">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="w-4 h-4 text-apple-blue rounded focus:ring-apple-blue"
            />
            <label htmlFor="is_recurring" className="text-sm font-medium text-apple-gray-700">
              💰 Investimento Recorrente (Ex: aportes mensais)
            </label>
          </div>

          {formData.is_recurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Frequência
                  </label>
                  <select
                    value={formData.recurrence_frequency}
                    onChange={(e) => setFormData({ ...formData, recurrence_frequency: e.target.value as RecurrenceFrequency })}
                    className="input-field"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Término
                  </label>
                  <select
                    value={formData.recurrence_end_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_type: e.target.value as RecurrenceEndType })}
                    className="input-field"
                  >
                    <option value="never">Sem fim</option>
                    <option value="after_occurrences">Após X aportes</option>
                    <option value="on_date">Até data específica</option>
                  </select>
                </div>
              </div>

              {formData.recurrence_end_type === 'after_occurrences' && (
                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Número de Aportes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurrence_count}
                    onChange={(e) => setFormData({ ...formData, recurrence_count: e.target.value })}
                    className="input-field"
                    placeholder="Ex: 12"
                  />
                </div>
              )}

              {formData.recurrence_end_type === 'on_date' && (
                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              )}

              <div className="p-3 bg-white rounded-lg border border-apple-gray-200">
                <p className="text-sm text-apple-gray-600">
                  <strong>Resumo:</strong> {getRecurrencePreview()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Salvando...
          </span>
        ) : (
          '+ Adicionar Investimento'
        )}
      </button>
    </form>
  )
}
