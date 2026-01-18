'use client'

import { useState } from 'react'

interface Props {
  onAddExpense?: () => void
  onAddIncome?: () => void
  onAddInvestment?: () => void
}

export default function FloatingActionButton({ onAddExpense, onAddIncome, onAddInvestment }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { 
      label: 'Despesa', 
      icon: '💸', 
      color: 'bg-red-500 hover:bg-red-600', 
      onClick: onAddExpense 
    },
    { 
      label: 'Receita', 
      icon: '💰', 
      color: 'bg-green-500 hover:bg-green-600', 
      onClick: onAddIncome 
    },
    { 
      label: 'Investimento', 
      icon: '📈', 
      color: 'bg-blue-500 hover:bg-blue-600', 
      onClick: onAddInvestment 
    },
  ]

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col gap-3 mb-4">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick?.()
                setIsOpen(false)
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-full text-white font-medium shadow-lg
                transform transition-all duration-200 animate-slide-up
                ${action.color}
              `}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-full 
          shadow-lg hover:shadow-xl transform transition-all duration-200
          flex items-center justify-center touch-target
          ${isOpen ? 'rotate-45 scale-110' : 'hover:scale-105'}
        `}
      >
        <span className="text-2xl font-light">+</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}