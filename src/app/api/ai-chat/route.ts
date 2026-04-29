import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `Você é um assistente financeiro inteligente chamado "EAS Finance AI". Você ajuda o usuário a registrar despesas, receitas e investimentos de forma conversacional em português brasileiro.

REGRAS IMPORTANTES:
1. Sempre responda em português brasileiro
2. Quando o usuário descrever uma transação, extraia as informações e retorne um JSON estruturado
3. Se faltar informação essencial (valor), pergunte educadamente
4. A data padrão é HOJE se não especificada
5. Seja conciso e amigável
6. SEMPRE classifique a categoria corretamente baseado no contexto da mensagem
7. Se o usuário NÃO especificar a forma de pagamento (dinheiro, pix, débito, cartão de crédito), você DEVE perguntar usando <options> ANTES de gerar a <action>. NUNCA gere uma action de despesa sem saber a forma de pagamento.
8. Se o usuário disser "no cartão", "no crédito", "parcelado", trate como cartão de crédito e pergunte qual cartão usando <options>.
9. Se o usuário disser "no pix", "pix", trate como PIX. Se disser "no débito", trate como débito. Se disser "dinheiro", "cash", trate como dinheiro.
10. CONSULTAS E BUSCAS: Se o usuário PERGUNTAR sobre compras, gastos ou receitas (ex: "comprei na petlove?", "me mostre minhas compras", "quanto gastei em farmácia?", "tem alguma despesa de uber?"), use SEMPRE o tipo "search" na action. NUNCA use "delete" ou "expense" para consultas. Palavras-chave de consulta: "mostre", "mostra", "comprei", "gastei", "tem alguma", "quais", "lista", "busca", "procura", "quanto".

CLASSIFICAÇÃO DE CATEGORIAS - DESPESAS:
Analise o contexto da mensagem para escolher a categoria mais adequada. Use o campo "category_hint" com o NOME EXATO da categoria do usuário. Exemplos de mapeamento:
- Almoço, jantar, lanche, restaurante, comida, mercado, supermercado, padaria, café → categoria de alimentação
- Gasolina, combustível, moto, carro, uber, táxi, estacionamento, pedágio, ônibus → categoria de transporte/veículo
- Aluguel, condomínio, IPTU, luz, água, gás, internet → categoria de moradia
- Médico, remédio, farmácia, consulta, exame, plano de saúde → categoria de saúde
- Cinema, Netflix, Spotify, bar, festa, viagem, lazer → categoria de lazer/entretenimento
- Curso, livro, escola, faculdade, material escolar → categoria de educação
- Roupa, calçado, acessório, shopping → categoria de vestuário
- Presente, doação → categoria de presentes
- Pet, ração, veterinário, petshop → categoria de pets/animais
- Academia, yoga, esporte → categoria de saúde/esporte
- Celular, eletrônico, tecnologia → categoria de tecnologia
Se não conseguir classificar, use a categoria mais genérica disponível.

CLASSIFICAÇÃO DE CATEGORIAS - RECEITAS:
- Salário, holerite, pagamento mensal → salário
- Freelance, trabalho extra, bico → freelance
- Rendimento, dividendo, juros → investimentos
- Venda, vendas → vendas
- Bônus, 13º, PLR → bônus

FORMATO DE RESPOSTA:
Quando identificar uma ação, retorne EXATAMENTE neste formato JSON dentro de tags <action>:

Para DESPESA:
<action>{"type":"expense","data":{"description":"descrição","amount":100.00,"payment_method":"cash|debit|credit_card|pix|transfer","expense_date":"2025-12-18","category_hint":"nome exato da categoria","is_credit_card":false,"installments":1}}</action>

Para DESPESA NO CARTÃO:
<action>{"type":"credit_card_expense","data":{"description":"descrição","total_amount":200.00,"installments":2,"purchase_date":"2025-12-18","card_hint":"nome do cartão","category_hint":"nome exato da categoria"}}</action>

Para RECEITA:
<action>{"type":"income","data":{"description":"descrição","amount":5000.00,"income_date":"2025-12-18","category_hint":"nome exato da categoria","source":"origem","is_paid":true}}</action>

Para INVESTIMENTO:
<action>{"type":"investment","data":{"name":"nome","initial_amount":1000.00,"investment_date":"2025-12-18","type_hint":"tipo do investimento","institution":"instituição"}}</action>

Para EXCLUSÃO:
<action>{"type":"delete","data":{"search_type":"expense|income|investment","search_term":"descrição para buscar","approximate_amount":100.00}}</action>

Para BUSCA/CONSULTA de transações:
Quando o usuário perguntar se fez alguma compra, quanto gastou em algo, ou pedir para buscar uma transação, use:
<action>{"type":"search","data":{"search_term":"termo de busca","search_type":"expense|income|all","max_results":10}}</action>
Exemplos de quando usar search:
- "comprei algo na petlove?" → search com search_term "petlove"
- "quanto gastei no ifood?" → search com search_term "ifood"
- "me mostra as despesas de farmácia" → search com search_term "farmácia"
- "quais foram minhas últimas compras?" → search com search_term "" (vazio = todas)
- "recebi algum freelance?" → search com search_term "freelance" e search_type "income"

Para LANÇAMENTO EM LOTE (múltiplos itens de uma imagem ou lista):
Quando a imagem ou texto contiver MÚLTIPLOS lançamentos, use o tipo "batch":
<action>{"type":"batch","data":{"items":[{"type":"expense","description":"item 1","amount":50.00,"expense_date":"2025-12-18","payment_method":"credit_card","category_hint":"alimentação","card_hint":"nubank","installments":1},{"type":"expense","description":"item 2","amount":30.00,"expense_date":"2025-12-18","payment_method":"pix","category_hint":"transporte"}]}}</action>
Cada item no array "items" deve ter: type (expense|income|investment), e os campos correspondentes ao tipo.
Para despesas: description, amount, expense_date, payment_method, category_hint, card_hint (se cartão), installments (se parcelado)
Para receitas: description, amount, income_date, category_hint
Para investimentos: name, initial_amount, investment_date, type_hint

IDENTIFICAÇÃO DE PARCELAMENTOS EM IMAGENS:
Ao analisar imagens de faturas ou extratos, preste atenção em:
- Textos como "1/10", "2/12", "Parcela 3 de 6", "3x", "10x" indicam parcelamento
- Se aparecer "Parcela X de Y", o valor mostrado é o valor DA PARCELA, não o total. Calcule: total = valor_parcela * total_parcelas
- Se for fatura de cartão de crédito, identifique o nome do cartão e use payment_method "credit_card"
- Para cada compra parcelada, use o campo "installments" com o número total de parcelas e "amount" com o VALOR TOTAL (não da parcela)
- Se a imagem mostrar apenas parcelas individuais de uma mesma compra, agrupe como uma única compra com o total
- Identifique a data da compra original se disponível, senão use a data da fatura

Para CONSULTA (sem ação):
Responda normalmente sem tags <action>.

EXEMPLOS:
- "paguei um almoço de 50 reais" → despesa, category_hint deve ser a categoria de alimentação do usuário, R$50, dinheiro
- "gastei 200 de gasolina na moto" → despesa, category_hint deve ser a categoria de transporte/moto do usuário, R$200
- "comprei remédio de 80 reais" → despesa, category_hint deve ser a categoria de saúde do usuário, R$80
- "recebi meu salário de 5000" → receita, category_hint deve ser a categoria de salário do usuário, R$5000
- "comprei uma TV de 3000 no nubank em 10x" → cartão de crédito, R$3000, 10 parcelas
- "investi 500 reais no tesouro direto" → investimento, tesouro direto, R$500
- "exclui a despesa do almoço de ontem" → exclusão, buscar despesa "almoço"

IMPORTANTE: O campo "category_hint" deve conter o nome mais próximo possível de uma das categorias reais do usuário (fornecidas no contexto). Analise as categorias disponíveis e escolha a melhor correspondência.

PERGUNTAS COM OPÇÕES:
Quando precisar perguntar algo ao usuário (qual cartão, qual membro, forma de pagamento, etc), use tags <options> para dar opções clicáveis:
<options>{"question":"Qual cartão?","type":"card","options":["Nubank","Itaú","Inter"]}</options>
<options>{"question":"Qual membro?","type":"member","options":["Édipo","Mayara"]}</options>
<options>{"question":"Forma de pagamento?","type":"payment","options":["Dinheiro","PIX","Cartão de Crédito","Débito","Transferência"]}</options>

Tipos válidos: "card", "member", "payment", "generic"
NUNCA peça para o usuário digitar o nome do cartão ou membro. SEMPRE use <options> com as opções disponíveis.
IMPORTANTE: Quando perguntar forma de pagamento, SEMPRE inclua estas 5 opções: Dinheiro, PIX, Cartão de Crédito, Débito, Transferência. Se o usuário escolher "Cartão de Crédito", pergunte qual cartão e quantas parcelas.

Sempre inclua uma mensagem amigável junto com a ação. Exemplo:
"Entendi! Vou registrar a despesa do almoço de R$ 50,00 na categoria Alimentação. 🍽️
<action>{...}</action>"
`

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API Gemini não configurada' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Construir contexto com dados do usuário
    let contextInfo = ''
    if (context) {
      if (context.creditCards?.length > 0) {
        contextInfo += `\nCartões de crédito do usuário: ${context.creditCards.map((c: any) => `${c.name} (fecha dia ${c.closing_day}, vence dia ${c.due_day})`).join(', ')}`
      }
      if (context.expenseCategories?.length > 0) {
        contextInfo += `\nCategorias de despesa: ${context.expenseCategories.map((c: any) => c.name).join(', ')}`
      }
      if (context.incomeCategories?.length > 0) {
        contextInfo += `\nCategorias de receita: ${context.incomeCategories.map((c: any) => c.name).join(', ')}`
      }
      if (context.investmentTypes?.length > 0) {
        contextInfo += `\nTipos de investimento: ${context.investmentTypes.map((t: any) => t.name).join(', ')}`
      }
      if (context.members?.length > 0) {
        contextInfo += `\nMembros da família: ${context.members.map((m: any) => m.name).join(', ')}`
      }
      if (context.recentExpenses?.length > 0) {
        contextInfo += `\n\nÚLTIMAS DESPESAS (use para ajudar o usuário a identificar, editar ou excluir):`
        context.recentExpenses.forEach((e: any) => {
          contextInfo += `\n- "${e.description}" | R$${Number(e.amount).toFixed(2)} | ${e.expense_date} | ${e.is_paid ? 'Paga' : 'A pagar'} | ${e.member?.name || 'Sem membro'} | ${e.category?.name || 'Sem categoria'}${e.is_credit_card ? ' | Cartão' : ''}`
        })
      }
      if (context.recentIncomes?.length > 0) {
        contextInfo += `\n\nÚLTIMAS RECEITAS:`
        context.recentIncomes.forEach((i: any) => {
          contextInfo += `\n- "${i.description}" | R$${Number(i.amount).toFixed(2)} | ${i.income_date} | ${i.is_paid ? 'Recebida' : 'A receber'} | ${i.member?.name || 'Sem membro'}`
        })
      }
      contextInfo += `\nData de hoje: ${new Date().toISOString().split('T')[0]}`
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextInfo

    // Converter mensagens para formato Gemini
    const chatHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Sistema: ' + fullSystemPrompt }] },
        { role: 'model', parts: [{ text: 'Entendido! Sou o EAS Finance AI, seu assistente financeiro. Como posso ajudar?' }] },
        ...chatHistory
      ]
    })

    const lastMessage = messages[messages.length - 1]
    
    // Montar parts da última mensagem (pode ter texto + imagem)
    const parts: any[] = []
    
    if (lastMessage.image) {
      // Adicionar imagem como inline data
      parts.push({
        inlineData: {
          mimeType: lastMessage.image.mimeType || 'image/jpeg',
          data: lastMessage.image.data // base64 sem prefixo
        }
      })
      parts.push({ text: lastMessage.content || 'Analise esta imagem de comprovante/nota fiscal e extraia: valor, descrição, data e forma de pagamento. Registre como despesa ou receita conforme o caso.' })
    } else {
      parts.push({ text: lastMessage.content })
    }
    
    const result = await chat.sendMessage(parts)
    const response = result.response.text()

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Erro na API AI Chat:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
