'use client'

import { useState, useEffect } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { supabase } from '@/lib/supabase'
import { IncomeCategory } from '@/types'
import { generateRecurrenceOccurrences, getRecurrenceDescription, validateRecurrenceConfig, RecurrenceFrequency, RecurrenceEndType } from '@/lib/recurrence'
import { parseISO } from 'date-fns'

interface Props {
  userId: string
  onSuccess: () => void
  onRefresh?: () => void
}

export default function IncomeForm({ userId, onSuccess, onRefresh }: Props) {
  const { addIncome } = useIncomes(userId)
  const { members } = useFamilyMembers(userId)
  const [categories, setCategories] = useState<IncomeCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0],
    category_id: '',
    member_id: '',
    source: '',
    is_recurring: false,
    recurrence_frequency: 'monthly' as RecurrenceFrequency,
    recurrence_end_type: 'never' as RecurrenceEndType,
    recurrence_count: '12',
    recurrence_end_date: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('income_categories')
      .select('*')
      .eq('user_id', userId)
    
    if (data) setCategories(data)
  }

  const getPreviewOccurrences = () => {
    if (!formData.is_recurring) return []
    
    const config = {
      startDate: parseISO(formData.income_date),
      frequency: formData.recurrence_frequency,
      endType: formData.recurrence_end_type,
      endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
      occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
    }
    
    const validation = validateRecurrenceConfig(config)
    if (!validation.valid) return []
    
    return generateRecurrenceOccurrences(config, 12)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar recorrência
      if (formData.is_recurring) {
        const config = {
          startDate: parseISO(formData.income_date),
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

      const income = {
        user_id: userId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        income_date: formData.income_date,
        category_id: formData.category_id || null,
        member_id: formData.member_id || null,
        source: formData.source || null,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : null,
        recurrence_start_date: formData.is_recurring ? formData.income_date : null,
        recurrence_end_type: formData.is_recurring ? formData.recurrence_end_type : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
        recurrence_count: formData.is_recurring && formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
        parent_income_id: null,
        is_paid: false,
      }

      console.log('Tentando adicionar receita:', income)

      const { data, error } = await addIncome(income)
      
      if (error) {
        console.error('Erro ao adicionar receita:', error)
        alert(`Erro ao adicionar receita: ${error.message}`)
      } else {
        console.log('Receita adicionada com sucesso:', data)
        // Resetar formulário
        setFormData({
          amount: '',
          description: '',
          income_date: new Date().toISOString().split('T')[0],
          category_id: '',
          source: '',
          is_recurring: false,
          recurrence_frequency: 'monthly',
          recurrence_end_type: 'never',
          recurrence_count: '12',
          recurrence_end_date: '',
        })
        onSuccess()
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
      alert('Erro inesperado ao adicionar receita. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  const previewOccurrences = getPreviewOccurrences()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Valor *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input-field"
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Data Inicial *
          </label>
          <input
            type="date"
            value={formData.income_date}
            onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Descrição *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            placeholder="Ex: Salário de Janeiro"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Categoria
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
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
              Cadastre membros da família em Configurações para organizar melhor suas receitas
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Fonte/Origem
          </label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="input-field"
            placeholder="Ex: Empresa XYZ"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 p-4 bg-apple-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="recurring-income"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="w-5 h-5 text-apple-blue rounded focus:ring-2 focus:ring-apple-blue/30"
          />
          <label htmlFor="recurring-income" className="text-sm font-medium text-apple-gray-700 cursor-pointer">
            Receita recorrente
          </label>
        </div>

        {formData.is_recurring && (
          <div className="md:col-span-2 space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Frequência
              </label>
              <select
                value={formData.recurrence_frequency}
                onChange={(e) => setFormData({ ...formData, recurrence_frequency: e.target.value as any })}
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
                Término da Recorrência
              </label>
              <select
                value={formData.recurrence_end_type}
                onChange={(e) => setFormData({ ...formData, recurrence_end_type: e.target.value as any })}
                className="input-field"
              >
                <option value="never">Sem fim</option>
                <option value="after_occurrences">Após X ocorrências</option>
                <option value="on_date">Até data específica</option>
              </select>
            </div>

            {formData.recurrence_end_type === 'after_occurrences' && (
              <div>
                <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                  Número de Ocorrências
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
                  min={formData.income_date}
                />
              </div>
            )}

            {previewOccurrences.length > 0 && (
              <div className="p-4 bg-apple-blue/5 rounded-xl border border-apple-blue/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-apple-gray-700">
                    Prévia das Próximas Ocorrências
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-apple-blue hover:text-apple-blue/80"
                  >
                    {showPreview ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-xs text-apple-gray-500 mb-2">
                  {getRecurrenceDescription({
                    startDate: parseISO(formData.income_date),
                    frequency: formData.recurrence_frequency,
                    endType: formData.recurrence_end_type,
                    endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
                    occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
                  })}
                </p>
                {showPreview && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {previewOccurrences.slice(0, 12).map((occ, idx) => (
                      <div key={idx} className="text-xs text-apple-gray-600 flex justify-between">
                        <span>{occ.date.toLocaleDateString('pt-BR')}</span>
                        <span className="text-apple-gray-400">{occ.occurrenceNumber}ª ocorrência</span>
                      </div>
                    ))}
                    {previewOccurrences.length > 12 && (
                      <p className="text-xs text-apple-gray-400 italic">
                        ... e mais {previewOccurrences.length - 12} ocorrências
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
          '+ Adicionar Receita'
        )}
      </button>
    </form>
  )
}

