'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { InvestmentType } from '@/types'

interface Props {
  userId: string
}

export default function InvestmentTypeManager({ userId }: Props) {
  const [types, setTypes] = useState<InvestmentType[]>([])
  const [newType, setNewType] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    const { data } = await supabase
      .from('investment_types')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    
    if (data) setTypes(data)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('investment_types')
      .insert({
        user_id: userId,
        name: newType,
      })

    if (!error) {
      setNewType('')
      await fetchTypes()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este tipo de investimento?')) {
      await supabase.from('investment_types').delete().eq('id', id)
      await fetchTypes()
    }
  }

  const typeIcons = ['📊', '💹', '🏢', '💰', '🪙', '📈', '💎', '🏦']

  return (
    <div className="glass-card p-6 rounded-3xl animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-apple-gray-700">Tipos de Investimento</h3>
        <p className="text-sm text-apple-gray-400 mt-1">Classifique seus investimentos</p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="Nome do tipo"
          className="input-field flex-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-6"
        >
          {loading ? '...' : '+ Adicionar'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {types.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-apple-gray-400 text-sm">
            Nenhum tipo cadastrado
          </div>
        ) : (
          types.map((type, index) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 bg-apple-gray-50 rounded-xl hover:bg-apple-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-purple rounded-xl flex items-center justify-center text-xl shadow-apple">
                  {typeIcons[index % typeIcons.length]}
                </div>
                <span className="font-medium text-apple-gray-700">{type.name}</span>
              </div>
              <button
                onClick={() => handleDelete(type.id)}
                className="text-apple-red hover:text-apple-red/80 transition-colors text-sm font-medium px-3 py-1 rounded-lg hover:bg-apple-red/10"
              >
                Excluir
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
