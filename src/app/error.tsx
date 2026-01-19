'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-apple-red/5 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-32 h-32 bg-apple-red/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-6xl">⚠️</span>
        </div>
        <h1 className="text-4xl font-bold text-apple-gray-700 mb-4">Algo deu errado</h1>
        <p className="text-apple-gray-500 mb-8 max-w-md mx-auto">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-apple-blue text-white rounded-xl font-medium hover:bg-apple-blue/90 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-apple-gray-200 text-apple-gray-700 rounded-xl font-medium hover:bg-apple-gray-300 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  )
}