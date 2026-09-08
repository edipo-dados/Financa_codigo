'use client'

import { useState, useRef, useEffect } from 'react'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { isPdfFile, rasterizePdf, PdfPasswordError, type PdfPageImage } from '@/lib/pdfProcessor'

interface Props {
  userId: string
  onSuccess?: () => void
}

interface ExtractedItem {
  description: string
  amount: number
  purchase_date: string
  classification: 'nova_avista' | 'nova_parcelada' | 'parcela_existente' | 'divergencia'
  installment_number: number
  installments: number
  category_hint: string
  location?: string
  category_id?: string | null
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

const CLASSIFICATION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  nova_avista: { label: 'Nova (à vista)', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🆕' },
  nova_parcelada: { label: 'Nova (parcelada)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '💳' },
  parcela_existente: { label: 'Já lançada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: '✓' },
  divergencia: { label: 'Divergência', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '⚠️' },
}

export default function InvoiceImporter({ userId, onSuccess }: Props) {
  const { creditCards } = useCreditCards(userId)
  const { members } = useFamilyMembers(userId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'config' | 'analyzing' | 'preview' | 'done'>('config')
  const [selectedCard, setSelectedCard] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  // Arquivo pronto para análise. Para PDF, guardamos as páginas rasterizadas como imagens.
  const [file, setFile] = useState<{ pages: { data: string; mimeType: string }[]; name: string; pageCount: number } | null>(null)
  const [processingFile, setProcessingFile] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<{ done: number; total: number } | null>(null)
  // Fluxo de senha de PDF (senha só vive em memória, nunca é persistida)
  const [pdfPassword, setPdfPassword] = useState<{ file: File; error: string | null } | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [invoiceTotal, setInvoiceTotal] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await (supabase as any)
        .from('expense_categories').select('*').eq('user_id', userId)
      if (data) setExpenseCategories(data)
    }
    fetchCategories()
  }, [userId])

  // Rasteriza um PDF (com ou sem senha) em imagens base64.
  const processPdf = async (f: File, password?: string) => {
    setProcessingFile(true)
    try {
      // Mantém boa resolução por página; o envio é feito em lotes (ver handleAnalyze)
      // para respeitar o limite de body do serverless (~4,5MB na Vercel).
      const pages: PdfPageImage[] = await rasterizePdf(f, password)
      setFile({
        pages: pages.map(p => ({ data: p.data, mimeType: p.mimeType })),
        name: f.name,
        pageCount: pages.length,
      })
      // Senha usada apenas em memória, descartada agora
      setPdfPassword(null)
      setPasswordInput('')
      setError('')
    } catch (err) {
      if (err instanceof PdfPasswordError) {
        setFile(null)
        setPdfPassword({
          file: f,
          error: err.wrongPassword ? 'Senha incorreta. Tente novamente.' : null,
        })
      } else {
        console.error('Erro ao processar PDF:', err)
        setError('Não foi possível ler este PDF. Tente enviar como imagem.')
        setFile(null)
        setPdfPassword(null)
      }
    } finally {
      setProcessingFile(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo 15MB.')
      return
    }
    setError('')
    setFile(null)
    setPdfPassword(null)
    setPasswordInput('')

    // PDF: rasterizar no cliente (trata senha)
    if (isPdfFile(f)) {
      await processPdf(f)
      return
    }

    // Imagem: enviar como está (uma única página)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const matches = result.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        setError('Não foi possível ler o arquivo. Tente outro formato.')
        return
      }
      let mimeType = matches[1]
      const base64Data = matches[2]
      if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = f.type || 'image/jpeg'
      }
      setFile({ pages: [{ data: base64Data, mimeType }], name: f.name, pageCount: 1 })
    }
    reader.readAsDataURL(f)
  }

  const handleSubmitPassword = async () => {
    if (!pdfPassword || !passwordInput.trim()) return
    await processPdf(pdfPassword.file, passwordInput)
  }

  // Lê a resposta com segurança: se não vier JSON (ex: erro 413/500 em HTML,
  // timeout ou payload grande demais), gera uma mensagem clara em vez de
  // "Unexpected token ... is not valid JSON".
  const parseResponse = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      if (res.status === 413) {
        throw new Error('A fatura ficou grande demais para enviar. Tente um PDF com menos páginas ou uma imagem mais leve.')
      }
      if (res.status === 504 || res.status === 408) {
        throw new Error('A análise demorou demais e expirou. Tente novamente, ou envie menos páginas por vez.')
      }
      const snippet = text.trim().slice(0, 120)
      throw new Error(
        `Erro ${res.status} ao processar a fatura. ${snippet || 'Resposta inválida do servidor.'}`
      )
    }
  }

  const handleAnalyze = async () => {
    if (!selectedCard || !invoiceMonth || !file || file.pages.length === 0) {
      setError('Selecione o cartão, o mês e o arquivo da fatura.')
      return
    }
    setError('')
    setStep('analyzing')
    setAnalyzeProgress({ done: 0, total: file.pages.length })

    try {
      // Estratégia: 1 página por request, em paralelo (com limite de concorrência).
      // Cada chamada ao Gemini fica curta (uma página), evitando o timeout da função,
      // e o payload de cada request fica bem abaixo do limite do serverless.
      const pages = file.pages
      const total = pages.length

      const analyzePage = async (page: { data: string; mimeType: string }, index: number) => {
        const res = await fetch('/api/import-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            creditCardId: selectedCard,
            invoiceMonth,
            files: [page],
            expenseCategories,
            batchInfo: { index, total }
          })
        })
        const data = await parseResponse(res)
        if (data.error) throw new Error(data.error)
        setAnalyzeProgress(prev => prev ? { ...prev, done: prev.done + 1 } : prev)
        return data as { items?: ExtractedItem[]; invoiceTotal?: number | null }
      }

      // Executa com concorrência limitada para não sobrecarregar o navegador/API.
      const CONCURRENCY = 3
      const results: { items?: ExtractedItem[]; invoiceTotal?: number | null }[] = new Array(total)
      let cursor = 0
      const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, async () => {
        while (true) {
          const i = cursor++
          if (i >= total) break
          results[i] = await analyzePage(pages[i], i)
        }
      })
      await Promise.all(workers)

      // Mesclar mantendo a ordem das páginas
      let mergedItems: ExtractedItem[] = []
      let invoiceTotalValue: number | null = null
      for (const r of results) {
        mergedItems = mergedItems.concat(r?.items || [])
        if (invoiceTotalValue == null && r?.invoiceTotal != null) {
          invoiceTotalValue = r.invoiceTotal
        }
      }

      // Pré-associar categorias (só quando há hint; senão fica "Sem categoria")
      const itemsWithCategory = mergedItems.map((item: ExtractedItem) => {
        const hint = (item.category_hint || '').trim().toLowerCase()
        const matched = hint
          ? expenseCategories.find(c => {
              const name = c.name.toLowerCase()
              return name.includes(hint) || hint.includes(name)
            })
          : null
        return { ...item, category_id: matched?.id || null }
      })

      setItems(itemsWithCategory)
      setInvoiceTotal(invoiceTotalValue)
      setAnalyzeProgress(null)
      setStep('preview')
    } catch (err: any) {
      setError(err.message)
      setAnalyzeProgress(null)
      setStep('config')
    }
  }

  const handleConfirm = async () => {
    setStep('analyzing')
    try {
      const res = await fetch('/api/import-invoice/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          creditCardId: selectedCard,
          memberId: selectedMember || null,
          items
        })
      })
      const data = await parseResponse(res)
      if (data.error) throw new Error(data.error)
      setResult(data)
      setStep('done')
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
      setStep('preview')
    }
  }

  const updateItem = (index: number, updates: Partial<ExtractedItem>) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const reset = () => {
    setStep('config')
    setFile(null)
    setPdfPassword(null)
    setPasswordInput('')
    setItems([])
    setInvoiceTotal(null)
    setResult(null)
    setError('')
  }

  const itemsTotal = items
    .filter(i => i.classification === 'nova_avista' || i.classification === 'nova_parcelada')
    .reduce((sum, i) => sum + Number(i.amount), 0)
  const allItemsTotal = items.reduce((sum, i) => sum + Number(i.amount), 0)
  const newItemsCount = items.filter(i => i.classification === 'nova_avista' || i.classification === 'nova_parcelada').length

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <span className="text-xl">📄</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold fintech-text-primary">Importar Fatura</h2>
          <p className="text-sm fintech-text-muted">Envie a fatura (PDF ou imagem) e a IA extrai as compras</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* STEP: Configuração */}
      {step === 'config' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium fintech-text-secondary mb-2">Cartão de Crédito *</label>
              <select
                value={selectedCard}
                onChange={e => setSelectedCard(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-fintech-dark-border rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecione...</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (fecha {c.closing_day}, vence {c.due_day})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium fintech-text-secondary mb-2">Mês da Fatura *</label>
              <input
                type="month"
                value={invoiceMonth}
                onChange={e => setInvoiceMonth(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-fintech-dark-border rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium fintech-text-secondary mb-2">Membro (opcional)</label>
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-fintech-dark-border rounded-xl bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Nenhum</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium fintech-text-secondary mb-2">Arquivo da Fatura *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={processingFile}
              className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-fintech-dark-border rounded-xl hover:border-blue-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <span className="text-3xl">{file ? '📎' : '📤'}</span>
              <span className="text-sm fintech-text-secondary">
                {file
                  ? `${file.name}${file.pageCount > 1 ? ` — ${file.pageCount} páginas` : ''}`
                  : 'Toque para enviar PDF ou imagem'}
              </span>
              <span className="text-xs fintech-text-muted">Máximo 15MB</span>
            </button>

            {/* Processando (rasterização do PDF) */}
            {processingFile && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs fintech-text-secondary">Processando PDF...</span>
              </div>
            )}

            {/* Campo de senha do PDF (senha usada só em memória, nunca salva) */}
            {pdfPassword && !processingFile && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">🔒 PDF protegido por senha</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                  Digite a senha do arquivo (geralmente os primeiros dígitos do seu CPF ou sua data de nascimento).
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmitPassword() } }}
                    placeholder="Senha do PDF"
                    autoComplete="off"
                    className="flex-1 px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-fintech-dark-surface fintech-text-primary focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    onClick={handleSubmitPassword}
                    disabled={!passwordInput.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                  >
                    Abrir
                  </button>
                </div>
                {pdfPassword.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{pdfPassword.error}</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedCard || !invoiceMonth || !file || processingFile}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔍 Analisar Fatura
          </button>
        </div>
      )}

      {/* STEP: Analisando */}
      {step === 'analyzing' && (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="fintech-text-secondary text-sm">
            {analyzeProgress && analyzeProgress.total > 1
              ? `Analisando páginas com IA... ${analyzeProgress.done}/${analyzeProgress.total}`
              : 'Processando com IA... isso pode levar alguns segundos'}
          </p>
        </div>
      )}

      {/* STEP: Prévia */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Resumo de totais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs fintech-text-muted">Novos lançamentos</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{newItemsCount}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-xs fintech-text-muted">Total a lançar</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(itemsTotal)}</p>
            </div>
            {invoiceTotal && (
              <div className={`p-3 rounded-xl ${Math.abs(allItemsTotal - invoiceTotal) < 1 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <p className="text-xs fintech-text-muted">Total da fatura</p>
                <p className="text-lg font-bold fintech-text-primary">{formatCurrency(invoiceTotal)}</p>
              </div>
            )}
          </div>

          {invoiceTotal && Math.abs(allItemsTotal - invoiceTotal) >= 1 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Soma dos itens ({formatCurrency(allItemsTotal)}) difere do total da fatura ({formatCurrency(invoiceTotal)}). Revise os itens.
              </p>
            </div>
          )}

          {/* Lista de itens */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.map((item, idx) => {
              const cls = CLASSIFICATION_LABELS[item.classification]
              const isNew = item.classification === 'nova_avista' || item.classification === 'nova_parcelada'
              return (
                <div key={idx} className={`p-3 rounded-xl border ${isNew ? 'border-gray-200 dark:border-fintech-dark-border' : 'border-gray-100 dark:border-fintech-dark-border/50 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        value={item.description}
                        onChange={e => updateItem(idx, { description: e.target.value })}
                        className="w-full bg-transparent font-medium fintech-text-primary text-sm border-b border-transparent focus:border-blue-400 outline-none"
                      />
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls.color}`}>
                          {cls.icon} {cls.label}
                        </span>
                        {item.installments > 1 && (
                          <span className="text-xs fintech-text-muted">
                            {item.installment_number}/{item.installments}
                          </span>
                        )}
                        <select
                          value={item.category_id || ''}
                          onChange={e => updateItem(idx, { category_id: e.target.value || null })}
                          className="text-xs bg-gray-50 dark:bg-fintech-dark-elevated rounded px-1.5 py-0.5 fintech-text-secondary border-0 outline-none"
                        >
                          <option value="">Sem categoria</option>
                          {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={e => updateItem(idx, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-24 text-right bg-transparent font-bold text-sm fintech-text-primary border-b border-transparent focus:border-blue-400 outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <select
                          value={item.classification}
                          onChange={e => updateItem(idx, { classification: e.target.value as any })}
                          className="text-xs bg-gray-50 dark:bg-fintech-dark-elevated rounded px-1 py-0.5 fintech-text-muted border-0 outline-none"
                        >
                          <option value="nova_avista">À vista</option>
                          <option value="nova_parcelada">Parcelada</option>
                          <option value="parcela_existente">Já lançada</option>
                          <option value="divergencia">Divergência</option>
                        </select>
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-red-400 hover:text-red-600 text-xs px-1"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleConfirm}
              disabled={newItemsCount === 0}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-40"
            >
              ✅ Confirmar {newItemsCount} lançamento(s)
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-gray-200 dark:bg-fintech-dark-elevated fintech-text-primary rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* STEP: Concluído */}
      {step === 'done' && result && (
        <div className="py-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold fintech-text-primary">Fatura importada!</h3>
            <p className="text-sm fintech-text-muted mt-1">{result.message}</p>
            {result.errors?.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-left">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Alguns itens tiveram erro:</p>
                {result.errors.map((e: string, i: number) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-500">• {e}</p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Importar outra fatura
          </button>
        </div>
      )}
    </div>
  )
}
