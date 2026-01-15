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
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            {/* Logo EAS - usando a imagem fornecida */}
            <img 
              src="/images/eas-logo.png" 
              alt="EAS Technology Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-semibold fintech-text-primary mb-2">
            EAS Technology
          </h1>
          <p className="fintech-text-muted text-sm">
            Gerencie suas finanças com elegância e simplicidade
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
