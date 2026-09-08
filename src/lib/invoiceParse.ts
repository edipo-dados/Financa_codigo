// Parser tolerante para a resposta do Gemini na análise de faturas.
// O modelo às vezes devolve JSON truncado (quando a resposta é longa) ou com
// markdown ao redor. Aqui tentamos recuperar o máximo de itens possível.

export interface ParsedInvoice {
  invoice_total: number | null
  items: any[]
}

// Extrai objetos JSON completos de dentro de um trecho que representa um array.
// Percorre caractere a caractere respeitando strings/escapes e coleta cada
// objeto de nível superior fechado corretamente (ignora um último objeto cortado).
function extractObjects(arrayBody: string): any[] {
  const objs: any[] = []
  let depth = 0
  let start = -1
  let inStr = false
  let esc = false

  for (let i = 0; i < arrayBody.length; i++) {
    const ch = arrayBody[i]
    if (inStr) {
      if (esc) { esc = false }
      else if (ch === '\\') { esc = true }
      else if (ch === '"') { inStr = false }
      continue
    }
    if (ch === '"') { inStr = true; continue }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        const chunk = arrayBody.slice(start, i + 1)
        try {
          objs.push(JSON.parse(chunk))
        } catch {
          // objeto malformado individual: ignora
        }
        start = -1
      }
    }
  }
  return objs
}

/**
 * Faz o parse da resposta textual do Gemini de forma robusta.
 * 1. Remove markdown.
 * 2. Tenta JSON.parse direto.
 * 3. Se falhar, extrai o total e recupera itens completos de um array truncado.
 */
export function parseInvoiceResponse(responseText: string): ParsedInvoice {
  let text = (responseText || '').trim()
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // 1) Tentativa direta
  try {
    const parsed = JSON.parse(text)
    return {
      invoice_total: parsed.invoice_total ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    }
  } catch {
    // segue para recuperação
  }

  // 2) Tentar extrair o bloco { ... } e parsear
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0])
      return {
        invoice_total: parsed.invoice_total ?? null,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      }
    } catch {
      // segue para recuperação parcial
    }
  }

  // 3) Recuperação parcial de JSON truncado
  let invoiceTotal: number | null = null
  const totalMatch = text.match(/"invoice_total"\s*:\s*(null|[0-9]+(?:\.[0-9]+)?)/i)
  if (totalMatch && totalMatch[1] !== 'null') {
    const n = Number(totalMatch[1])
    if (!Number.isNaN(n)) invoiceTotal = n
  }

  const itemsIdx = text.search(/"items"\s*:\s*\[/)
  if (itemsIdx !== -1) {
    const bracketStart = text.indexOf('[', itemsIdx)
    const arrayBody = text.slice(bracketStart + 1)
    const items = extractObjects(arrayBody)
    return { invoice_total: invoiceTotal, items }
  }

  return { invoice_total: invoiceTotal, items: [] }
}
