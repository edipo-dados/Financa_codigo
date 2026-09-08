import jsPDF from 'jspdf'

export const generateManualPDF = () => {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const lineHeight = 6
  let currentY = margin

  const checkPageBreak = (neededHeight: number = lineHeight) => {
    if (currentY + neededHeight > pageHeight - margin - 15) {
      doc.addPage()
      currentY = margin
    }
  }

  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(color[0], color[1], color[2])
    
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
    
    for (const line of lines) {
      checkPageBreak()
      doc.text(line, margin, currentY)
      currentY += lineHeight
    }
    
    doc.setTextColor(0, 0, 0)
  }

  const addMainTitle = (title: string) => {
    checkPageBreak(lineHeight * 3)
    currentY += 8
    doc.setFillColor(0, 122, 255)
    doc.rect(margin - 5, currentY - 8, pageWidth - 2 * margin + 10, 15, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, currentY)
    doc.setTextColor(0, 0, 0)
    currentY += 12
  }

  const addTitle = (title: string, fontSize: number = 12) => {
    checkPageBreak(lineHeight * 2)
    currentY += 5
    addText(title, fontSize, true, [0, 122, 255])
    currentY += 3
  }

  const addSubtitle = (subtitle: string, fontSize: number = 11) => {
    checkPageBreak(lineHeight * 1.5)
    currentY += 3
    addText(subtitle, fontSize, true, [51, 51, 51])
    currentY += 2
  }

  const addListItem = (text: string, level: number = 0) => {
    const indent = margin + (level * 10)
    checkPageBreak()
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('-', indent, currentY)
    
    const lines = doc.splitTextToSize(text, pageWidth - indent - 10)
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) checkPageBreak()
      doc.text(lines[i], indent + 6, currentY)
      if (i < lines.length - 1) currentY += lineHeight
    }
    currentY += lineHeight
  }

  // === CAPA ===
  doc.setFillColor(0, 122, 255)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Manual do Usuario', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text('EAS Controle Financeiro', pageWidth / 2, 35, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text('Versao 2.0.0 - Guia Completo', pageWidth / 2, 45, { align: 'center' })
  
  currentY = 70
  doc.setTextColor(0, 0, 0)

  // === INDICE ===
  addMainTitle('INDICE')
  addText('1. Sobre a Aplicacao')
  addText('2. Assistente IA (EAS Finance AI)')
  addText('3. Dashboard')
  addText('4. Gestao de Receitas')
  addText('5. Controle de Despesas')
  addText('6. Investimentos')
  addText('7. Cartoes de Credito')
  addText('8. Lancamentos Futuros')
  addText('9. Gestao Familiar')
  addText('10. APIs REST')
  addText('11. Configuracoes')
  addText('12. Uso Mobile')
  addText('13. Solucao de Problemas')

  // === 1. SOBRE ===
  doc.addPage()
  currentY = margin

  addMainTitle('1. SOBRE A APLICACAO')
  
  addText('O EAS Controle Financeiro e um sistema inteligente de gestao financeira pessoal e familiar com assistente de IA integrado. Controle receitas, despesas, investimentos e cartoes de credito com uma interface moderna, responsiva e conversacional.')
  
  currentY += 5
  addTitle('Principais Caracteristicas')
  addListItem('Assistente IA: registre transacoes por texto ou foto')
  addListItem('Dashboard inteligente com saldo acumulado')
  addListItem('Gestao de receitas e despesas com recorrencia')
  addListItem('Investimentos com controle de resgates')
  addListItem('Cartoes de credito com parcelas automaticas')
  addListItem('Gestao familiar com filtro por membro')
  addListItem('APIs REST para integracao externa')
  addListItem('Interface responsiva (mobile e desktop)')
  addListItem('Atualizacoes em tempo real')

  // === 2. IA ===
  addMainTitle('2. ASSISTENTE IA (EAS Finance AI)')
  
  addText('O assistente financeiro com inteligencia artificial permite registrar e consultar transacoes de forma conversacional. Acesse pelo botao de chat no canto inferior direito.')
  
  currentY += 3
  addTitle('Registrar Transacoes por Texto')
  addText('Exemplos de comandos:')
  addListItem('"Paguei 50 de almoco no pix" - registra despesa')
  addListItem('"Comprei TV de 3000 no Nubank em 10x" - compra parcelada')
  addListItem('"Recebi salario de 5000" - registra receita')
  addListItem('"Investi 500 no Tesouro" - registra investimento')
  
  addTitle('Buscar Transacoes')
  addText('Pergunte sobre suas compras:')
  addListItem('"Comprei algo na Petlove?" - busca por loja')
  addListItem('"Gastos com saude" - busca por categoria')
  addListItem('"Quanto gastei no iFood?" - busca com total')
  addListItem('"Minhas ultimas compras" - lista recentes')
  
  addTitle('Analise de Comprovantes')
  addText('Envie uma foto de comprovante, nota fiscal ou fatura de cartao. A IA extrai automaticamente: valor, descricao, data e forma de pagamento.')
  
  addTitle('Lancamento em Lote')
  addText('Envie uma imagem de fatura de cartao e a IA identifica multiplas compras, criando todas de uma vez com parcelas e categorias.')
  
  addTitle('Exclusao por Comando')
  addListItem('"Exclui a despesa do almoco" - remove transacao')
  addListItem('"Apaga a receita do freelance" - remove receita')

  // === 3. DASHBOARD ===
  addMainTitle('3. DASHBOARD')
  
  addTitle('Filtro Global de Mes')
  addText('O navegador de mes no topo serve para todas as abas do sistema. Ao mudar o mes, receitas, despesas e investimentos sao filtrados automaticamente.')
  
  addTitle('Saldo Acumulado do Ano')
  addText('Mostra o saldo de janeiro ate o mes selecionado:')
  addListItem('Saldo = Receitas - Despesas - Investimentos liquidos')
  addListItem('Investimento liquido = valor investido - resgates')
  addListItem('Linha discreta mostra saldo sem investimentos e valor investido')
  addListItem('O total do ano bate exatamente com a soma dos meses')
  
  addTitle('Saldo do Mes')
  addText('Receitas menos despesas do mes selecionado. Nao desconta investimentos.')
  
  addTitle('Card de Investimentos')
  addText('Mostra de forma discreta: valor investido liquido, valor atual, rendimento e resgates.')
  
  addTitle('Filtro por Membro')
  addText('Filtre todos os dados do dashboard por membro da familia.')

  // === 4. RECEITAS ===
  addMainTitle('4. GESTAO DE RECEITAS')
  
  addTitle('Cadastrar Receita')
  addListItem('Acesse a aba "Receitas"')
  addListItem('Clique em "+ Nova Receita"')
  addListItem('Campos obrigatorios: valor, data, descricao')
  addListItem('Campos opcionais: categoria, fonte, membro')
  
  addTitle('Receitas Recorrentes')
  addListItem('Marque "Receita recorrente"')
  addListItem('Frequencias: diaria, semanal, mensal, anual')
  addListItem('Termino: sem fim, apos X ocorrencias, ou ate data')
  addListItem('Ocorrencias virtuais sao geradas automaticamente')
  addListItem('Cada ocorrencia pode ser editada ou excluida individualmente')
  
  addTitle('Filtros')
  addListItem('Por membro da familia')
  addListItem('Por categoria')
  addListItem('Por status (recebida / a receber)')
  addListItem('Por busca textual')

  // === 5. DESPESAS ===
  addMainTitle('5. CONTROLE DE DESPESAS')
  
  addTitle('Cadastrar Despesa')
  addListItem('Acesse a aba "Despesas"')
  addListItem('Clique em "+ Nova Despesa"')
  addListItem('Campos obrigatorios: valor, data, descricao')
  addListItem('Formas de pagamento: dinheiro, debito, PIX, transferencia, cartao de credito')
  
  addTitle('Despesas Recorrentes')
  addText('Mesma logica das receitas recorrentes. Ocorrencias virtuais podem ser excluidas individualmente.')
  
  addTitle('Selecao Multipla')
  addListItem('Clique em "Selecionar" para ativar modo de selecao')
  addListItem('Marque varias despesas')
  addListItem('Clique em "Pagar Selecionadas" para marcar todas como pagas')
  
  addTitle('Faturas de Cartao')
  addText('Despesas de cartao sao agrupadas por cartao e mes. E possivel pagar a fatura inteira com um clique.')

  // === 6. INVESTIMENTOS ===
  addMainTitle('6. INVESTIMENTOS')
  
  addTitle('Cadastrar Investimento')
  addListItem('Nome, tipo, instituicao, valor investido, data')
  addListItem('Tipos personalizaveis (Renda Fixa, Variavel, etc.)')
  
  addTitle('Resgates')
  addListItem('Registre resgates parciais ou totais')
  addListItem('Historico completo de transacoes')
  addListItem('Valor atual atualizado automaticamente')
  
  addTitle('No Dashboard')
  addText('Investimentos sao descontados do saldo acumulado. O valor liquido (investido - resgatado) e o que conta.')

  // === 7. CARTOES ===
  addMainTitle('7. CARTOES DE CREDITO')
  
  addTitle('Cadastrar Cartao')
  addListItem('Nome, dia de fechamento, dia de vencimento, limite, cor')
  addListItem('Acesse em Configuracoes > Cartoes de Credito')
  
  addTitle('Compras Parceladas')
  addListItem('Informe valor total e numero de parcelas')
  addListItem('Datas calculadas automaticamente pelo dia de fechamento')
  addListItem('Cada parcela e controlada separadamente')
  addListItem('Parcelas nao contam como duplicata no total de despesas')

  // === 8. FUTUROS ===
  addMainTitle('8. LANCAMENTOS FUTUROS')
  
  addText('A secao "Futuros" mostra receitas e despesas futuras baseadas em recorrencias e parcelas de cartao. Permite visualizar de 1 a 12 meses a frente.')

  // === 9. FAMILIA ===
  addMainTitle('9. GESTAO FAMILIAR')
  
  addListItem('Cadastre membros da familia com nome, cor e relacionamento')
  addListItem('Associe receitas e despesas a membros especificos')
  addListItem('Filtre o dashboard e listas por membro')
  addListItem('Relatorios individuais por membro')

  // === 10. APIs ===
  addMainTitle('10. APIs REST')
  
  addText('O sistema oferece APIs REST completas para integracao com outros sistemas e aplicacoes de IA:')
  currentY += 3
  addListItem('GET/POST /api/expenses - Despesas')
  addListItem('GET/POST /api/incomes - Receitas')
  addListItem('GET /api/summary - Resumo financeiro')
  addListItem('GET /api/members - Membros da familia')
  addListItem('GET/POST /api/credit-cards - Cartoes de credito')
  addListItem('GET/POST /api/credit-card-purchases - Compras parceladas')
  addListItem('GET/POST /api/categories - Categorias')
  addListItem('POST /api/ai-chat - Chat com IA')
  currentY += 3
  addText('Consulte o arquivo API_DOCUMENTATION.md para detalhes completos de cada endpoint.')

  // === 11. CONFIG ===
  addMainTitle('11. CONFIGURACOES')
  
  addListItem('Membros da familia: cadastro e gerenciamento')
  addListItem('Informe de rendimentos: relatorio anual em PDF')
  addListItem('Tema: modo claro/escuro')
  addListItem('Cartoes de credito: cadastro e edicao')
  addListItem('Categorias de receita: personalizaveis')
  addListItem('Categorias de despesa: personalizaveis')
  addListItem('Tipos de investimento: personalizaveis')

  // === 12. MOBILE ===
  addMainTitle('12. USO MOBILE')
  
  addTitle('Navegacao')
  addText('No mobile, o menu inferior possui 5 abas: Dashboard, Despesas, Receitas, Cartoes e Configuracoes. Todas as funcionalidades estao disponiveis.')
  
  addTitle('Chat IA')
  addText('O botao de chat fica no canto inferior direito. Funciona perfeitamente no celular para registrar transacoes rapidamente.')

  // === 13. PROBLEMAS ===
  addMainTitle('13. SOLUCAO DE PROBLEMAS')
  
  addSubtitle('Problemas de Login')
  addListItem('Verifique email e senha')
  addListItem('Use modo demo: demo@demo.com / 123456')
  addListItem('Limpe o cache do navegador')
  
  addSubtitle('Dados nao Aparecem')
  addListItem('Verifique o mes selecionado no filtro')
  addListItem('Aguarde sincronizacao')
  addListItem('Recarregue a pagina')
  
  addSubtitle('IA nao Responde')
  addListItem('Verifique conexao com internet')
  addListItem('A chave GEMINI_API_KEY deve estar configurada')
  addListItem('Tente reformular a pergunta')

  // === RODAPE ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
    doc.text('EAS Controle Financeiro v2.0.0', margin, pageHeight - 8)
    doc.text('Manual do Usuario', pageWidth / 2, pageHeight - 8, { align: 'center' })
  }

  return doc
}

export const downloadManualPDF = () => {
  try {
    const doc = generateManualPDF()
    doc.save('Manual-EAS-Controle-Financeiro-v2.0.0.pdf')
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar o PDF. Tente novamente.')
  }
}
