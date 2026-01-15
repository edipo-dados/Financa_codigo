'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  title: string
  currentValue: number
  storageKey: string
  icon: string
  color: 'red' | 'blue' | 'green' | 'orange'
}

export default function ConfigurableKPI({ title, currentValue, storageKey, icon, color }: Props) {
  const [limit, setLimit] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [tempLimit, setTempLimit] = useState('')

  useEffect(() => {
    // Carregar limite do localStorage
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setLimit(parseFloat(saved))
    }
  }, [storageKey])

  const handleSave = () => {
    const newLimit = parseFloat(tempLimit)
    if (!isNaN(newLimit) && newLimit > 0) {
      setLimit(newLimit)
      localStorage.setItem(storageKey, newLimit.toString())
      setIsEditing(false)
      setTempLimit('')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTempLimit('')
  }

  const percentage = limit > 0 ? (currentValue / limit) * 100 : 0
  const isOverLimit = percentage > 100
  const isNearLimit = percentage > 80 && percentage <= 100

  const colorClasses = {
    red: 'from-apple-red/10 to-apple-red/5',
    blue: 'from-apple-blue/10 to-apple-blue/5',
    green: 'from-apple-green/10 to-apple-green/5',
    orange: 'from-apple-orange/10 to-apple-orange/5',
  }

  const textColorClasses = {
    red: 'text-apple-red',
    blue: 'text-apple-blue',
    green: 'text-apple-green',
    orange: 'text-apple-orange',
  }

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-apple`}>
          {icon}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-apple-gray-400 hover:text-apple-blue transition-colors"
          title="Configurar limite"
        >
          ⚙️ Configurar
        </button>
      </div>

      <h3 className="text-sm text-apple-gray-500 mb-2">{title}</h3>
      
      <div className="space-y-3">
        <div>
          <p className={`text-2xl font-semibold ${textColorClasses[color]}`}>
            {formatCurrency(currentValue)}
          </p>
          {limit > 0 && (
            <p className="text-xs text-apple-gray-400 mt-1">
              Limite: {formatCurrency(limit)}
            </p>
          )}
        </div>

        {limit > 0 && (
          <div>
            {/* Barra de progresso */}
            <div className="w-full bg-apple-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isOverLimit
                    ? 'bg-apple-red'
                    : isNearLimit
                    ? 'bg-apple-orange'
                    : 'bg-apple-green'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            {/* Status */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-apple-gray-500">
                {percentage.toFixed(1)}% utilizado
              </span>
              {isOverLimit && (
                <span className="text-xs text-apple-red font-medium">
                  ⚠️ Acima do limite!
                </span>
              )}
              {isNearLimit && !isOverLimit && (
                <span className="text-xs text-apple-orange font-medium">
                  ⚠️ Próximo do limite
                </span>
              )}
            </div>
          </div>
        )}

        {!limit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-apple-blue hover:text-apple-blue/80 transition-colors"
          >
            + Definir limite
          </button>
        )}
      </div>

      {/* Modal de edição */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-6 rounded-3xl max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-apple-gray-700 mb-4">
              Configurar Limite
            </h3>
            <p className="text-sm text-apple-gray-500 mb-4">
              Defina um limite mensal para {title.toLowerCase()}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor do Limite (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                className="input-field"
                placeholder="Ex: 5000.00"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
