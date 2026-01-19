import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-apple-blue/5 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-32 h-32 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-6xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold text-apple-gray-700 mb-4">Página não encontrada</h1>
        <p className="text-apple-gray-500 mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-xl font-medium hover:bg-apple-blue/90 transition-colors"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
  )
}