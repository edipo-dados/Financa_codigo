'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Expense, Income, Investment, RecurrenceFrequency, RecurrenceEndType } from '@/types'
import { validateRecurrenceConfig, getRecurrenceDescription, generateRecurrenceOccurrences } from '@/lib/recurrence'
import { parseISO } from 'date-fns'

interface Props {
  isOpen: boolean
  onClose: () => void
  item: Expense | Income | Investment | null
  type: 'expense' | 'income' | 'investment'
  onSuccess: () => void
}

export default function EditRecurrenceModal({ isOpen, onClose, item, type, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    recurrence_frequency: 'monthly' as RecurrenceFrequency,
    recurrence_end_type: 'never' as RecurrenceEndType,
    recurrence_count: '12',
    recurrence_end_date: '',
  })

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        description: type === 'investment' ? (item as Investment).name : (item as Expense | Income).description,
        recurrence_frequency: item.recurrence_frequency || 'monthly',
        recurrence_end_type: item.recurrence_end_type || 'never',
        recurrence_count: item.recurrence_count?.toString() || '12',
        recurrence_end_date: item.recurrence_end_date || '',
      })
    }
  }, [item, isOpen, type])

  const getPreviewOccurrences = () => {
    if (!item) return []
    
    let startDate: Date
    if (type === 'expense') {
      startDate = parseISO(item.recurrence_start_date || (item as Expense).expense_date)
    } else if (type === 'income') {
      startDate = parseISO(item.recurrence_start_date || (item as Income).income_date)
    } else {
      startDate = parseISO(item.recurrence_start_date || (item as Investment).investment_date)
    }
    
    const config = {
      startDate,
      frequency: formData.recurrence_frequency,
      endType: formData.recurrence_end_type,
      endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
      occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
    }
    
    const validation = validateRecurrenceConfig(config)
    if (!validation.valid) return []
    
    return generateRecurrenceOccurrences(config, 12)
  }

  const handleSave = async () => {
    if (!item) return
    
    setLoading(true)
    
    try {
      // Validar recorrência
      let startDate: Date
      if (type === 'expense') {
        startDate = parseISO(item.recurrence_start_date || (item as Expense).expense_date)
      } else if (type === 'income') {
        startDate = parseISO(item.recurrence_start_date || (item as Income).income_date)
      } else {
        startDate = parseISO(item.recurrence_start_date || (item as Investment).investment_date)
      }
      
      const config = {
        startDate,
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

      // Atualizar recorrência
      try {
        if (type === 'expense') {
          await (supabase as any)
            .from('expenses')
            .update({
              description: formData.description,
              recurrence_frequency: formData.recurrence_frequency,
              recurrence_end_type: formData.recurrence_end_type,
              recurrence_end_date: formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
              recurrence_count: formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
            })
            .eq('id', item.id)
        } else if (type === 'income') {
          await (supabase as any)
            .from('incomes')
            .update({
              description: formData.description,
              recurrence_frequency: formData.recurrence_frequency,
              recurrence_end_type: formData.recurrence_end_type,
              recurrence_end_date: formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
              recurrence_count: formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
            })
            .eq('id', item.id)
        } else {
          await (supabase as any)
            .from('investments')
            .update({
              name: formData.description,
              recurrence_frequency: formData.recurrence_frequency,
              recurrence_end_type: formData.recurrence_end_type,
              recurrence_end_date: formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
              recurrence_count: formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
            })
            .eq('id', item.id)
        }
        
        onSuccess()
        onClose()
      } catch (error: any) {
        console.error('Erro ao atualizar recorrência:', error)
        alert('Erro ao atualizar recorrência: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado ao atualizar recorrência')
    }
    
    setLoading(false)
  }

  const handleDeleteRecurrence = async () => {
    if (!item) return
    
    const itemType = type === 'expense' ? 'gasto' : type === 'income' ? 'receita' : 'investimento'
    const confirmMsg = `Deseja realmente remover a recorrência deste ${itemType}?\n\nIsso não excluirá o item atual, apenas removerá a configuração de recorrência.`
    
    if (!confirm(confirmMsg)) return
    
    setLoading(true)
    
    try {
      // Remover recorrência
      try {
        if (type === 'expense') {
          await (supabase as any)
            .from('expenses')
            .update({
              is_recurring: false,
              recurrence_frequency: null,
              recurrence_start_date: null,
              recurrence_end_type: null,
              recurrence_end_date: null,
              recurrence_count: null,
            })
            .eq('id', item.id)
        } else if (type === 'income') {
          await (supabase as any)
            .from('incomes')
            .update({
              is_recurring: false,
              recurrence_frequency: null,
              recurrence_start_date: null,
              recurrence_end_type: null,
              recurrence_end_date: null,
              recurrence_count: null,
            })
            .eq('id', item.id)
        } else {
          await (supabase as any)
            .from('investments')
            .update({
              is_recurring: false,
              recurrence_frequency: null,
              recurrence_start_date: null,
              recurrence_end_type: null,
              recurrence_end_date: null,
              recurrence_count: null,
            })
            .eq('id', item.id)
        }
        
        onSuccess()
        onClose()
      } catch (error: any) {
        console.error('Erro ao remover recorrência:', error)
        alert('Erro ao remover recorrência: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado ao remover recorrência')
    }
    
    setLoading(false)
  }

  if (!isOpen || !item) return null

  const previewOccurrences = getPreviewOccurrences()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-apple-gray-700">
                Editar Recorrência
              </h3>
              <p className="text-sm text-apple-gray-500 mt-1">
                {type === 'investment' ? (item as Investment).name : (item as Expense | Income).description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-apple-gray-100 flex items-center justify-center hover:bg-apple-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                {type === 'investment' ? 'Nome' : 'Descrição'}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder={type === 'investment' ? 'Nome do investimento' : 'Descrição'}
              />
            </div>

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
                Término da Recorrência
              </label>
              <select
                value={formData.recurrence_end_type}
                onChange={(e) => setFormData({ ...formData, recurrence_end_type: e.target.value as RecurrenceEndType })}
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
                    startDate: (() => {
                      if (type === 'expense') {
                        return parseISO(item.recurrence_start_date || (item as Expense).expense_date)
                      } else if (type === 'income') {
                        return parseISO(item.recurrence_start_date || (item as Income).income_date)
                      } else {
                        return parseISO(item.recurrence_start_date || (item as Investment).investment_date)
                      }
                    })(),
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

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDeleteRecurrence}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-apple-red text-white rounded-xl font-medium hover:bg-apple-red/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Removendo...' : 'Remover Recorrência'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-apple-gray-200 text-apple-gray-700 rounded-xl font-medium hover:bg-apple-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-apple-blue text-white rounded-xl font-medium hover:bg-apple-blue/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}