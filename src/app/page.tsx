'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthForm from '@/components/AuthForm'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-apple-blue dark:border-fintech-dark-accent border-t-transparent rounded-full animate-spin" />
          <p className="fintech-text-muted text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-apple-blue/5 dark:bg-fintech-dark-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-apple-purple/5 dark:bg-fintech-dark-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center justify-center mb-6">
            {/* Logo EAS - Opção 2 Minimalista Elegante */}
            <svg width="120" height="120" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#38bdf8', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              
              {/* Círculo externo */}
              <circle cx="40" cy="40" r="35" fill="none" stroke="url(#logoGrad)" strokeWidth="2" opacity="0.4"/>
              <circle cx="40" cy="40" r="30" fill="url(#logoGrad)" opacity="0.12"/>
              
              {/* Letras EAS ultra clean */}
              <g fill="url(#logoGrad)" fontFamily="Arial, sans-serif" fontWeight="700">
                <text x="22" y="50" fontSize="28">E</text>
                <text x="37" y="50" fontSize="28">A</text>
                <text x="52" y="50" fontSize="28">S</text>
              </g>
              
              {/* Linha decorativa */}
              <line x1="20" y1="55" x2="60" y2="55" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="mt-4">
              <div className="text-sm fintech-text-muted font-semibold tracking-widest">TECHNOLOGY</div>
            </div>
          </div>
          <h1 className="text-4xl font-semibold fintech-text-primary mb-2">
            Controle Financeiro
          </h1>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
