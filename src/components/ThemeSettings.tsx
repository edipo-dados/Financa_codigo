'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fintech-card-premium p-8 rounded-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-fintech-dark-accent to-indigo-600 rounded-2xl flex items-center justify-center shadow-fintech-dark dark:shadow-fintech-glow">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold fintech-text-primary">
            🎨 Aparência
          </h2>
          <p className="text-sm fintech-text-secondary mt-1">
            Personalize o tema da aplicação para sua preferência
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold fintech-text-primary mb-4">
            Escolha seu tema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tema Claro */}
            <button
              onClick={() => setTheme('light')}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                theme === 'light'
                  ? 'border-fintech-dark-accent bg-blue-50 dark:bg-fintech-dark-accent/10 shadow-fintech-glow'
                  : 'border-gray-200 dark:border-fintech-dark-border hover:border-gray-300 dark:hover:border-fintech-dark-accent/50'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Preview do tema claro - mais sofisticado */}
                <div className="w-20 h-14 bg-gradient-to-br from-white to-blue-50 rounded-xl border border-gray-200 shadow-lg overflow-hidden relative">
                  <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-500 border-b border-gray-200"></div>
                  <div className="p-2 space-y-1.5">
                    <div className="h-1.5 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-1 bg-blue-500 rounded w-1/2"></div>
                    <div className="h-1 bg-gray-400 rounded w-2/3"></div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="text-center">
                  <span className="text-lg font-semibold fintech-text-primary">
                    ☀️ Tema Claro
                  </span>
                  <p className="text-sm fintech-text-muted mt-1">
                    Interface limpa e profissional
                  </p>
                  <p className="text-xs fintech-text-muted mt-1">
                    Ideal para uso diurno
                  </p>
                </div>
                
                {theme === 'light' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-4 h-4 bg-fintech-dark-accent rounded-full flex items-center justify-center shadow-fintech-glow">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Tema Escuro */}
            <button
              onClick={() => setTheme('dark')}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                theme === 'dark'
                  ? 'border-fintech-dark-accent bg-blue-50 dark:bg-fintech-dark-accent/10 shadow-fintech-glow'
                  : 'border-gray-200 dark:border-fintech-dark-border hover:border-gray-300 dark:hover:border-fintech-dark-accent/50'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Preview do tema escuro - estilo fintech */}
                <div className="w-20 h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden relative">
                  <div className="h-4 bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-slate-600"></div>
                  <div className="p-2 space-y-1.5">
                    <div className="h-1.5 bg-white rounded w-3/4"></div>
                    <div className="h-1 bg-blue-400 rounded w-1/2"></div>
                    <div className="h-1 bg-slate-400 rounded w-2/3"></div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                </div>
                
                <div className="text-center">
                  <span className="text-lg font-semibold fintech-text-primary">
                    🌙 Tema Escuro
                  </span>
                  <p className="text-sm fintech-text-muted mt-1">
                    Interface premium e moderna
                  </p>
                  <p className="text-xs fintech-text-muted mt-1">
                    Perfeito para uso noturno
                  </p>
                </div>
                
                {theme === 'dark' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-4 h-4 bg-fintech-dark-accent rounded-full flex items-center justify-center shadow-fintech-glow">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Informações profissionais */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-fintech-dark-elevated dark:to-fintech-dark-surface rounded-2xl fintech-border border">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 text-fintech-dark-accent mt-0.5 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-semibold fintech-text-primary mb-2">
                💡 Sobre os temas
              </h4>
              <ul className="text-sm fintech-text-secondary space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-fintech-dark-success rounded-full"></div>
                  Sua preferência é salva automaticamente
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-fintech-dark-success rounded-full"></div>
                  Tema escuro reduz fadiga visual e economiza bateria
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-fintech-dark-success rounded-full"></div>
                  Design otimizado para profissionais financeiros
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-fintech-dark-success rounded-full"></div>
                  Sincronizado em todos os seus dispositivos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}