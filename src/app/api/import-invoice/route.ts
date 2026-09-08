import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/import-invoice
 * Analisa uma fatura (PDF ou imagem) e extrai as compras.
 * NÃO grava nada no banco - apenas retorna os itens extraídos e classificados.
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API Gemini não configurada' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const {
      userId,
      creditCardId,
      invoiceMonth, // formato "YYYY-MM"
      file, // { data: base64, mimeType: string }
      expenseCategories = []
    } = body

    if (!userId || !creditCardId || !invoiceMonth || !file?.data) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, creditCardId, invoiceMonth, file' },
        { status: 400 }
      )
    }

    // 1. Buscar dados do cartão
    const { data: card, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', creditCardId)
      .eq('user_id', userId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 })
    }

    // 2. Buscar parcelas já lançadas do cartão no período da fatura
    // Período: mês de vencimento selecionado
    const [year, month] = invoiceMonth.split('-').map(Number)
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: existingInstallments } = await supabase
      .from('expenses')
      .select('id, description, amount, installment_number, installments, total_amount, purchase_date, expense_date')
      .eq('user_id', userId)
      .eq('credit_card_id', creditCardId)
      .eq('is_credit_card', true)
      .eq('is_installment', true)
      .gte('expense_date', periodStart)
      .lte('expense_date', periodEnd)

    const existingList = existingInstallments || []

    // 3. Montar prompt para o Gemini
    const categoriesText = expenseCategories.length > 0
      ? expenseCategories.map((c: any) => c.name).join(', ')
      : 'Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Outros'

    const existingText = existingList.length > 0
      ? existingList.map((e: any) =>
          `- "${e.description}" | valor parcela R$${Number(e.amount).toFixed(2)} | parcela ${e.installment_number}/${e.installments} | total R$${Number(e.total_amount || 0).toFixed(2)}`
        ).join('\n')
      : 'Nenhuma parcela já lançada neste período.'

    const prompt = `Você é um especialista em análise de faturas de cartão de crédito brasileiras.

CARTÃO: ${card.name} (fecha dia ${card.closing_day}, vence dia ${card.due_day})
COMPETÊNCIA DA FATURA: ${invoiceMonth}

PARCELAS JÁ LANÇADAS NO SISTEMA PARA ESTE PERÍODO:
${existingText}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

TAREFA:
Analise o documento da fatura anexado e extraia TODAS as compras/lançamentos. Para cada item, classifique em um dos tipos:
- "nova_avista": compra nova, sem parcelamento (ex: sem indicação de parcela, ou "1/1")
- "nova_parcelada": compra nova parcelada na PRIMEIRA parcela (ex: "1/6", "1/12")
- "parcela_existente": parcela de uma compra que JÁ ESTÁ na lista de parcelas já lançadas acima (ex: "4/10" que corresponde a algo já lançado). NÃO deve gerar novo lançamento.
- "divergencia": parcela que aparenta ser de compra antiga (ex: "5/12") mas NÃO tem correspondência na lista de parcelas já lançadas. Precisa revisão manual.

REGRAS:
- Ignore linhas de pagamento de fatura anterior, estornos, juros, anuidade recorrente (a menos que seja claramente uma despesa).
- Para "nova_parcelada", o campo "amount" deve ser o VALOR TOTAL da compra (valor da parcela × número de parcelas), e "installments" o total de parcelas.
- Para "nova_avista" e "parcela_existente", "amount" é o valor exibido na linha.
- Para parcelas, identifique installment_number (parcela atual) e installments (total).
- Classifique cada item na categoria mais adequada.
- Se identificar o valor total da fatura no documento, informe em "invoice_total".

RESPONDA APENAS COM JSON VÁLIDO neste formato exato (sem markdown, sem explicação):
{
  "invoice_total": 1234.56,
  "items": [
    {
      "description": "Nome da loja/compra",
      "amount": 100.00,
      "purchase_date": "2025-12-15",
      "classification": "nova_avista|nova_parcelada|parcela_existente|divergencia",
      "installment_number": 1,
      "installments": 1,
      "category_hint": "nome da categoria"
    }
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.mimeType || 'application/pdf',
          data: file.data
        }
      },
      { text: prompt }
    ])

    let responseText = result.response.text().trim()

    // Limpar markdown se houver
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(responseText)
    } catch {
      // Tentar extrair JSON do texto
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json(
          { error: 'Não foi possível interpretar a fatura. Tente uma imagem/PDF mais nítido.' },
          { status: 422 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      card,
      invoiceMonth,
      invoiceTotal: parsed.invoice_total || null,
      items: parsed.items || [],
      existingInstallments: existingList
    })
  } catch (error: any) {
    console.error('Erro ao importar fatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar fatura' },
      { status: 500 }
    )
  }
}
