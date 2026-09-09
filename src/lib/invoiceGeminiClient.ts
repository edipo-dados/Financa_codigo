// Análise de fatura chamando o Gemini DIRETO do navegador.
// Motivo: as funções serverless da Vercel têm limite de tempo (10s no Hobby),
// e a chamada ao Gemini pode ultrapassar isso. No cliente, não há esse limite.
// Usado apenas quando NEXT_PUBLIC_GEMINI_API_KEY está definido; senão, o
// componente usa a rota serverless como fallback.

import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseInvoiceResponse } from '@/lib/invoiceParse'
import { detectBank, getBankProfile } from '@/lib/bankProfiles'

// Cache da chave obtida em runtime (via env pública ou rota do servidor).
let cachedKey: string | null = null

// Obtém a chave para uso no cliente: primeiro do env público (se existir),
// senão busca da rota do servidor (reaproveita a GEMINI_API_KEY já configurada).
async function getClientKey(): Promise<string> {
  if (cachedKey) return cachedKey
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (envKey) { cachedKey = envKey; return envKey }
  const res = await fetch('/api/import-invoice/gemini-key')
  if (!res.ok) throw new Error('Não foi possível obter a chave de análise.')
  const data = await res.json()
  if (!data.key) throw new Error('Chave do Gemini não configurada no servidor.')
  cachedKey = data.key
  return data.key
}

// Sempre disponível: a chave será obtida em runtime (env público ou servidor).
export function hasClientGeminiKey(): boolean {
  return true
}

// Monta o prompt com as instruções ESPECÍFICAS do banco detectado.
function buildPrompt(params: {
  cardName: string
  closingDay: number | string
  dueDay: number | string
  invoiceMonth: string
  existingText: string
  categoriesText: string
  bankLabel: string
  bankInstructions: string
}): string {
  const { cardName, closingDay, dueDay, invoiceMonth, existingText, categoriesText, bankLabel, bankInstructions } = params
  return `Você é um especialista em analisar faturas do banco ${bankLabel}. Siga as INSTRUÇÕES ESPECÍFICAS deste banco abaixo — elas descrevem o layout exato da fatura.

CARTÃO: ${cardName} (fecha dia ${closingDay}, vence dia ${dueDay})
COMPETÊNCIA DA FATURA: ${invoiceMonth}

PARCELAS JÁ LANÇADAS NO SISTEMA PARA ESTE PERÍODO (use APENAS para conferir parcelas):
${existingText}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

=== INSTRUÇÕES ESPECÍFICAS DO BANCO ${bankLabel.toUpperCase()} ===
${bankInstructions}
=== FIM DAS INSTRUÇÕES DO BANCO ===

REGRAS DE VALOR/PARCELA (padronizadas):
- "amount" para "nova_parcelada" = VALOR TOTAL da compra (valor da parcela × número de parcelas).
- "amount" para "parcela_existente"/"divergencia" = valor da PARCELA impresso.
- "amount" para "nova_avista" = valor impresso.
- Um único item por lançamento. Nunca duplique a mesma linha.

CLASSIFICAÇÃO:
- "nova_avista": compra sem parcelamento.
- "nova_parcelada": compra parcelada mostrando a 1ª parcela (NN==1).
- "parcela_existente": parcela NN>1 (não gera novo lançamento, mas conta no total do mês).
- "divergencia": parcela NN>1 suspeita, sem correspondência clara.

INCERTEZA: se não tiver certeza, inclua o item mesmo assim e marque "needs_review": true, com "confidence" em "high|medium|low". NUNCA descarte um lançamento silenciosamente.

RESPONDA APENAS COM JSON VÁLIDO (sem markdown):
{
  "invoice_total": 1234.56,
  "items": [
    { "description": "NOME", "amount": 100.00, "purchase_date": "2025-12-15", "classification": "nova_avista|nova_parcelada|parcela_existente|divergencia", "installment_number": 1, "installments": 1, "category_hint": "", "location": "", "needs_review": false, "confidence": "high|medium|low" }
  ]
}`
}

// Normaliza um item cru vindo do modelo, com as mesmas regras do servidor.
function normalizeItem(item: any) {
  let installments = Number(item.installments) || 1
  let installmentNumber = Number(item.installment_number) || 1
  let amount = Number(item.amount) || 0
  let classification = item.classification

  const desc = String(item.description || '')
  const parcelaMatch = desc.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b\s*$/)
  if (parcelaMatch) {
    const nn = parseInt(parcelaMatch[1], 10)
    const mm = parseInt(parcelaMatch[2], 10)
    if (mm >= 2 && mm <= 48 && nn >= 1 && nn <= mm && installments <= 1) {
      installments = mm
      installmentNumber = nn
      if (nn === 1) { amount = amount * mm; classification = 'nova_parcelada' }
      else { classification = classification === 'divergencia' ? 'divergencia' : 'parcela_existente' }
    }
  }

  const isParcelado = installments > 1
  if (!isParcelado && (classification === 'parcela_existente' || classification === 'divergencia')) classification = 'nova_avista'
  if (isParcelado && !['parcela_existente', 'divergencia', 'nova_parcelada'].includes(classification)) classification = 'nova_parcelada'
  if (!classification) classification = isParcelado ? 'nova_parcelada' : 'nova_avista'

  const confidence = ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'high'
  return {
    description: item.description || 'Lançamento',
    amount,
    purchase_date: item.purchase_date || null,
    classification,
    installment_number: installmentNumber,
    installments,
    category_hint: item.category_hint || '',
    location: item.location || '',
    needs_review: item.needs_review === true || confidence === 'low',
    confidence,
  }
}

