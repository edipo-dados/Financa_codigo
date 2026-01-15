'use client'

import { useState } from 'react'
import { useCreditCards } from '@/hooks/useCreditCards'

interface Props {
  userId: string
}

export default function CreditCardManager({ userId }: Props) {
  const { creditCards, loading, addCreditCard, deleteCreditCard } = useCreditCards(userId)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    closing_day: 10,
    due_day: 20,
    credit_limit: '',
    color: '#007aff',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await addCreditCard({
      user_id: userId,
      name: formData.name,
      closing_day: formData.closing_day,
      due_day: formData.due_day,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      color: formData.color,
    } as any)
    
    setFormData({
      name: '',
      closing_day: 10,
      due_day: 20,
      credit_limit: '',
      color: '#007aff',
    })
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cartão?')) {
      await deleteCreditCard(id)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>
  }

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-apple-gray-700">Cartões de Crédito</h3>
          <p className="text-sm text-apple-gray-400 mt-1">Gerencie seus cartões</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Cartão'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-apple-gray-50 rounded-xl space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Nome do Cartão *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ex: Nubank, Itaú"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Cor
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Dia de Fechamento *
              </label>
              <input
                type="number"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                max="31"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Dia de Vencimento *
              </label>
              <input
                type="number"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                max="31"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Limite de Crédito (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                className="input-field"
                placeholder="0,00"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Adicionar Cartão
          </button>
        </form>
      )}

      {creditCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💳</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-apple-gray-400 text-sm">Adicione seu primeiro cartão de crédito</p>
        </div>
      ) : (
        <div className="space-y-3">
          {creditCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  💳
                </div>
                <div>
                  <h4 className="font-medium text-apple-gray-700">{card.name}</h4>
                  <p className="text-sm text-apple-gray-500">
                    Fechamento: dia {card.closing_day} | Vencimento: dia {card.due_day}
                  </p>
                  {card.credit_limit && (
                    <p className="text-xs text-apple-gray-400 mt-1">
                      Limite: R$ {card.credit_limit.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(card.id)}
                className="text-apple-red hover:text-apple-red/80 transition-colors font-medium text-sm"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
