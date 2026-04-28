'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { createInstallmentsData } from '@/lib/creditCard'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: any
  actionStatus?: 'pending' | 'confirmed' | 'cancelled' | 'executed'
  actionTab?: string
  selectedMemberId?: string
  selectedCardId?: string
  selectedCategoryId?: string
}

interface Props {
  userId: string
  onRefresh: () => void
  onNavigate: (tab: string) => void
  creditCards: any[]
  expenseCategories: any[]
  incomeCategories: any[]
  investmentTypes: any[]
  members: any[]
}

export default function AIChatAssistant({
  userId, onRefresh, onNavigate, creditCards, expenseCategories, incomeCategories, investmentTypes, members
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente financeiro. Me diga o que precisa:\n\n💸 "Paguei 50 de almoço"\n💳 "Comprei TV de 3000 no Nubank em 10x"\n💰 "Recebi salário de 5000"\n📈 "Investi 500 no Tesouro"\n🗑️ "Exclui a despesa do almoço"'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // Bloquear scroll do body quando chat está aberto no mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const parseAction = (text: string) => {
    const match = text.match(/<action>(.*?)<\/action>/s)
    if (!match) return null
    try { return JSON.parse(match[1]) } catch { return null }
  }

  const cleanMessage = (text: string) => text.replace(/<action>.*?<\/action>/gs, '').trim()

  const findBestMatch = (hint: string, items: any[], field: string = 'name') => {
    if (!hint || !items.length) return null
    const lower = hint.toLowerCase()
    return items.find(item => item[field].toLowerCase().includes(lower)) || items[0]
  }

  const getActionTab = (actionType: string) => {
    switch (actionType) {
      case 'expense': return 'expenses'
      case 'credit_card_expense': return 'creditcard'
      case 'income': return 'incomes'
      case 'investment': return 'investments'
      case 'delete': return 'overview'
      default: return 'overview'
    }
  }

  const getActionLabel = (action: any) => {
    switch (action.type) {
      case 'expense': return `💸 ${action.data.description} — ${formatCurrency(action.data.amount)}`
      case 'credit_card_expense': return `💳 ${action.data.description} — ${formatCurrency(action.data.total_amount)} em ${action.data.installments}x`
      case 'income': return `💰 ${action.data.description} — ${formatCurrency(action.data.amount)}`
      case 'investment': return `📈 ${action.data.name} — ${formatCurrency(action.data.initial_amount)}`
      case 'delete': return `🗑️ Excluir: ${action.data.search_term}`
      default: return 'Ação'
    }
  }

  const handleViewRecord = (tab: string) => {
    onNavigate(tab)
    setIsOpen(false)
  }

  const executeAction = async (action: any, messageId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tab = getActionTab(action.type)
      
      // Pegar membro e cartão selecionados da mensagem
      const msg = messages.find(m => m.id === messageId)
      const selectedMemberId = msg?.selectedMemberId || null
      const selectedCardId = msg?.selectedCardId || null
      const selectedCategoryId = msg?.selectedCategoryId || null

      if (action.type === 'expense') {
        const d = action.data
        const { error } = await (supabase as any).from('expenses').insert({
          user_id: userId, amount: d.amount, description: d.description,
          expense_date: d.expense_date || today, category_id: selectedCategoryId,
          member_id: selectedMemberId, payment_method: d.payment_method || 'cash',
          is_recurring: false, is_credit_card: false, credit_card_id: null,
          is_installment: false, is_paid: d.payment_method !== 'credit_card',
          installments: null, installment_number: null, total_amount: null,
          purchase_date: null, parent_expense_id: null,
          recurrence_frequency: null, recurrence_start_date: null,
          recurrence_end_type: null, recurrence_end_date: null, recurrence_count: null
        })
        if (error) throw error

      } else if (action.type === 'credit_card_expense') {
        const d = action.data
        // Usar cartão selecionado pelo usuário, ou tentar match por hint
        const card = selectedCardId 
          ? creditCards.find(c => c.id === selectedCardId)
          : findBestMatch(d.card_hint, creditCards)
        if (!card) throw new Error('Selecione um cartão de crédito')

        const { data: parentData, error: parentError } = await (supabase as any)
          .from('expenses').insert({
            user_id: userId, amount: d.total_amount, description: d.description,
            expense_date: d.purchase_date || today, category_id: selectedCategoryId,
            member_id: selectedMemberId, payment_method: 'credit_card', is_recurring: false,
            is_credit_card: true, credit_card_id: card.id, is_installment: false,
            is_paid: false, installments: d.installments || 1, installment_number: null,
            total_amount: d.total_amount, purchase_date: d.purchase_date || today,
            parent_expense_id: null, recurrence_frequency: null,
            recurrence_start_date: null, recurrence_end_type: null,
            recurrence_end_date: null, recurrence_count: null
          }).select().single()
        if (parentError) throw parentError

        const installmentsData = createInstallmentsData(
          d.total_amount, d.installments || 1, d.purchase_date || today,
          card.closing_day, d.description, card.due_day
        )
        for (const inst of installmentsData) {
          await (supabase as any).from('expenses').insert({
            user_id: userId, amount: inst.amount, description: inst.description,
            expense_date: inst.expense_date, category_id: selectedCategoryId,
            member_id: selectedMemberId, payment_method: 'credit_card', is_recurring: false,
            is_credit_card: true, credit_card_id: card.id, is_installment: true,
            is_paid: false, installments: d.installments || 1,
            installment_number: inst.installment_number, total_amount: d.total_amount,
            purchase_date: d.purchase_date || today, parent_expense_id: parentData.id,
            recurrence_frequency: null, recurrence_start_date: null,
            recurrence_end_type: null, recurrence_end_date: null, recurrence_count: null
          })
        }

      } else if (action.type === 'income') {
        const d = action.data
        const { error } = await (supabase as any).from('incomes').insert({
          user_id: userId, amount: d.amount, description: d.description,
          income_date: d.income_date || today, category_id: selectedCategoryId,
          member_id: selectedMemberId, source: d.source || null, is_recurring: false,
          is_paid: d.is_paid !== false, recurrence_frequency: null,
          recurrence_start_date: null, recurrence_end_type: null,
          recurrence_end_date: null, recurrence_count: null, parent_income_id: null
        })
        if (error) throw error

      } else if (action.type === 'investment') {
        const d = action.data
        const invType = findBestMatch(d.type_hint, investmentTypes)
        const { error } = await (supabase as any).from('investments').insert({
          user_id: userId, name: d.name, investment_type_id: invType?.id || null,
          member_id: selectedMemberId, institution: d.institution || null,
          initial_amount: d.initial_amount, current_amount: d.initial_amount,
          investment_date: d.investment_date || today, expected_return: null,
          is_recurring: false, recurrence_frequency: null, recurrence_start_date: null,
          recurrence_end_type: null, recurrence_end_date: null,
          recurrence_count: null, parent_investment_id: null
        })
        if (error) throw error

      } else if (action.type === 'delete') {
        const d = action.data
        const table = d.search_type === 'expense' ? 'expenses' : d.search_type === 'income' ? 'incomes' : 'investments'
        const field = d.search_type === 'investment' ? 'name' : 'description'
        const { data: items } = await (supabase as any).from(table).select('*')
          .eq('user_id', userId).ilike(field, `%${d.search_term}%`)
          .order('created_at', { ascending: false }).limit(1)
        if (items?.length > 0) {
          if (d.search_type === 'expense' && items[0].is_credit_card && !items[0].is_installment) {
            await (supabase as any).from('expenses').delete().eq('parent_expense_id', items[0].id)
          }
          const { error } = await (supabase as any).from(table).delete().eq('id', items[0].id)
          if (error) throw error
        } else { throw new Error('Item não encontrado') }
      }

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, actionStatus: 'executed', actionTab: tab } : m
      ))
      onRefresh()
    } catch (error: any) {
      console.error('Erro:', error)
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, actionStatus: 'cancelled', content: m.content + `\n\n❌ ${error.message}` } : m
      ))
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter(m => !m.content.startsWith('Olá!')), userMsg].map(m => ({
            role: m.role, content: m.content
          })),
          context: { creditCards, expenseCategories, incomeCategories, investmentTypes, members }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const action = parseAction(data.response)
      const cleanContent = cleanMessage(data.response)
      
      // Pré-selecionar cartão se a IA identificou
      let preSelectedCardId: string | undefined
      if (action?.type === 'credit_card_expense' && action.data.card_hint) {
        const matched = findBestMatch(action.data.card_hint, creditCards)
        if (matched) preSelectedCardId = matched.id
      }
      
      // Pré-selecionar categoria se a IA identificou
      let preSelectedCategoryId: string | undefined
      if (action?.data?.category_hint) {
        const categories = (action.type === 'income') ? incomeCategories : expenseCategories
        const matched = findBestMatch(action.data.category_hint, categories)
        if (matched) preSelectedCategoryId = matched.id
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', content: cleanContent,
        action, actionStatus: action ? 'pending' : undefined,
        selectedCardId: preSelectedCardId,
        selectedCategoryId: preSelectedCategoryId
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: `❌ ${error.message}. Tente novamente.`
      }])
    } finally { setLoading(false) }
  }

  return (
    <>
      {/* Botão flutuante - maior no mobile */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-16 h-16 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        >
          <span className="text-3xl sm:text-2xl">🤖</span>
          {/* Indicador de pulsação */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat - Tela cheia no mobile, painel no desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[400px] sm:max-h-[650px] sm:rounded-2xl bg-white dark:bg-fintech-dark-card sm:shadow-2xl sm:border sm:border-gray-200 dark:sm:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">EAS Finance AI</h3>
                  <p className="text-xs text-blue-200">Assistente financeiro</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sugestões rápidas */}
          {messages.length <= 1 && (
            <div className="p-3 flex gap-2 overflow-x-auto flex-shrink-0 border-b border-gray-100 dark:border-gray-700">
              {[
                { text: '💸 Registrar despesa', msg: 'Quero registrar uma despesa' },
                { text: '💰 Registrar receita', msg: 'Quero registrar uma receita' },
                { text: '💳 Compra no cartão', msg: 'Fiz uma compra no cartão' },
                { text: '📈 Investimento', msg: 'Quero registrar um investimento' },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.msg); setTimeout(() => sendMessage(), 100) }}
                  className="flex-shrink-0 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 transition-all whitespace-nowrap"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 fintech-text-primary rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                  {/* Ação pendente - resumo + seletores + botões */}
                  {msg.action && msg.actionStatus === 'pending' && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm space-y-3">
                      
                      {/* Resumo detalhado */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">
                          {msg.action.type === 'expense' && '💸 Nova Despesa'}
                          {msg.action.type === 'credit_card_expense' && '💳 Compra no Cartão'}
                          {msg.action.type === 'income' && '💰 Nova Receita'}
                          {msg.action.type === 'investment' && '📈 Novo Investimento'}
                          {msg.action.type === 'delete' && '🗑️ Exclusão'}
                        </p>
                        <div className="space-y-1 text-xs">
                          {/* Descrição/Nome */}
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Descrição:</span>
                            <span className="font-medium fintech-text-primary">{msg.action.data.description || msg.action.data.name || msg.action.data.search_term}</span>
                          </div>
                          {/* Valor */}
                          {(msg.action.data.amount || msg.action.data.total_amount || msg.action.data.initial_amount) && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                              <span className="font-bold text-blue-700 dark:text-blue-300">
                                {formatCurrency(msg.action.data.amount || msg.action.data.total_amount || msg.action.data.initial_amount)}
                              </span>
                            </div>
                          )}
                          {/* Parcelas */}
                          {msg.action.type === 'credit_card_expense' && msg.action.data.installments > 1 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Parcelas:</span>
                              <span className="font-medium fintech-text-primary">
                                {msg.action.data.installments}x de {formatCurrency(msg.action.data.total_amount / msg.action.data.installments)}
                              </span>
                            </div>
                          )}
                          {/* Data */}
                          {(msg.action.data.expense_date || msg.action.data.income_date || msg.action.data.purchase_date || msg.action.data.investment_date) && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Data:</span>
                              <span className="font-medium fintech-text-primary">
                                {new Date((msg.action.data.expense_date || msg.action.data.income_date || msg.action.data.purchase_date || msg.action.data.investment_date) + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                          {/* Forma de pagamento */}
                          {msg.action.type === 'expense' && msg.action.data.payment_method && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Pagamento:</span>
                              <span className="font-medium fintech-text-primary">
                                {msg.action.data.payment_method === 'cash' ? 'Dinheiro' :
                                 msg.action.data.payment_method === 'debit' ? 'Débito' :
                                 msg.action.data.payment_method === 'pix' ? 'PIX' :
                                 msg.action.data.payment_method === 'transfer' ? 'Transferência' :
                                 msg.action.data.payment_method}
                              </span>
                            </div>
                          )}
                          {/* Categoria selecionada */}
                          {msg.selectedCategoryId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Categoria:</span>
                              <span className="font-medium fintech-text-primary">
                                🏷️ {[...expenseCategories, ...incomeCategories].find((c: any) => c.id === msg.selectedCategoryId)?.name}
                              </span>
                            </div>
                          )}
                          {/* Membro selecionado */}
                          {msg.selectedMemberId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Membro:</span>
                              <span className="font-medium fintech-text-primary">
                                👤 {members.find((m: any) => m.id === msg.selectedMemberId)?.name}
                              </span>
                            </div>
                          )}
                          {/* Cartão selecionado */}
                          {msg.selectedCardId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Cartão:</span>
                              <span className="font-medium fintech-text-primary">
                                💳 {creditCards.find((c: any) => c.id === msg.selectedCardId)?.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Seletor de Membro */}
                      {msg.action.type !== 'delete' && members.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium fintech-text-muted mb-1">👤 Membro</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {members.map((m: any) => (
                              <button
                                key={m.id}
                                onClick={() => setMessages(prev => prev.map(p =>
                                  p.id === msg.id ? { ...p, selectedMemberId: p.selectedMemberId === m.id ? undefined : m.id } : p
                                ))}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all border ${
                                  msg.selectedMemberId === m.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 dark:bg-gray-800 fintech-text-secondary border-gray-200 dark:border-gray-600 hover:border-blue-400'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seletor de Cartão - só para compras no cartão */}
                      {msg.action.type === 'credit_card_expense' && creditCards.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium fintech-text-muted mb-1">💳 Cartão</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {creditCards.map((c: any) => (
                              <button
                                key={c.id}
                                onClick={() => setMessages(prev => prev.map(p =>
                                  p.id === msg.id ? { ...p, selectedCardId: c.id } : p
                                ))}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all border ${
                                  msg.selectedCardId === c.id
                                    ? 'text-white border-transparent'
                                    : 'bg-gray-50 dark:bg-gray-800 fintech-text-secondary border-gray-200 dark:border-gray-600 hover:border-blue-400'
                                }`}
                                style={msg.selectedCardId === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => executeAction(msg.action, msg.id)}
                          disabled={
                            (msg.action.type === 'credit_card_expense' && !msg.selectedCardId) ||
                            (msg.action.type !== 'delete' && members.length > 0 && !msg.selectedMemberId)
                          }
                          className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ✅ Confirmar Registro
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map(m =>
                            m.id === msg.id ? { ...m, actionStatus: 'cancelled' } : m
                          ))}
                          className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 fintech-text-primary text-sm font-semibold rounded-xl transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ação executada - botão de ver registro */}
                  {msg.actionStatus === 'executed' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">✅ Registrado com sucesso!</p>
                      {msg.actionTab && (
                        <button
                          onClick={() => handleViewRecord(msg.actionTab!)}
                          className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          👁️ Ver registro
                        </button>
                      )}
                    </div>
                  )}

                  {msg.actionStatus === 'cancelled' && (
                    <p className="mt-2 text-xs text-gray-500 font-medium">Cancelado</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-5 py-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - safe area no mobile */}
          <div className="p-3 pb-safe border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-fintech-dark-card flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Digite aqui..."
                className="flex-1 px-4 py-3 text-base sm:text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
                autoComplete="off"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
