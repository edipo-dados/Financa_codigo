'use client'

import { useState } from 'react'
import { downloadManualPDF } from '@/lib/pdfGenerator'

export default function About() {
  const [activeSection, setActiveSection] = useState<'about' | 'features' | 'tech' | 'manual'>('about')

  const sections = [
    { id: 'about', label: 'Sobre', icon: '📱' },
    { id: 'features', label: 'Recursos', icon: '✨' },
    { id: 'tech', label: 'Tecnologia', icon: '⚙️' },
    { id: 'manual', label: 'Manual', icon: '📚' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Sobre a Aplicação</h2>
          <p className="text-sm text-apple-gray-400 mt-1">Conheça mais sobre o sistema</p>
        </div>
      </div>

      {/* Navegação das seções */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeSection === section.id
                ? 'bg-apple-blue text-white shadow-lg'
                : 'bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200'
            }`}
          >
            <span>{section.icon}</span>
            <span className="text-sm">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das seções */}
      <div className="glass-card p-6 rounded-3xl">
        {activeSection === 'about' && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-apple-blue to-apple-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-apple-gray-700 mb-2">Controle Financeiro Pessoal</h3>
              <p className="text-apple-gray-500 text-lg">Versão 1.0.0</p>
            </div>

            <div className="prose prose-apple max-w-none">
              <p className="text-apple-gray-600 leading-relaxed">
                Uma aplicação web moderna e intuitiva para gerenciar suas finanças pessoais de forma completa e organizada. 
                Desenvolvida com foco na experiência do usuário, oferece controle total sobre receitas, despesas, 
                investimentos e cartões de crédito em uma interface responsiva e elegante.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-apple-blue/5 p-4 rounded-xl border border-apple-blue/20">
                  <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                    <span>🎯</span> Objetivo
                  </h4>
                  <p className="text-sm text-apple-gray-600">
                    Simplificar o controle financeiro pessoal com uma ferramenta moderna, 
                    intuitiva e completa que funciona perfeitamente em qualquer dispositivo.
                  </p>
                </div>

                <div className="bg-apple-green/5 p-4 rounded-xl border border-apple-green/20">
                  <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                    <span>🚀</span> Missão
                  </h4>
                  <p className="text-sm text-apple-gray-600">
                    Empoderar pessoas a tomar decisões financeiras inteligentes através 
                    de dados organizados, análises claras e projeções precisas.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-gray-50 to-transparent p-6 rounded-xl">
              <h4 className="font-semibold text-apple-gray-700 mb-3">📊 Estatísticas da Aplicação</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-blue">10+</div>
                  <div className="text-xs text-apple-gray-500">Widgets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-green">7</div>
                  <div className="text-xs text-apple-gray-500">Seções</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-purple">100%</div>
                  <div className="text-xs text-apple-gray-500">Responsivo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-orange">⚡</div>
                  <div className="text-xs text-apple-gray-500">Tempo Real</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-apple-gray-700 mb-4">✨ Principais Recursos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📊</span> Dashboard Configurável
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Widgets personalizáveis com drag & drop, 4 tamanhos diferentes e controle total sobre a visualização.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💰</span> Gestão de Receitas
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Controle completo de entradas financeiras com categorização, recorrência e acompanhamento de recebimentos.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💸</span> Controle de Despesas
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Organização detalhada de gastos com múltiplas formas de pagamento e controle de despesas recorrentes.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📈</span> Acompanhamento de Investimentos
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Monitore seu patrimônio com controle de rentabilidade, tipos personalizáveis e análise de performance.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💳</span> Gestão de Cartões
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Controle inteligente de compras parceladas com cálculo automático de datas e gestão de faturas.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>🔮</span> Projeções Futuras
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Visualize lançamentos futuros baseados em recorrências e planeje seu fluxo de caixa.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📱</span> Mobile First
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Interface otimizada para dispositivos móveis com navegação intuitiva e gestos touch.
                </p>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>⚡</span> Tempo Real
                </h4>
                <p className="text-sm text-apple-gray-600">
                  Atualizações instantâneas sem recarregar página, dados sempre sincronizados e experiência fluida.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-blue/5 to-apple-purple/5 p-6 rounded-xl border border-apple-blue/20">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>🎨</span> Design e Experiência
              </h4>
              <ul className="space-y-2 text-sm text-apple-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-blue rounded-full"></span>
                  Interface moderna inspirada no design da Apple
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-green rounded-full"></span>
                  Animações suaves e transições elegantes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-purple rounded-full"></span>
                  Cores personalizáveis e temas adaptativos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-orange rounded-full"></span>
                  Feedback visual imediato para todas as ações
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'tech' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-apple-gray-700 mb-4">⚙️ Tecnologias Utilizadas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                  <span>🚀</span> Frontend
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Next.js 14</span>
                    <span className="text-xs bg-apple-blue/10 text-apple-blue px-2 py-1 rounded">Framework React</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">TypeScript</span>
                    <span className="text-xs bg-apple-green/10 text-apple-green px-2 py-1 rounded">Type Safety</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Tailwind CSS</span>
                    <span className="text-xs bg-apple-purple/10 text-apple-purple px-2 py-1 rounded">Styling</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Recharts</span>
                    <span className="text-xs bg-apple-orange/10 text-apple-orange px-2 py-1 rounded">Gráficos</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                  <span>🗄️</span> Backend & Database
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Supabase</span>
                    <span className="text-xs bg-apple-blue/10 text-apple-blue px-2 py-1 rounded">Backend as a Service</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">PostgreSQL</span>
                    <span className="text-xs bg-apple-green/10 text-apple-green px-2 py-1 rounded">Database</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Row Level Security</span>
                    <span className="text-xs bg-apple-purple/10 text-apple-purple px-2 py-1 rounded">Segurança</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                    <span className="font-medium text-apple-gray-700">Real-time</span>
                    <span className="text-xs bg-apple-orange/10 text-apple-orange px-2 py-1 rounded">Sync</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-gray-50 to-transparent p-6 rounded-xl">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>🏗️</span> Arquitetura
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-lg border border-apple-gray-200">
                  <div className="text-2xl mb-2">📱</div>
                  <h5 className="font-medium text-apple-gray-700 mb-1">Client-Side</h5>
                  <p className="text-xs text-apple-gray-500">React Hooks, Context API, Local Storage</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg border border-apple-gray-200">
                  <div className="text-2xl mb-2">🔄</div>
                  <h5 className="font-medium text-apple-gray-700 mb-1">API Layer</h5>
                  <p className="text-xs text-apple-gray-500">Supabase Client, Real-time Subscriptions</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg border border-apple-gray-200">
                  <div className="text-2xl mb-2">🗄️</div>
                  <h5 className="font-medium text-apple-gray-700 mb-1">Database</h5>
                  <p className="text-xs text-apple-gray-500">PostgreSQL, RLS, Triggers</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-blue/5 to-apple-green/5 p-6 rounded-xl border border-apple-blue/20">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>🔧</span> Funcionalidades Técnicas
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-apple-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-blue rounded-full"></span>
                  Server-Side Rendering (SSR)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-green rounded-full"></span>
                  Progressive Web App (PWA)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-purple rounded-full"></span>
                  Responsive Design
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-orange rounded-full"></span>
                  Real-time Updates
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-red rounded-full"></span>
                  Drag & Drop Interface
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-apple-yellow rounded-full"></span>
                  Local Storage Persistence
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'manual' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-apple-gray-700 mb-4">📚 Manual do Usuário</h3>
            
            <div className="bg-gradient-to-r from-apple-blue/5 to-apple-purple/5 p-6 rounded-xl border border-apple-blue/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-apple-blue/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
                <div>
                  <h4 className="font-semibold text-apple-gray-700">Manual Completo em PDF</h4>
                  <p className="text-sm text-apple-gray-600">Guia detalhado com todas as funcionalidades</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-apple-gray-600 mb-2">
                    Faça o download do manual completo em formato PDF com instruções detalhadas sobre todas as funcionalidades da aplicação.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-apple-gray-500">
                    <span className="flex items-center gap-1">
                      <span>📄</span> 20+ páginas
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🎯</span> Guia completo
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📱</span> Inclui dicas mobile
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={downloadManualPDF}
                className="w-full bg-gradient-to-r from-apple-blue to-apple-purple text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">📥</span>
                Baixar Manual em PDF
              </button>
              
              <p className="text-xs text-apple-gray-500 mt-3 text-center">
                O arquivo será baixado automaticamente para sua pasta de Downloads
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>🚀</span> Primeiros Passos
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Como fazer login</li>
                  <li>• Navegação principal</li>
                  <li>• Configuração inicial</li>
                  <li>• Modo demo</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📊</span> Dashboard
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Widgets disponíveis</li>
                  <li>• Personalização</li>
                  <li>• Drag & drop</li>
                  <li>• Tamanhos e layouts</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💰</span> Gestão Financeira
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Cadastro de receitas</li>
                  <li>• Controle de despesas</li>
                  <li>• Acompanhamento de investimentos</li>
                  <li>• Recorrências</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💳</span> Cartões e Projeções
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Gestão de cartões</li>
                  <li>• Compras parceladas</li>
                  <li>• Lançamentos futuros</li>
                  <li>• Relatórios</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-green/5 to-apple-blue/5 p-6 rounded-xl border border-apple-green/20">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>📱</span> Uso Mobile
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-apple-gray-700 mb-2">Interface Responsiva</h5>
                  <ul className="text-sm text-apple-gray-600 space-y-1">
                    <li>• Menu inferior otimizado</li>
                    <li>• Gestos touch intuitivos</li>
                    <li>• Botões adequados para toque</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-apple-gray-700 mb-2">Dicas de Uso</h5>
                  <ul className="text-sm text-apple-gray-600 space-y-1">
                    <li>• Use orientação vertical</li>
                    <li>• Aproveite gestos de arrastar</li>
                    <li>• Navegação por menu inferior</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-orange/5 to-apple-red/5 p-6 rounded-xl border border-apple-orange/20">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>🆘</span> Solução de Problemas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-apple-gray-700 mb-2">Problemas Comuns</h5>
                  <ul className="text-sm text-apple-gray-600 space-y-1">
                    <li>• Problemas de login</li>
                    <li>• Dados não aparecem</li>
                    <li>• Questões mobile</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-apple-gray-700 mb-2">Dicas de Performance</h5>
                  <ul className="text-sm text-apple-gray-600 space-y-1">
                    <li>• Use navegadores modernos</li>
                    <li>• Mantenha boa conexão</li>
                    <li>• Limpe cache regularmente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}