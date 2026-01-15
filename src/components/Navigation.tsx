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
    <nav className="fintech-card border-b fintech-border sticky top-0 z-50 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Logo EAS - usando a imagem fornecida */}
              <img 
                src="/images/eas-logo.png" 
                alt="EAS Technology Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback para SVG se a imagem não carregar
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold fintech-text-primary">EAS Technology</h1>
              <p className="text-xs fintech-text-muted">Bem-vindo de volta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl fintech-border border">
              <div className="w-8 h-8 bg-gradient-to-br from-fintech-dark-accent to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-fintech-dark">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm fintech-text-secondary">{user?.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm fintech-text-muted hover:text-fintech-dark-danger dark:hover:text-fintech-dark-danger transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-fintech-dark-elevated"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
