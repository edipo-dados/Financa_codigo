'use client'

import { useState } from 'react'
import { useCreditCards } from '@/hooks/useCreditCards'
import { CreditCard } from '@/lib/creditCard'

interface Props {
  userId: string
}

export default function CreditCardManager({ userId }: Props) {
  const { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    closing_day: 10,
    due_day: 20,
    credit_limit: '',
    color: '#007aff',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      closing_day: 10,
      due_day: 20,
      credit_limit: '',
      color: '#007aff',
    })
    setShowForm(false)
    setEditingCard(null)
  }

  const handleEdit = (card: CreditCard) => {
    setEditingCard(card)
    setFormData({
      name: card.name,
      closing_day: card.closing_day,
      due_day: card.due_day,
      credit_limit: card.credit_limit ? card.credit_limit.toString() : '',
      color: card.color,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const cardData = {
      user_id: userId,
      name: formData.name,
      closing_day: formData.closing_day,
      due_day: formData.due_day,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      color: formData.color,
    } as any

    if (editingCard) {
      // Editando cartão existente
      await updateCreditCard(editingCard.id, cardData)
    } else {
      // Adicionando novo cartão
      await addCreditCard(cardData)
    }
    
    resetForm()
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
    <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold fintech-text-primary">Cartões de Crédito</h3>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setShowForm(true)
            }
          }}
          className={showForm ? 'btn-secondary text-xs sm:text-sm' : 'btn-primary text-xs sm:text-sm'}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Cartão'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium fintech-text-secondary mb-2">
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
              <label className="block text-sm font-medium fintech-text-secondary mb-2">
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
              <label className="block text-sm font-medium fintech-text-secondary mb-2">
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
              <label className="block text-sm font-medium fintech-text-secondary mb-2">
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

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium fintech-text-secondary mb-2">
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
            {editingCard ? 'Atualizar Cartão' : 'Adicionar Cartão'}
          </button>
        </form>
      )}

      {creditCards.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-fintech-dark-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl sm:text-4xl">💳</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold fintech-text-primary mb-2">Nenhum cartão cadastrado</h3>
          <p className="fintech-text-muted text-sm">Adicione seu primeiro cartão de crédito</p>
        </div>
      ) : (
        <div className="space-y-3">
          {creditCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-white/50 dark:bg-fintech-dark-surface/50 rounded-xl hover:bg-white dark:hover:bg-fintech-dark-surface transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  💳
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium fintech-text-primary truncate">{card.name}</h4>
                  <p className="text-xs sm:text-sm fintech-text-muted">
                    Fechamento: dia {card.closing_day} | Vencimento: dia {card.due_day}
                  </p>
                  {card.credit_limit && (
                    <p className="text-xs fintech-text-muted mt-1">
                      Limite: R$ {card.credit_limit.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(card)}
                  className="text-apple-blue hover:text-apple-blue/80 transition-colors font-medium text-xs sm:text-sm px-2 py-1 rounded touch-target"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="text-red-600 hover:text-red-500 transition-colors font-medium text-xs sm:text-sm px-2 py-1 rounded touch-target"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