export interface ClientAnalyzeParams {
  cardName: string
  closingDay: number | string
  dueDay: number | string
  invoiceMonth: string
  existingText?: string
  categories: { name: string }[]
  chunkText: string
  isBatched?: boolean
  batchIndex?: number
  batchTotal?: number
}

// Analisa um trecho de texto de fatura chamando o Gemini direto do navegador.
export async function analyzeInvoiceChunkClient(params: ClientAnalyzeParams): Promise<{ items: any[]; invoiceTotal: number | null }> {
  const key = await getClientKey()

  const categoriesText = params.categories.length > 0
    ? params.categories.map(c => c.name).join(', ')
    : 'Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Outros'

  // Detecta o banco pelo nome do cartão + texto e aplica o perfil específico.
  const bankId = detectBank(params.cardName, params.chunkText)
  const profile = getBankProfile(bankId)

  let prompt = buildPrompt({
    cardName: params.cardName,
    closingDay: params.closingDay,
    dueDay: params.dueDay,
    invoiceMonth: params.invoiceMonth,
    existingText: params.existingText || 'Nenhuma parcela já lançada neste período.',
    categoriesText,
    bankLabel: profile.label,
    bankInstructions: profile.instructions,
  })

  if (params.isBatched && (params.batchTotal || 0) > 1) {
    prompt += `\n\nOBSERVAÇÃO: Este é o TRECHO ${(params.batchIndex || 0) + 1} de ${params.batchTotal} do texto de UMA ÚNICA fatura. Extraia as compras APENAS deste trecho. O total pode não estar neste trecho; se não aparecer, use "invoice_total": null.`
  }

  prompt += `\n\nTEXTO EXTRAÍDO DA FATURA:\n"""\n${params.chunkText}\n"""`

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      // Faturas têm muitos itens; garantir espaço de saída para não truncar o JSON.
      maxOutputTokens: 32768,
      temperature: 0,
      responseMimeType: 'application/json',
    },
  })
  const result = await model.generateContent([{ text: prompt }])
  const parsed = parseInvoiceResponse(result.response.text())

  return {
    items: parsed.items.map(normalizeItem),
    invoiceTotal: parsed.invoice_total,
  }
}


// Reconciliação por IA no navegador: recebe itens + total + texto e devolve a
// lista corrigida para fechar com o total. Sem limite de tempo da função.
export async function reconcileInvoiceClient(params: {
  invoiceTotal: number
  currentItems: any[]
  text: string
  categories: { name: string }[]
}): Promise<{ items: any[] }> {
  const key = await getClientKey()
  const categoriesText = params.categories.length > 0
    ? params.categories.map(c => c.name).join(', ')
    : 'Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Outros'

  const monthValue = (i: any) => {
    const amt = Number(i.amount) || 0
    const inst = Number(i.installments) || 1
    if (i.classification === 'nova_parcelada' && inst > 1) return amt / inst
    return amt
  }
  const currentSum = params.currentItems.reduce((s, i) => s + monthValue(i), 0)

  const prompt = `Você é um auditor de faturas. A SOMA dos itens extraídos NÃO bate com o TOTAL de compras impresso. Corrija a lista para fechar.

REGRA DE SOMA (valor do mês por item):
- à vista: "amount" cheio; nova_parcelada: "amount"/"installments"; parcela_existente/divergencia: o próprio "amount" (já é a parcela).
- A soma desses valores deve ser IGUAL ao total de compras.

TOTAL DE COMPRAS (Brasil+Exterior, R$): ${Number(params.invoiceTotal).toFixed(2)}
SOMA ATUAL: ${currentSum.toFixed(2)}  (diferença ${(currentSum - Number(params.invoiceTotal)).toFixed(2)})

CAUSAS: duplicata (some a mais), item faltando (some a menos, ADICIONE do texto), parcela com valor errado, valor lido errado, item inventado. Use o TEXTO como verdade. Percorra TODAS as seções e cartões — a seção "Despesas" costuma ser a maior.

CATEGORIAS: ${categoriesText}

ITENS ATUAIS:
${JSON.stringify(params.currentItems.map(i => ({ description: i.description, amount: Number(i.amount), installments: Number(i.installments) || 1, installment_number: Number(i.installment_number) || 1, classification: i.classification, purchase_date: i.purchase_date || null, category_hint: i.category_hint || '' })))}

TEXTO ORIGINAL:
"""
${String(params.text).slice(0, 40000)}
"""

RESPONDA APENAS JSON: {"items":[{"description":"","amount":0,"purchase_date":null,"classification":"nova_avista","installment_number":1,"installments":1,"category_hint":"","location":"","needs_review":false,"confidence":"high"}]}`

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: 32768, temperature: 0, responseMimeType: 'application/json' },
  })
  const result = await model.generateContent([{ text: prompt }])
  const parsed = parseInvoiceResponse(result.response.text())
  return { items: parsed.items.map(normalizeItem) }
}
