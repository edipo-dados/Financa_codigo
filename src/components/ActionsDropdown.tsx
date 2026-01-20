'use client'

import { useState, useRef, useEffect } from 'react'

interface Action {
  id: string
  label: string
  icon: string
  color: string
  onClick: () => void
  title?: string
}

interface Props {
  actions: Action[]
}

export default function ActionsDropdown({ actions }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleActionClick = (action: Action) => {
    action.onClick()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1 text-apple-gray-600 hover:text-apple-gray-800 hover:bg-apple-gray-100 rounded-lg transition-colors text-xs font-medium"
        title="Mais ações"
      >
        <span>⚙️</span>
        <span>Ações</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-apple-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] animate-scale-in">
          <div className="py-1">
            {actions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-apple-gray-50 transition-colors flex items-center gap-2 ${action.color}`}
                title={action.title}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}