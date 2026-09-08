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
        </div>
      </div>

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

      <div className="glass-card p-6 rounded-3xl">
        {activeSection === 'about' && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-apple-blue to-apple-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-apple-gray-700 mb-2">EAS Controle Financeiro</h3>
              <p className="text-apple-gray-500 text-lg">Versão 2.0.0</p>
              <p className="text-apple-gray-400 text-sm mt-1">com Inteligência Artificial</p>
            </div>

            <div className="prose prose-apple max-w-none">
              <p className="text-apple-gray-600 leading-relaxed">
                Sistema inteligente de gestão financeira pessoal e familiar com assistente de IA integrado.
                Controle receitas, despesas, investimentos e cartões de crédito com uma interface moderna,
                responsiva e conversacional. A IA ajuda a registrar transações por texto ou imagem,
                buscar compras e analisar seus gastos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-apple-blue/5 p-4 rounded-xl border border-apple-blue/20">
                  <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                    <span>🎯</span> Objetivo
                  </h4>
                  <p className="text-sm text-apple-gray-600">
                    Simplificar o controle financeiro pessoal e familiar com IA,
                    tornando o registro e consulta de transações tão fácil quanto uma conversa.
                  </p>
                </div>

                <div className="bg-apple-green/5 p-4 rounded-xl border border-apple-green/20">
                  <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                    <span>🤖</span> IA Integrada
                  </h4>
                  <p className="text-sm text-apple-gray-600">
                    Assistente financeiro com Gemini AI que entende linguagem natural,
                    analisa comprovantes por foto e busca suas transações.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-apple-gray-50 to-transparent p-6 rounded-xl">
              <h4 className="font-semibold text-apple-gray-700 mb-3">📊 Números</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-blue">8</div>
                  <div className="text-xs text-apple-gray-500">Seções</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-green">10+</div>
                  <div className="text-xs text-apple-gray-500">APIs REST</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-purple">100%</div>
                  <div className="text-xs text-apple-gray-500">Responsivo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-orange">🤖</div>
                  <div className="text-xs text-apple-gray-500">IA Gemini</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-apple-gray-700 mb-4">✨ Funcionalidades</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>🤖</span> Assistente IA (EAS Finance AI)
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Registrar despesas, receitas e investimentos por texto</li>
                  <li>• Analisar comprovantes e notas fiscais por foto</li>
                  <li>• Buscar compras por nome, loja ou categoria</li>
                  <li>• Lançamento em lote a partir de imagens de fatura</li>
                  <li>• Classificação automática de categorias</li>
                  <li>• Exclusão de transações por comando</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📊</span> Dashboard Inteligente
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Saldo acumulado do ano (descontando investimentos)</li>
                  <li>• Saldo mensal com filtro global de mês</li>
                  <li>• Filtro por membro da família</li>
                  <li>• Card de investimentos com rendimento e resgates</li>
                  <li>• Totais consistentes (ano = soma dos meses)</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💸</span> Controle de Despesas
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Despesas comuns e recorrentes</li>
                  <li>• Múltiplas formas de pagamento</li>
                  <li>• Seleção múltipla para pagar em lote</li>
                  <li>• Filtros por membro, categoria, status e busca</li>
                  <li>• Exclusão de ocorrências virtuais de recorrência</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💰</span> Gestão de Receitas
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Receitas comuns e recorrentes</li>
                  <li>• Categorização personalizada</li>
                  <li>• Controle de recebimentos (pago/a receber)</li>
                  <li>• Edição e exclusão de ocorrências virtuais</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>📈</span> Investimentos
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Controle de aportes e valor atual</li>
                  <li>• Resgates com histórico de transações</li>
                  <li>• Tipos personalizáveis</li>
                  <li>• Rendimento calculado automaticamente</li>
                  <li>• Descontado do saldo no dashboard</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>💳</span> Cartões de Crédito
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Múltiplos cartões com cores e limites</li>
                  <li>• Compras parceladas com cálculo automático</li>
                  <li>• Faturas agrupadas por cartão e mês</li>
                  <li>• Pagamento de fatura inteira com um clique</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>👥</span> Gestão Familiar
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• Membros da família com cores e relacionamento</li>
                  <li>• Filtro por membro em todas as telas</li>
                  <li>• Relatórios individuais por membro</li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-xl border border-apple-gray-200">
                <h4 className="font-semibold text-apple-gray-700 mb-2 flex items-center gap-2">
                  <span>🔌</span> APIs REST
                </h4>
                <ul className="text-sm text-apple-gray-600 space-y-1">
                  <li>• API completa para despesas, receitas e investimentos</li>
                  <li>• API de resumo financeiro com filtros inteligentes</li>
                  <li>• API de membros da família</li>
                  <li>• API de cartões com faturas</li>
                  <li>• Integração com sistemas externos e IA</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tech' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-apple-gray-700 mb-4">⚙️ Tecnologias</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                  <span>🚀</span> Frontend
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'Next.js 16', tag: 'Framework React' },
                    { name: 'React 19', tag: 'UI Library' },
                    { name: 'TypeScript', tag: 'Type Safety' },
                    { name: 'Tailwind CSS', tag: 'Styling' },
                  ].map(t => (
                    <div key={t.name} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                      <span className="font-medium text-apple-gray-700">{t.name}</span>
                      <span className="text-xs bg-apple-blue/10 text-apple-blue px-2 py-1 rounded">{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                  <span>🗄️</span> Backend & IA
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'Supabase', tag: 'Backend as a Service' },
                    { name: 'PostgreSQL', tag: 'Database' },
                    { name: 'Google Gemini 2.5', tag: 'Inteligência Artificial' },
                    { name: 'Vercel', tag: 'Deploy & Hosting' },
                  ].map(t => (
                    <div key={t.name} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-apple-gray-200">
                      <span className="font-medium text-apple-gray-700">{t.name}</span>
                      <span className="text-xs bg-apple-green/10 text-apple-green px-2 py-1 rounded">{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <button
                onClick={downloadManualPDF}
                className="w-full bg-gradient-to-r from-apple-blue to-apple-purple text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">📥</span>
                Baixar Manual em PDF
              </button>
            </div>

            <div className="bg-gradient-to-r from-apple-green/5 to-apple-blue/5 p-6 rounded-xl border border-apple-green/20">
              <h4 className="font-semibold text-apple-gray-700 mb-3 flex items-center gap-2">
                <span>🤖</span> Como usar a IA
              </h4>
              <div className="space-y-3 text-sm text-apple-gray-600">
                <p>Clique no botão de chat (canto inferior direito) e converse naturalmente:</p>
                <ul className="space-y-2">
                  <li>💸 <strong>"Paguei 50 de almoço no pix"</strong> → registra despesa</li>
                  <li>💳 <strong>"Comprei TV de 3000 no Nubank em 10x"</strong> → compra parcelada</li>
                  <li>💰 <strong>"Recebi salário de 5000"</strong> → registra receita</li>
                  <li>📈 <strong>"Investi 500 no Tesouro"</strong> → registra investimento</li>
                  <li>🔍 <strong>"Comprei algo na Petlove?"</strong> → busca transações</li>
                  <li>🔍 <strong>"Gastos com saúde"</strong> → busca por categoria</li>
                  <li>🗑️ <strong>"Exclui a despesa do almoço"</strong> → remove transação</li>
                  <li>📷 <strong>Envie uma foto</strong> de comprovante ou fatura → lançamento automático</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
