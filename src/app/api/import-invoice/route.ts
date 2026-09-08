import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Permitir payloads maiores (PDFs em base64) e mais tempo de processamento
export const maxDuration = 60
export const runtime = 'nodejs'

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
      files, // [{ data: base64, mimeType: string }] - páginas rasterizadas
      file, // compat: { data: base64, mimeType: string } (imagem única)
      text, // texto selecionável extraído de PDF digital (preferencial)
      expenseCategories = [],
      batchInfo // { index, total } quando a fatura é enviada em lotes
    } = body

    // Fonte da análise: texto (PDF digital) OU imagens (scan/senha)
    const invoiceText: string = typeof text === 'string' ? text.trim() : ''
    const imageList: { data: string; mimeType?: string }[] = Array.isArray(files) && files.length > 0
      ? files
      : file?.data
        ? [file]
        : []

    console.log('📄 Import invoice:', {
      mode: invoiceText ? 'text' : 'images',
      textLength: invoiceText.length,
      pageCount: imageList.length,
    })

    if (!userId || !creditCardId || !invoiceMonth || (!invoiceText && imageList.length === 0)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, creditCardId, invoiceMonth, e (text OU files)' },
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

    const prompt = `Você é um especialista em análise de faturas de cartão de crédito de QUALQUER banco brasileiro (Nubank, Itaú, Bradesco, Santander, Inter, C6, XP, Caixa, etc). Cada banco organiza a fatura de um jeito diferente — NÃO existe posição fixa para cada informação. Raciocine sobre o SIGNIFICADO de cada texto, não sobre onde ele aparece.

CARTÃO: ${card.name} (fecha dia ${card.closing_day}, vence dia ${card.due_day})
COMPETÊNCIA DA FATURA: ${invoiceMonth}

PARCELAS JÁ LANÇADAS NO SISTEMA PARA ESTE PERÍODO (use APENAS para conferir parcelas, ver regra de duplicidade):
${existingText}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

COMO IDENTIFICAR CADA LANÇAMENTO (raciocínio semântico, sem regra de posição):
Para cada compra, identifique de forma independente, esteja onde estiver no layout:
1. NOME DO ESTABELECIMENTO/LOJA (quem recebeu o pagamento). Geralmente é o texto em destaque, com nome de empresa reconhecível, sigla, ou padrão tipo "NOME*CODIGO", "NOME LTDA", "EC *NOME". Vai em "description".
2. DATA da compra.
3. VALOR da compra.
4. INDICADOR DE PARCELA, quando existir (ver seção abaixo).

REGRA ABSOLUTA sobre a descrição:
- "description" é SEMPRE o nome do estabelecimento/loja.
- Texto auxiliar — categoria (ex: "supermercado", "restaurante"), cidade/UF (ex: "SAO PAULO SP"), bandeira, "referência" — NUNCA substitui o nome do estabelecimento, mesmo que apareça mais perto do valor ou em destaque.
- Se você só conseguir ver categoria+cidade e não o nome real da loja, preencha "description" com o que tiver E marque "needs_review": true (não invente).
- Categoria vai em "category_hint"; cidade vai em "location".

DETECÇÃO DE PARCELAMENTO (cobrir formatos de vários bancos):
A indicação de "isto é uma parcela" aparece de formas diferentes. Procure ATIVAMENTE em QUALQUER parte do texto do lançamento por:
- Sufixo no nome: "LOJA X 03/10", "LOJA X (3/10)"
- Coluna/campo dedicado: "3/10", "3 de 10"
- Texto explícito: "PARC 03/10", "PARCELA 3 DE 10", "1a de 10", "3x de ..."
- O padrão geral é "número pequeno / número pequeno" (ou com "de"/"x"), onde o total (MM) faz sentido como número de parcelas: entre 2 e 48.
Regras ao detectar parcela:
- Parcela 1 (ex: "01/10", "1 de 10"): "classification" = "nova_parcelada", "installments" = MM, "installment_number" = 1, "amount" = VALOR TOTAL. Se o valor impresso for o da parcela, calcule total = parcela × MM. Se o banco já mostrar o total da compra, use o total.
- Parcela > 1 (ex: "03/10"): "classification" = "parcela_existente" (siga a conferência), "amount" = valor da parcela impresso.
- Gere SEMPRE UM ÚNICO item por lançamento — nunca dois.
NÃO confunda com números que NÃO são parcela: código de terminal/loja ("0001", "57290030"), CNPJ parcial, ou datas ("01/2025" tem MM=2025, inválido). Só é parcela se MM entre 2 e 48 e fizer sentido. Na dúvida, trate como à vista e marque "needs_review": true.
Cartões de débito/pré-pago normalmente NÃO têm parcelamento — não invente parcela nesses casos.

CLASSIFICAÇÃO:
- "nova_avista": compra sem parcelamento. NUNCA marque à vista como já existente.
- "nova_parcelada": compra parcelada mostrando a 1a parcela.
- "parcela_existente": SÓ para itens PARCELADOS (parcela > 1) que correspondem a algo na lista de "PARCELAS JÁ LANÇADAS". Não gera novo lançamento.
- "divergencia": item parcelado (parcela > 1) sem correspondência na lista. Precisa revisão.
Duplicidade: a checagem de "parcela_existente" só vale para parcelas. Compras à vista são sempre novas, mesmo com descrição parecida.

INCERTEZA (importante):
- Se NÃO conseguir separar estabelecimento de categoria com confiança, ou não tiver certeza se há parcela, ainda assim INCLUA o item e marque "needs_review": true.
- Preencha "confidence" com "high", "medium" ou "low".
- É melhor marcar para revisão do que chutar uma estrutura errada com confiança alta.

OUTRAS REGRAS:
- Extraia TODOS os lançamentos, na ordem. Não agrupe nem descarte linhas parecidas. Cada linha gera NO MÁXIMO UM item.
- Ignore pagamento de fatura anterior, estornos, juros e anuidade recorrente (a menos que seja claramente uma compra).
- Informe o total impresso da fatura em "invoice_total" (null se não aparecer).

EXEMPLOS GENÉRICOS DE LAYOUTS DIFERENTES (fictícios, para você generalizar):
[Banco A] "15/03  PADARIA DO ZE          supermercado SP     45,90"
  => description "PADARIA DO ZE", category_hint "supermercado", location "SP", à vista, amount 45.90
[Banco B] "MERCADOLIVRE*COMPRA   Parcela 2/6    R$ 89,90   12 ABR"
  => description "MERCADOLIVRE*COMPRA", parcela 2 de 6 => parcela_existente, amount 89.90, installments 6, installment_number 2
[Banco C] "AMAZON BR 01/12   ELETRONICOS   199,00   05/05/2025"
  => description "AMAZON BR", parcela 1 de 12 => nova_parcelada, amount = 199 × 12 = 2388.00 (se 199 for a parcela), installments 12
[Banco D] "UBER *TRIP HELP.UBER.C   transporte   RIO DE JANEIRO   23,50"
  => description "UBER *TRIP", category_hint "transporte", location "RIO DE JANEIRO", à vista

RESPONDA APENAS COM JSON VÁLIDO neste formato exato (sem markdown, sem explicação):
{
  "invoice_total": 1234.56,
  "items": [
    {
      "description": "NOME DO ESTABELECIMENTO",
      "amount": 100.00,
      "purchase_date": "2025-12-15",
      "classification": "nova_avista|nova_parcelada|parcela_existente|divergencia",
      "installment_number": 1,
      "installments": 1,
      "category_hint": "categoria (se identificável)",
      "location": "cidade/UF (se identificável)",
      "needs_review": false,
      "confidence": "high|medium|low"
    }
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let parts: any[]

    if (invoiceText) {
      // Modo TEXTO (PDF digital): mais confiável que OCR de imagem.
      const isBatched = batchInfo && Number(batchInfo.total) > 1
      const batchNote = isBatched
        ? `\n\nOBSERVAÇÃO: Este é o TRECHO ${Number(batchInfo.index) + 1} de ${Number(batchInfo.total)} do texto de UMA ÚNICA fatura. Extraia as compras APENAS deste trecho. O total impresso da fatura pode não estar neste trecho; se não aparecer, use "invoice_total": null.`
        : ''
      parts = [
        { text: prompt + batchNote + `\n\nA seguir está o TEXTO EXTRAÍDO da fatura (pode conter marcações "--- Página N ---"). Analise-o integralmente:\n\n"""\n${invoiceText}\n"""` }
      ]
    } else {
      // Modo IMAGEM (scan/senha): validar e enviar cada página como inlineData.
      const invalid = imageList.some(img => !img.data || img.data.length < 100)
      if (invalid) {
        return NextResponse.json(
          { error: 'Arquivo inválido ou vazio. Tente enviar novamente.' },
          { status: 422 }
        )
      }

      const imageParts = imageList.map(img => ({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.data.replace(/\s/g, '')
        }
      }))

      const isBatched = batchInfo && Number(batchInfo.total) > 1
      let multiPageNote = ''
      if (isBatched) {
        multiPageNote = `\n\nOBSERVAÇÃO: Esta é a PARTE ${Number(batchInfo.index) + 1} de ${Number(batchInfo.total)} de UMA ÚNICA fatura, dividida em lotes de páginas. Extraia as compras APENAS das imagens anexadas neste lote, na ordem em que aparecem. O total impresso da fatura pode não estar neste lote; se não aparecer, use "invoice_total": null.`
      } else if (imageList.length > 1) {
        multiPageNote = `\n\nOBSERVAÇÃO: As ${imageList.length} imagens anexadas são páginas sequenciais de UMA ÚNICA fatura. Trate-as como um único documento e extraia as compras de todas as páginas, na ordem em que aparecem.`
      }

      parts = [...imageParts, { text: prompt + multiPageNote }]
    }

    const result = await model.generateContent(parts)

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

    // Pós-processamento defensivo: garantir que nenhuma compra à vista seja
    // descartada como "já existente". A checagem de duplicidade só vale para
    // itens realmente parcelados (installments > 1).
    const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : []
    const items = rawItems.map((item) => {
      let installments = Number(item.installments) || 1
      let installmentNumber = Number(item.installment_number) || 1
      let amount = Number(item.amount) || 0
      let classification = item.classification

      // Rede de segurança: detectar parcelamento "NN/MM" no fim do nome do
      // estabelecimento (ex: "CENTAURO CE34S 01/02"), caso a IA não tenha tratado.
      // MM entre 2 e 48. Ignora números grandes (datas/códigos como "01/2025").
      const desc = String(item.description || '')
      const parcelaMatch = desc.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b\s*$/)
      if (parcelaMatch) {
        const nn = parseInt(parcelaMatch[1], 10)
        const mm = parseInt(parcelaMatch[2], 10)
        if (mm >= 2 && mm <= 48 && nn >= 1 && nn <= mm) {
          // Só sobrescreve se a IA ainda não tinha reconhecido este parcelamento
          if (installments <= 1) {
            installments = mm
            installmentNumber = nn
            if (nn === 1) {
              // valor impresso é o da parcela => total = parcela * MM
              amount = amount * mm
              classification = 'nova_parcelada'
            } else {
              // parcela > 1: valor impresso é o da parcela; conferência com o banco
              classification = classification === 'divergencia' ? 'divergencia' : 'parcela_existente'
            }
          }
        }
      }

      const isParcelado = installments > 1

      // À vista nunca pode ser parcela_existente/divergencia
      if (!isParcelado && (classification === 'parcela_existente' || classification === 'divergencia')) {
        classification = 'nova_avista'
      }
      // Item parcelado sem classificação coerente cai em nova_parcelada por padrão
      if (isParcelado && classification !== 'parcela_existente' && classification !== 'divergencia' && classification !== 'nova_parcelada') {
        classification = 'nova_parcelada'
      }
      // Sem classificação => à vista nova
      if (!classification) {
        classification = isParcelado ? 'nova_parcelada' : 'nova_avista'
      }

      const confidence = ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'high'
      const needsReview = item.needs_review === true || confidence === 'low'

      return {
        description: item.description || 'Lançamento',
        amount,
        purchase_date: item.purchase_date || null,
        classification,
        installment_number: installmentNumber,
        installments,
        category_hint: item.category_hint || '',
        location: item.location || '',
        needs_review: needsReview,
        confidence,
      }
    })

    return NextResponse.json({
      success: true,
      card,
      invoiceMonth,
      invoiceTotal: parsed.invoice_total || null,
      items,
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
