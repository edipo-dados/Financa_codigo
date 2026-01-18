'use client'

import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function MobileCard({ children, className = '', padding = 'md', onClick }: Props) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div 
      className={`
        fintech-card 
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        transition-all duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}