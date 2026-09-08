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
      expenseCategories = [],
      batchInfo // { index, total } quando a fatura é enviada em lotes
    } = body

    // Normalizar para uma lista de imagens
    const imageList: { data: string; mimeType?: string }[] = Array.isArray(files) && files.length > 0
      ? files
      : file?.data
        ? [file]
        : []

    console.log('📄 Import invoice:', {
      pageCount: imageList.length,
      mimeTypes: imageList.map(i => i.mimeType),
      totalDataLength: imageList.reduce((s, i) => s + (i.data?.length || 0), 0)
    })

    if (!userId || !creditCardId || !invoiceMonth || imageList.length === 0) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, creditCardId, invoiceMonth, files' },
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

PARCELAS JÁ LANÇADAS NO SISTEMA PARA ESTE PERÍODO (use APENAS para classificar parcelas, ver regra de duplicidade abaixo):
${existingText}

CATEGORIAS DISPONÍVEIS: ${categoriesText}

COMO LER CADA LANÇAMENTO (MUITO IMPORTANTE):
Cada lançamento da fatura costuma ter DUAS linhas:
  - Linha 1 (principal): o NOME DO ESTABELECIMENTO. É isso que vai no campo "description".
    Exemplos reais: "PADARIA DELLA MARISSO", "ZandrashyComercioSAO PA", "SPLIT HORTIFRUTTSAO PAU".
  - Linha 2 (menor, abaixo): a CATEGORIA + CIDADE. Isso vai SÓ em "category_hint" (categoria) e "location" (cidade), NUNCA em "description".
    Exemplos: "supermercado SAO PAULO", "OUTROS SAO PAULO".

REGRA ABSOLUTA sobre a descrição:
- "description" DEVE ser sempre o nome do estabelecimento (Linha 1).
- NUNCA use a linha de categoria+cidade (ex: "SUPERMERCADO SAO PAULO", "OUTROS SAO PAULO") como "description".
- Se dois lançamentos diferentes ficarem com a MESMA descrição genérica, você está lendo a linha errada. Volte e pegue o nome do estabelecimento de cada um.
- Exemplo: Linha 1 = "PADARIA DELLA MARISSO", Linha 2 = "supermercado SAO PAULO"
  => description = "PADARIA DELLA MARISSO", category_hint = "alimentação/supermercado", location = "SAO PAULO".

PARCELAMENTO INDICADO NO NOME DO ESTABELECIMENTO (IMPORTANTE):
Alguns lojistas imprimem o parcelamento DENTRO do próprio nome do estabelecimento, no formato NN/MM no FINAL do texto (ex: "CENTAURO CE34S 01/02" = parcela 1 de 2; "MAGAZINE LUIZA 03/10" = parcela 3 de 10).
- Reconheça como parcela quando houver "NN/MM" (dois números separados por barra) no fim do nome, com MM entre 2 e 48.
- Nesse caso o VALOR IMPRESSO na linha costuma ser o valor DA PARCELA.
- Se for a parcela 1 (ex: "01/02"): classifique como "nova_parcelada", com "installments" = MM, "installment_number" = 1 e "amount" = valor impresso × MM (valor total da compra).
- Se for parcela maior que 1 (ex: "02/02", "03/10"): classifique como "parcela_existente" (siga a regra de conferência), "amount" = valor impresso (da parcela).
- Gere SEMPRE UM ÚNICO item para esse lançamento — nunca dois.
- Ao preencher "description", VOCÊ PODE manter o nome como está; o importante é a classificação e o installments/installment_number corretos.

CUIDADO PARA NÃO CONFUNDIR (evitar falso positivo):
- Códigos de terminal/loja NÃO são parcela. Ex: "0001", "57290030", "CE34S" sozinhos, ou números sem barra.
- Só trate como parcela quando o padrão for exatamente NN/MM (barra entre dois números pequenos), tipicamente no fim do texto, e MM entre 2 e 48.
- Números grandes (ex: "01/2025" que é data, ou "57290030") NÃO são parcela.

