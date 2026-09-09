// Perfis de extração POR BANCO. Cada banco tem um layout de fatura diferente,
// então em vez de um prompt genérico, escolhemos instruções específicas do banco.
// O banco é detectado pelo nome do cartão e/ou pelo texto da fatura.

export type BankId = 'santander' | 'itau' | 'nubank' | 'generic'

export interface BankProfile {
  id: BankId
  label: string
  // Instruções específicas do layout deste banco (entram no prompt).
  instructions: string
}

// Detecta o banco a partir do nome do cartão e do texto extraído.
export function detectBank(cardName: string, invoiceText: string): BankId {
  const hay = `${cardName || ''}\n${(invoiceText || '').slice(0, 4000)}`.toLowerCase()
  if (/santander/.test(hay)) return 'santander'
  if (/\bita[uú]\b|itaucard|itau unibanco/.test(hay)) return 'itau'
  if (/nubank|nu pagamentos|roxinho/.test(hay)) return 'nubank'
  return 'generic'
}

const SANTANDER: BankProfile = {
  id: 'santander',
  label: 'Santander',
  instructions: `LAYOUT SANTANDER (siga à risca):
- A fatura pode ter VÁRIOS cartões/portadores. Cada bloco começa com algo como "EDIPO A SANTOS - 5228 XXXX XXXX 9064" ou "@ EDIPO A SANTOS - 5480 XXXX XXXX 3482". Processe TODOS os cartões.
- Dentro de cada cartão há seções com títulos:
  • "Pagamento e Demais Créditos" → NÃO extrair (são pagamentos/créditos, valores negativos, ex: "DEB AUTOM DE FATURA EM C/", "NVE*RENTCARSLTDA -0,02").
  • "Parcelamentos" → EXTRAIR. Cada linha: "Compra Data Descrição Parcela R$". Ex: "3 14/03 RE SP 06/10 1.356,25" => data 14/03, descrição "RE SP", parcela "06/10" (parcela 6 de 10), valor 1.356,25. O número solto no início ("3") é um ícone/contador, IGNORE-O.
  • "Despesas" → EXTRAIR. Esta é geralmente a MAIOR seção. Formato: "Data Descrição [Parcela] R$ [US$]". Ex: "02/08 IFD*DELL ITALIA PIZZAR 100,26", "16/08 MERCADOLIVRE*MERCADOL 01/02 88,75".
- COLUNA PARCELA: quando existir "NN/MM" (ex: "06/10", "04/04", "18/18", "01/02"), é a parcela NN de MM. O valor em R$ é o valor DA PARCELA daquele mês.
  • Se NN == 1 (ex: "01/02"): classification "nova_parcelada", installments = MM, amount = valor da parcela × MM (total da compra).
  • Se NN > 1 (ex: "06/10"): classification "parcela_existente", amount = valor da parcela impresso.
  • Sem "NN/MM": classification "nova_avista".
- LINHAS A IGNORAR (não são compras): "COTAÇÃO DOLAR R$ ...", "IOF DESPESA NO EXTERIOR", "VALOR TOTAL" (subtotal de seção), "Saldo Anterior", "Total de pagamentos", "Total de créditos", "Saldo Desta Fatura", "ANUIDADE DIFERENCIADA" com valor 0,00, e qualquer valor NEGATIVO.
- COMPRAS NO EXTERIOR: aparecem com valor em R$ e US$ (ex: "10/08 ANTHROPIC* CLAUDE SUB 116,55 21,60"). Use o valor em R$ (116,55). As linhas de cotação/IOF logo abaixo NÃO são itens.
- DESCRIÇÃO: use o texto do estabelecimento como está (ex: "IFD*BLUE BIRD PIZZARIA", "MERCADOLIVRE*MERCADOL", "APPLE COM/BILL"). Não invente categoria no lugar do nome.
- TOTAL DA FATURA ("invoice_total"): use a SOMA DAS COMPRAS. No "Resumo da Fatura", some "(+) Total Despesas/Débitos no Brasil" + "(+) Total Despesas/Débitos no Exterior" (em R$). NÃO use "Total a Pagar" nem "Saldo Desta Fatura" (incluem saldo anterior e pagamentos).`,
}

const ITAU: BankProfile = {
  id: 'itau',
  label: 'Itaú',
  instructions: `LAYOUT ITAÚ:
- Cada lançamento costuma ter DUAS linhas: linha 1 = NOME DO ESTABELECIMENTO (vai em "description"); linha 2 (menor) = categoria + cidade (vai em "category_hint" e "location", NUNCA em description).
- Parcelamento pode vir no fim do nome como "NN/MM" (ex: "CENTAURO CE34S 01/02" = parcela 1 de 2) ou em coluna de parcela.
  • NN==1: nova_parcelada, installments=MM, amount = parcela × MM.
  • NN>1: parcela_existente, amount = valor da parcela.
- Ignore pagamentos da fatura anterior, estornos, juros, IOF e anuidade.
- "invoice_total": use o total de lançamentos/compras da fatura (não valores que incluam saldo anterior).`,
}

const NUBANK: BankProfile = {
  id: 'nubank',
  label: 'Nubank',
  instructions: `LAYOUT NUBANK:
- Lançamentos em lista simples: "Data  Descrição  Valor". Parcelas aparecem como "Descrição - Parcela X/Y" ou "X/Y" ao lado.
  • X==1: nova_parcelada, installments=Y, amount = parcela × Y.
  • X>1: parcela_existente, amount = valor da parcela.
- Seções: "Transações" (extrair). Ignore "Pagamento recebido", estornos (negativos), "Saldo anterior", juros e IOF.
- "invoice_total": some as compras da fatura atual (não inclua saldo anterior nem pagamentos).`,
}

const GENERIC: BankProfile = {
  id: 'generic',
  label: 'Genérico',
  instructions: `LAYOUT DESCONHECIDO (raciocínio semântico, sem posição fixa):
- Identifique para cada compra: nome do estabelecimento (description), data, valor e parcela (se houver).
- Texto auxiliar (categoria, cidade/UF, bandeira) nunca substitui o nome do estabelecimento.
- Parcela no formato "NN/MM" (MM entre 2 e 48): NN==1 => nova_parcelada (amount = parcela×MM); NN>1 => parcela_existente (amount = parcela).
- Percorra TODAS as seções e TODOS os cartões, se houver mais de um. A seção de "Despesas"/"Compras" costuma ser a maior.
- Ignore pagamentos de fatura anterior, estornos/créditos (negativos), juros, IOF, cotação de dólar, saldo anterior e subtotais.
- "invoice_total": use a SOMA DAS COMPRAS (Brasil + Exterior). Nunca use "Total a Pagar"/"Saldo desta fatura".`,
}

const PROFILES: Record<BankId, BankProfile> = {
  santander: SANTANDER,
  itau: ITAU,
  nubank: NUBANK,
  generic: GENERIC,
}

export function getBankProfile(id: BankId): BankProfile {
  return PROFILES[id] || GENERIC
}
