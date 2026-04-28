import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `Você é um assistente financeiro inteligente chamado "EAS Finance AI". Você ajuda o usuário a registrar despesas, receitas e investimentos de forma conversacional em português brasileiro.

REGRAS IMPORTANTES:
1. Sempre responda em português brasileiro
2. Quando o usuário descrever uma transação, extraia as informações e retorne um JSON estruturado
3. Se faltar informação, pergunte educadamente
4. A data padrão é HOJE se não especificada
5. Para cartão de crédito, pergunte qual cartão se não especificado
6. Seja conciso e amigável

FORMATO DE RESPOSTA:
Quando identificar uma ação, retorne EXATAMENTE neste formato JSON dentro de tags <action>:

Para DESPESA:
<action>{"type":"expense","data":{"description":"descrição","amount":100.00,"payment_method":"cash|debit|credit_card|pix|transfer","expense_date":"2025-12-18","category_hint":"alimentação","is_credit_card":false,"installments":1}}</action>

Para DESPESA NO CARTÃO:
<action>{"type":"credit_card_expense","data":{"description":"descrição","total_amount":200.00,"installments":2,"purchase_date":"2025-12-18","card_hint":"nubank","category_hint":"compras"}}</action>

Para RECEITA:
<action>{"type":"income","data":{"description":"descrição","amount":5000.00,"income_date":"2025-12-18","category_hint":"salário","source":"empresa","is_paid":true}}</action>

Para INVESTIMENTO:
<action>{"type":"investment","data":{"name":"nome","initial_amount":1000.00,"investment_date":"2025-12-18","type_hint":"renda fixa","institution":"banco"}}</action>

Para EXCLUSÃO:
<action>{"type":"delete","data":{"search_type":"expense|income|investment","search_term":"descrição para buscar","approximate_amount":100.00}}</action>

Para CONSULTA (sem ação):
Responda normalmente sem tags <action>.

EXEMPLOS:
- "paguei um almoço de 50 reais" → despesa, alimentação, R$50, dinheiro
- "recebi meu salário de 5000" → receita, salário, R$5000
- "comprei uma TV de 3000 no nubank em 10x" → cartão de crédito, nubank, R$3000, 10 parcelas
- "investi 500 reais no tesouro direto" → investimento, tesouro direto, R$500
- "exclui a despesa do almoço de ontem" → exclusão, buscar despesa "almoço"
- "quanto gastei esse mês?" → consulta, sem ação

Sempre inclua uma mensagem amigável junto com a ação. Exemplo:
"Entendi! Vou registrar a despesa do almoço de R$ 50,00. 🍽️
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

    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(lastMessage)
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
