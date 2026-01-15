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
    <nav className="glass-card border-b border-apple-gray-200/50 sticky top-0 z-50 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-purple rounded-xl flex items-center justify-center shadow-apple">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-apple-gray-700">Controle Financeiro</h1>
              <p className="text-xs text-apple-gray-400">Bem-vindo de volta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-apple-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-purple rounded-lg flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-apple-gray-600">{user?.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-apple-gray-600 hover:text-apple-red transition-colors rounded-xl hover:bg-apple-gray-50"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
