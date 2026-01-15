'use client'

import { useState, useEffect } from 'react'
import { useInvestments } from '@/hooks/useInvestments'
import { supabase } from '@/lib/supabase'
import { InvestmentType } from '@/types'

interface Props {
  userId: string
  onSuccess: () => void
}

export default function InvestmentForm({ userId, onSuccess }: Props) {
  const { addInvestment } = useInvestments(userId)
  const [types, setTypes] = useState<InvestmentType[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    investment_type_id: '',
    institution: '',
    initial_amount: '',
    investment_date: new Date().toISOString().split('T')[0],
    expected_return: '',
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

    const investment = {
      user_id: userId,
      name: formData.name,
      investment_type_id: formData.investment_type_id || null,
      institution: formData.institution || null,
      initial_amount: parseFloat(formData.initial_amount),
      current_amount: parseFloat(formData.initial_amount),
      investment_date: formData.investment_date,
      expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null,
    }

    const { error } = await addInvestment(investment)
    
    if (!error) {
      onSuccess()
    }
    
    setLoading(false)
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
