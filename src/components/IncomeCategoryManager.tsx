'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { IncomeCategory } from '@/types'

interface Props {
  userId: string
}

export default function IncomeCategoryManager({ userId }: Props) {
  const [categories, setCategories] = useState<IncomeCategory[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', color: '#34c759' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('income_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    
    if (data) setCategories(data)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('income_categories')
      .insert({
        user_id: userId,
        name: newCategory.name,
        color: newCategory.color,
      })

    if (!error) {
      setNewCategory({ name: '', color: '#34c759' })
      await fetchCategories()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      await supabase.from('income_categories').delete().eq('id', id)
      await fetchCategories()
    }
  }

  const colorOptions = [
    { name: 'Verde', value: '#34c759' },
    { name: 'Azul', value: '#007aff' },
    { name: 'Roxo', value: '#af52de' },
    { name: 'Laranja', value: '#ff9500' },
    { name: 'Amarelo', value: '#ffcc00' },
    { name: 'Rosa', value: '#ff2d55' },
    { name: 'Ciano', value: '#5ac8fa' },
    { name: 'Cinza', value: '#8e8e93' },
  ]

  return (
    <div className="glass-card p-6 rounded-3xl animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-apple-gray-700">Categorias de Receitas</h3>
        <p className="text-sm text-apple-gray-400 mt-1">Organize suas entradas por categoria</p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Nome da categoria"
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
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setNewCategory({ ...newCategory, color: color.value })}
              className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                newCategory.color === color.value
                  ? 'ring-2 ring-offset-2 ring-apple-blue scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </form>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-apple-gray-400 text-sm">
            Nenhuma categoria cadastrada
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-apple-gray-50 rounded-xl hover:bg-apple-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl shadow-apple"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-apple-gray-700">{category.name}</span>
              </div>
              <button
                onClick={() => handleDelete(category.id)}
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
