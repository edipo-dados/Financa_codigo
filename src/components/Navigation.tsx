'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const { signOut, user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white dark:bg-fintech-dark-surface border-b border-gray-200 dark:border-fintech-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">EAS</span>
            </div>
            <div>
              <h1 className="text-base font-semibold fintech-text-primary leading-tight">Controle Financeiro</h1>
              <p className="text-xs fintech-text-muted hidden sm:block">EAS Technology</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User info - Desktop */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-fintech-dark-elevated rounded-lg">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm fintech-text-secondary max-w-[160px] truncate">{user?.email}</span>
            </div>
            
            {/* Mobile avatar */}
            <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm fintech-text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
