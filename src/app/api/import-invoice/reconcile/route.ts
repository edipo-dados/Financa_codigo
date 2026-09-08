import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseInvoiceResponse } from '@/lib/invoiceParse'

export const maxDuration = 60
export const runtime = 'nodejs'

/**
 * POST /api/import-invoice/reconcile
 * Recebe os itens já extraídos + o total impresso da fatura + o texto de origem,
 * e pede ao modelo para CORRIGIR a lista até que a soma (valor do mês por item)
 * bata com o total. Não grava nada — só devolve a lista reconciliada.
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API Gemini não configurada' }, { status: 500 })
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const body = await request.json()
    const { invoiceTotal, currentItems, text, expenseCategories = [] } = body

    if (invoiceTotal == null || !Array.isArray(currentItems) || !text) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: invoiceTotal, currentItems, text' },
        { status: 400 }
      )
    }

    const categoriesText = expenseCategories.length > 0
      ? expenseCategories.map((c: any) => c.name).join(', ')
      : 'Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Outros'

    // Soma atual (valor do mês: parcela = amount/installments)
    const monthValue = (i: any) => {
      const inst = Number(i.installments) || 1
      const amt = Number(i.amount) || 0
      return inst > 1 ? amt / inst : amt
    }
    const currentSum = currentItems.reduce((s: number, i: any) => s + monthValue(i), 0)

    const prompt = `Você é um auditor de faturas de cartão de crédito. Recebeu uma lista de itens JÁ extraída de uma fatura, mas a SOMA dos itens NÃO bate com o TOTAL impresso na fatura. Seu trabalho é CORRIGIR a lista para que a soma feche exatamente com o total.

REGRA DE SOMA (muito importante):
- O valor que cada item contribui para a fatura DESTE mês é:
  - à vista: o valor cheio ("amount");
  - parcelada: o valor de UMA parcela = "amount" / "installments" (pois "amount" é o total da compra).
- A soma desses valores-do-mês de TODOS os itens deve ser IGUAL ao total impresso.

TOTAL IMPRESSO DA FATURA: R$ ${Number(invoiceTotal).toFixed(2)}
SOMA ATUAL DOS ITENS (valor do mês): R$ ${currentSum.toFixed(2)}
DIFERENÇA: R$ ${(currentSum - Number(invoiceTotal)).toFixed(2)} ${currentSum > Number(invoiceTotal) ? '(itens somam A MAIS)' : '(itens somam A MENOS)'}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

CAUSAS COMUNS a investigar e corrigir (nesta ordem):
1. DUPLICATA: o mesmo lançamento aparece duas vezes (some a mais). Remova a duplicata.
2. PARCELA COM VALOR ERRADO: um item parcelado com "amount" igual ao valor da PARCELA (não ao total), ou vice-versa. Ajuste "amount" para o TOTAL da compra e mantenha "installments".
3. ITEM FALTANDO: um lançamento do texto não foi extraído (soma a menos). Adicione-o.
4. ITEM INVENTADO/ERRADO: um item que não existe no texto (soma a mais). Remova-o.
5. VALOR LIDO ERRADO: dígito trocado no "amount". Corrija pelo texto.

Use o TEXTO ORIGINAL abaixo como fonte da verdade. Faça as correções necessárias para a soma dos valores-do-mês bater com o total impresso (tolerância de centavos por arredondamento).

ITENS ATUAIS (JSON):
${JSON.stringify(currentItems.map((i: any) => ({
  description: i.description,
  amount: Number(i.amount),
  installments: Number(i.installments) || 1,
  installment_number: Number(i.installment_number) || 1,
  classification: i.classification,
  purchase_date: i.purchase_date || null,
  category_hint: i.category_hint || '',
})), null, 0)}

TEXTO ORIGINAL DA FATURA:
"""
${String(text).slice(0, 24000)}
"""

RESPONDA APENAS COM JSON VÁLIDO neste formato (sem markdown, sem explicação):
{
  "items": [
    {
      "description": "NOME DO ESTABELECIMENTO",
      "amount": 100.00,
      "purchase_date": "2025-12-15",
      "classification": "nova_avista|nova_parcelada|parcela_existente|divergencia",
      "installment_number": 1,
      "installments": 1,
      "category_hint": "categoria",
      "location": "",
      "needs_review": false,
      "confidence": "high|medium|low"
    }
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent([{ text: prompt }])

    const parsed = parseInvoiceResponse(result.response.text())
    const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : []
    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Não foi possível reconciliar a fatura.' }, { status: 422 })
    }
    const items = rawItems.map((item) => {
      const installments = Number(item.installments) || 1
      const isParcelado = installments > 1
      let classification = item.classification
      if (!isParcelado && (classification === 'parcela_existente' || classification === 'divergencia')) {
        classification = 'nova_avista'
      }
      if (!classification) classification = isParcelado ? 'nova_parcelada' : 'nova_avista'
      const confidence = ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'high'
      return {
        description: item.description || 'Lançamento',
        amount: Number(item.amount) || 0,
        purchase_date: item.purchase_date || null,
        classification,
        installment_number: Number(item.installment_number) || 1,
        installments,
        category_hint: item.category_hint || '',
        location: item.location || '',
        needs_review: item.needs_review === true || confidence === 'low',
        confidence,
      }
    })

    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    console.error('Erro ao reconciliar fatura:', error)
    return NextResponse.json({ error: error.message || 'Erro interno na reconciliação' }, { status: 500 })
  }
}
