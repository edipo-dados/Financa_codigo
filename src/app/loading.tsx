export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-apple-blue/5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-apple-gray-600 font-medium">Carregando...</p>
      </div>
    </div>
  )
}