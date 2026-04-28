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
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-fintech-dark-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center justify-center mb-6">
            {/* Logo EAS */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-bold text-2xl tracking-tight">EAS</span>
            </div>
            <div>
              <div className="text-xs fintech-text-muted font-semibold tracking-[0.2em] uppercase">Technology</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold fintech-text-primary mb-1">
            Controle Financeiro
          </h1>
          <p className="text-sm fintech-text-muted">Gerencie suas finanças de forma inteligente</p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
