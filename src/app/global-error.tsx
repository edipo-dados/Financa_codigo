'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-32 h-32 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl">💥</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Erro crítico</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Ocorreu um erro crítico na aplicação. Por favor, recarregue a página.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Recarregar aplicação
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}