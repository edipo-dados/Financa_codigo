import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/import-invoice/gemini-key
 * Devolve a chave do Gemini para uso NO NAVEGADOR na análise de fatura.
 *
 * Motivo: no plano Hobby da Vercel as funções serverless têm teto de 10s, e a
 * análise via Gemini ultrapassa isso. Por isso a análise roda no cliente, que
 * não tem limite de tempo. Esta rota entrega a chave sem exigir uma variável
 * NEXT_PUBLIC_ duplicada — reaproveita a GEMINI_API_KEY já configurada.
 *
 * Observação de segurança: isto expõe a chave a quem usar o app. Para um app
 * financeiro pessoal é aceitável; recomenda-se restringir a chave no Google
 * AI Studio (por referrer/HTTP) para limitar uso indevido.
 */
export async function GET() {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  if (!key) {
    return NextResponse.json({ error: 'Chave do Gemini não configurada' }, { status: 500 })
  }
  return NextResponse.json({ key })
}
