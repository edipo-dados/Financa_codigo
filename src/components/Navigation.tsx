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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              {/* Logo EAS - Mobile Optimized */}
              <svg width="40" height="40" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="sm:w-12 sm:h-12">
                <defs>
                  <linearGradient id="logoGradNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#38bdf8', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                
                <circle cx="40" cy="40" r="35" fill="none" stroke="url(#logoGradNav)" strokeWidth="2" opacity="0.4"/>
                <circle cx="40" cy="40" r="30" fill="url(#logoGradNav)" opacity="0.12"/>
                
                <g fill="url(#logoGradNav)" fontFamily="Arial, sans-serif" fontWeight="700">
                  <text x="22" y="50" fontSize="28">E</text>
                  <text x="37" y="50" fontSize="28">A</text>
                  <text x="52" y="50" fontSize="28">S</text>
                </g>
                
                <line x1="20" y1="55" x2="60" y2="55" stroke="url(#logoGradNav)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold fintech-text-primary">Controle Financeiro</h1>
              <p className="text-xs fintech-text-muted hidden sm:block">Bem-vindo de volta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl fintech-border border">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-fintech-dark-accent to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-fintech-dark">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm fintech-text-secondary max-w-[120px] sm:max-w-none truncate">{user?.email}</span>
            </div>
            
            {/* Mobile user avatar */}
            <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-fintech-dark-accent to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-fintech-dark">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm fintech-text-muted hover:text-fintech-dark-danger dark:hover:text-fintech-dark-danger transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-fintech-dark-elevated"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
