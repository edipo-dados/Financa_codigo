// Processamento de PDF no cliente (navegador) usando pdfjs-dist.
// Rasteriza cada página em imagem base64 para envio ao Gemini.
// Suporta PDFs protegidos por senha (senha usada apenas em memória, nunca persistida).

import * as pdfjsLib from 'pdfjs-dist'

// Configurar o worker do pdf.js. Usa o worker empacotado via URL do módulo.
if (typeof window !== 'undefined') {
  // @ts-ignore - import de worker como URL (suportado pelo bundler do Next)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
}

export interface PdfPageImage {
  data: string // base64 sem prefixo data:
  mimeType: string
}

// Erro específico quando o PDF precisa de senha (ou a senha está errada).
export class PdfPasswordError extends Error {
  readonly needsPassword: boolean
  readonly wrongPassword: boolean
  constructor(needsPassword: boolean, wrongPassword: boolean) {
    super(wrongPassword ? 'Senha incorreta' : 'PDF protegido por senha')
    this.name = 'PdfPasswordError'
    this.needsPassword = needsPassword
    this.wrongPassword = wrongPassword
  }
}

// Limite total aproximado do payload de imagens (base64) em bytes.
// Mantido abaixo do limite de request do Gemini. Base64 ~= 1.37x do binário.
const MAX_TOTAL_BASE64_BYTES = 14 * 1024 * 1024 // ~14MB de base64

interface RasterizeOptions {
  maxTotalBase64Bytes?: number
}

// Detecta se o arquivo é um PDF.
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

// Tenta abrir o documento. Lança PdfPasswordError se precisar de senha.
async function openDocument(data: ArrayBuffer, password?: string) {
  const loadingTask = pdfjsLib.getDocument({
    data: data.slice(0), // cópia: pdf.js consome/detacha o buffer
    password: password || undefined,
  })

  try {
    return await loadingTask.promise
  } catch (err: any) {
    // pdf.js expõe nomes/códigos para exceções de senha
    const name = err?.name || ''
    const code = err?.code
    // PasswordException.code: 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD
    if (name === 'PasswordException' || code === 1 || code === 2) {
      const wrongPassword = code === 2 || (!!password && code !== 1)
      throw new PdfPasswordError(true, wrongPassword)
    }
    throw err
  }
}

/**
 * Rasteriza todas as páginas de um PDF em imagens base64.
 * - Sem senha: passe apenas o arquivo.
 * - Com senha: passe a senha (usada só aqui, em memória).
 * Ajusta escala/qualidade automaticamente para caber no limite de payload.
 */
export async function rasterizePdf(
  file: File,
  password?: string,
  options: RasterizeOptions = {}
): Promise<PdfPageImage[]> {
  const maxTotal = options.maxTotalBase64Bytes ?? MAX_TOTAL_BASE64_BYTES
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await openDocument(arrayBuffer, password)
  const numPages = pdf.numPages

  // Escolher escala com base no número de páginas para controlar o tamanho.
  // Menos páginas => maior resolução; mais páginas => menor resolução.
  let scale: number
  if (numPages <= 2) scale = 2.0
  else if (numPages <= 5) scale = 1.6
  else if (numPages <= 10) scale = 1.3
  else scale = 1.0

  // Qualidade JPEG: usada quando há várias páginas para reduzir tamanho.
  const useJpeg = numPages > 1
  let jpegQuality = numPages <= 3 ? 0.85 : numPages <= 8 ? 0.75 : 0.65

  const renderAll = async (renderScale: number, quality: number): Promise<PdfPageImage[]> => {
    const images: PdfPageImage[] = []
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: renderScale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Não foi possível criar o contexto de renderização')

      // Fundo branco (PDFs podem ter transparência)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise

      const dataUrl = useJpeg
        ? canvas.toDataURL('image/jpeg', quality)
        : canvas.toDataURL('image/png')

      const base64 = dataUrl.split(',')[1]
      images.push({
        data: base64,
        mimeType: useJpeg ? 'image/jpeg' : 'image/png',
      })

      // Liberar canvas
      canvas.width = 0
      canvas.height = 0
    }
    return images
  }

  // Renderiza e, se estourar o limite, reduz qualidade/escala e tenta de novo.
  let images = await renderAll(scale, jpegQuality)
  let attempts = 0
  const totalBytes = (imgs: PdfPageImage[]) =>
    imgs.reduce((sum, i) => sum + Math.ceil((i.data.length * 3) / 4), 0)

  while (totalBytes(images) > maxTotal && attempts < 4) {
    attempts++
    scale = Math.max(0.7, scale * 0.8)
    jpegQuality = Math.max(0.45, jpegQuality - 0.1)
    images = await renderAll(scale, useJpeg ? jpegQuality : 1)
  }

  await pdf.cleanup()
  await pdf.destroy()

  return images
}


// Resultado do processamento de um PDF para importação de fatura.
// - kind 'text': PDF digital com texto selecionável (mais confiável que imagem)
// - kind 'images': PDF escaneado/sem texto útil -> páginas rasterizadas
export type PdfImportResult =
  | { kind: 'text'; text: string; pageCount: number }
  | { kind: 'images'; pages: PdfPageImage[]; pageCount: number }

// Extrai o texto selecionável de todas as páginas. Retorna null se o PDF
// praticamente não tiver texto (provável scan/imagem).
export async function extractPdfText(file: File, password?: string): Promise<{ text: string; pageCount: number } | null> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await openDocument(arrayBuffer, password)
  const numPages = pdf.numPages

  const parts: string[] = []
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    // Reconstruir linhas usando a posição vertical dos itens (transform[5] = y).
    // Itens com y próximo pertencem à mesma linha; ordenamos por x dentro da linha.
    const items = (content.items as any[]).filter(it => typeof it.str === 'string')
    const rows: { y: number; items: { x: number; str: string }[] }[] = []
    for (const it of items) {
      const x = it.transform?.[4] ?? 0
      const y = it.transform?.[5] ?? 0
      let row = rows.find(r => Math.abs(r.y - y) < 3)
      if (!row) {
        row = { y, items: [] }
        rows.push(row)
      }
      row.items.push({ x, str: it.str })
    }
    rows.sort((a, b) => b.y - a.y) // topo -> base
    const pageText = rows
      .map(r => r.items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')

    if (pageText) parts.push(`--- Página ${pageNum} ---\n${pageText}`)
  }

  await pdf.cleanup()
  await pdf.destroy()

  const fullText = parts.join('\n\n').trim()
  // Heurística: pouquíssimo texto => provavelmente é um scan/imagem
  if (fullText.replace(/[^A-Za-zÀ-ÿ0-9]/g, '').length < 40) {
    return null
  }
  return { text: fullText, pageCount: numPages }
}

/**
 * Processa um PDF para importação de fatura escolhendo a melhor estratégia:
 * 1. Tenta extrair texto selecionável (PDF digital) — mais confiável.
 * 2. Se não houver texto útil (scan), rasteriza as páginas em imagens.
 * Suporta senha (usada só em memória). Lança PdfPasswordError se necessário.
 */
export async function processPdfForImport(file: File, password?: string): Promise<PdfImportResult> {
  const textResult = await extractPdfText(file, password)
  if (textResult) {
    return { kind: 'text', text: textResult.text, pageCount: textResult.pageCount }
  }
  const pages = await rasterizePdf(file, password)
  return { kind: 'images', pages, pageCount: pages.length }
}
