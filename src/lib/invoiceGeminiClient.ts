// Análise de fatura chamando o Gemini DIRETO do navegador.
// Motivo: as funções serverless da Vercel têm limite de tempo (10s no Hobby),
// e a chamada ao Gemini pode ultrapassar isso. No cliente, não há esse limite.
// Usado apenas quando NEXT_PUBLIC_GEMINI_API_KEY está definido; senão, o
// componente usa a rota serverless como fallback.

import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseInvoiceResponse } from '@/lib/invoiceParse'

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

// Monta o mesmo prompt usado no servidor (mantido em sincronia).
function buildPrompt(params: {
  cardName: string
  closingDay: number | string
  dueDay: number | string
  invoiceMonth: string
  existingText: string
  categoriesText: string
}): string {
  const { cardName, closingDay, dueDay, invoiceMonth, existingText, categoriesText } = params
  return `Você é um especialista em análise de faturas de cartão de crédito de QUALQUER banco brasileiro (Nubank, Itaú, Bradesco, Santander, Inter, C6, XP, Caixa, etc). Cada banco organiza a fatura de um jeito diferente — NÃO existe posição fixa para cada informação. Raciocine sobre o SIGNIFICADO de cada texto, não sobre onde ele aparece.

CARTÃO: ${cardName} (fecha dia ${closingDay}, vence dia ${dueDay})
COMPETÊNCIA DA FATURA: ${invoiceMonth}

PARCELAS JÁ LANÇADAS NO SISTEMA PARA ESTE PERÍODO (use APENAS para conferir parcelas):
${existingText}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

COMO IDENTIFICAR CADA LANÇAMENTO (raciocínio semântico, sem regra de posição):
Para cada compra identifique: 1) NOME DO ESTABELECIMENTO (vai em "description"); 2) DATA; 3) VALOR; 4) INDICADOR DE PARCELA quando existir.
- "description" é SEMPRE o nome do estabelecimento. Categoria, cidade/UF, bandeira e "referência" NUNCA substituem o nome (vão em "category_hint" e "location").
- Se só houver categoria+cidade e não o nome real, preencha com o que tiver e marque "needs_review": true.

MÚLTIPLOS CARTÕES E SEÇÕES (importante):
- A fatura pode conter VÁRIOS cartões/portadores, cada um com suas seções.
- Seções típicas: "Pagamentos e Demais Créditos" (NÃO extrair), "Parcelamentos" (extrair) e "Despesas" (extrair).
- Percorra TODAS as seções de TODOS os cartões. Não pare no primeiro cartão. A seção "Despesas" costuma ser a maior — não a pule.
- Em tabela "Compra | Data | Descrição | Parcela | R$ | US$", a coluna "Parcela" (ex: "06/10", "18/18") indica a parcela e "R$" é o valor.

DETECÇÃO DE PARCELAMENTO:
- Formatos: sufixo no nome ("LOJA 03/10"), coluna "Parcela" ("06/10", "04/04"), texto ("PARC 03/10", "1a de 10", "3x").
- Padrão "número/número" com MM (total) entre 2 e 48.
- Parcela 1: "classification" = "nova_parcelada", "installments" = MM, "installment_number" = 1, "amount" = VALOR TOTAL (se o impresso for a parcela, multiplique por MM).
- Parcela > 1: "classification" = "parcela_existente", "amount" = valor da PARCELA impresso.
- Um único item por lançamento. NÃO confunda com código de terminal/loja ou datas (MM=2025 é inválido).

CLASSIFICAÇÃO:
- "nova_avista": compra sem parcelamento.
- "nova_parcelada": compra parcelada na 1a parcela.
- "parcela_existente": parcela > 1 correspondente à lista de já lançadas.
- "divergencia": parcela > 1 sem correspondência.

INCERTEZA: se não tiver certeza, inclua o item e marque "needs_review": true, com "confidence" em "high|medium|low".

OUTRAS REGRAS:
- Extraia TODOS os lançamentos de compras/despesas, de TODAS as seções e cartões, na ordem. Cada linha gera NO MÁXIMO UM item.
- Ignore NÃO-compras: "Pagamento de fatura anterior", "DEB AUTOM DE FATURA", estornos/créditos (negativos), juros, IOF, multas, cotação de dólar, saldo anterior.
- Compras no exterior: use o valor em R$.
- "invoice_total": NÃO use "Total a Pagar"/"Saldo desta fatura" (incluem saldo anterior e pagamentos). Use a SOMA DAS COMPRAS: se houver "Total Despesas/Débitos no Brasil" e "no Exterior", some os dois (R$). Se não der para determinar, use null.

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

  let prompt = buildPrompt({
    cardName: params.cardName,
    closingDay: params.closingDay,
    dueDay: params.dueDay,
    invoiceMonth: params.invoiceMonth,
    existingText: params.existingText || 'Nenhuma parcela já lançada neste período.',
    categoriesText,
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
