'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) setError(error.message)
        else setError('Verifique seu email para confirmar o cadastro')
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8 rounded-3xl animate-scale-in">
      <div className="flex gap-2 mb-8 p-1 bg-apple-gray-100 rounded-xl">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isLogin
              ? 'bg-white text-apple-gray-700 shadow-apple'
              : 'text-apple-gray-400 hover:text-apple-gray-600'
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !isLogin
              ? 'bg-white text-apple-gray-700 shadow-apple'
              : 'text-apple-gray-400 hover:text-apple-gray-600'
          }`}
        >
          Criar Conta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div className="animate-slide-up">
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Seu nome"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className={`text-sm p-4 rounded-xl animate-slide-up ${
            error.includes('Verifique')
              ? 'bg-apple-green/10 text-apple-green border border-apple-green/20'
              : 'bg-apple-red/10 text-apple-red border border-apple-red/20'
          }`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando...
            </span>
          ) : (
            isLogin ? 'Entrar' : 'Criar Conta'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-apple-blue hover:text-apple-blue/80 transition-colors"
        >
          {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