TAREFA:
Extraia TODAS as compras/lançamentos do documento, na ordem em que aparecem. NÃO agrupe nem descarte linhas parecidas — é normal haver várias compras diferentes no mesmo mercado no mês, cada uma é um item separado. Mas cada linha de lançamento gera NO MÁXIMO UM item (nunca duplique a mesma linha).

Classifique cada item em um dos tipos:
- "nova_avista": compra SEM indicação de parcelamento (sem "X/Y", ou "1/1"). SEMPRE trate como nova. NUNCA marque uma compra à vista como já existente.
- "nova_parcelada": compra parcelada mostrando a PRIMEIRA parcela (ex: "1/6", "1/12").
- "parcela_existente": SOMENTE para itens que a fatura mostra como PARCELADOS (com "X/Y", X>1) E que correspondem claramente a uma parcela na lista de "PARCELAS JÁ LANÇADAS" acima (mesmo estabelecimento e mesmo valor de parcela). NÃO gera novo lançamento.
- "divergencia": item PARCELADO (com "X/Y", X>1) que aparenta ser de compra antiga mas NÃO tem correspondência na lista acima. Precisa revisão manual.

REGRA DE DUPLICIDADE (crítica):
- A checagem de "parcela_existente" só vale para itens PARCELADOS (com "X/Y"). 
- Para compras À VISTA (sem "X/Y"), NUNCA use "parcela_existente" nem "divergencia" — toda compra à vista da fatura é um item novo ("nova_avista"), mesmo que a descrição seja parecida com outra.

OUTRAS REGRAS:
- Ignore linhas de pagamento de fatura anterior, estornos, juros e anuidade recorrente (a menos que seja claramente uma despesa de compra).
- Para "nova_parcelada", "amount" = VALOR TOTAL da compra (valor da parcela × número de parcelas); "installments" = total de parcelas.
- Para "nova_avista" e "parcela_existente", "amount" = valor exibido na linha.
- Para parcelas, informe "installment_number" (parcela atual) e "installments" (total).
- Classifique na categoria mais adequada. Se não tiver certeza, use "category_hint": "" (o sistema deixará sem categoria) — mas MESMO ASSIM inclua o item.
- Informe o valor total impresso na fatura em "invoice_total". A soma dos "amount" de "nova_avista" + parcela atual dos parcelados + "parcela_existente" deve bater com o total da fatura.

RESPONDA APENAS COM JSON VÁLIDO neste formato exato (sem markdown, sem explicação):
{
  "invoice_total": 1234.56,
  "items": [
    {
      "description": "NOME DO ESTABELECIMENTO (linha 1)",
      "amount": 100.00,
      "purchase_date": "2025-12-15",
      "classification": "nova_avista|nova_parcelada|parcela_existente|divergencia",
      "installment_number": 1,
      "installments": 1,
      "category_hint": "nome da categoria (da linha 2)",
      "location": "cidade (da linha 2)"
    }
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Validar dados das imagens
    const invalid = imageList.some(img => !img.data || img.data.length < 100)
    if (invalid) {
      return NextResponse.json(
        { error: 'Arquivo inválido ou vazio. Tente enviar novamente.' },
        { status: 422 }
      )
    }

    // Cada página vira um part inlineData. Prompt indica que são páginas de uma mesma fatura.
    const imageParts = imageList.map(img => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        // Limpar base64 de quebras de linha e espaços que podem corromper o dado
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

    const result = await model.generateContent([
      ...imageParts,
      { text: prompt + multiPageNote }
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

      return {
        description: item.description || 'Lançamento',
        amount,
        purchase_date: item.purchase_date || null,
        classification,
        installment_number: installmentNumber,
        installments,
        category_hint: item.category_hint || '',
        location: item.location || '',
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
