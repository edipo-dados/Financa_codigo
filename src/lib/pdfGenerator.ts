import jsPDF from 'jspdf'

export const generateManualPDF = () => {
  const doc = new jsPDF()
  
  // Configurações do documento
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const lineHeight = 6
  let currentY = margin

  // Função para adicionar nova página se necessário
  const checkPageBreak = (neededHeight: number = lineHeight) => {
    if (currentY + neededHeight > pageHeight - margin - 15) {
      doc.addPage()
      currentY = margin
    }
  }

  // Função para adicionar texto com quebra de linha
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
    
    // Reset color to black
    doc.setTextColor(0, 0, 0)
  }

  // Função para adicionar título principal
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

  // Função para adicionar título
  const addTitle = (title: string, fontSize: number = 12) => {
    checkPageBreak(lineHeight * 2)
    currentY += 5
    addText(title, fontSize, true, [0, 122, 255])
    currentY += 3
  }

  // Função para adicionar subtítulo
  const addSubtitle = (subtitle: string, fontSize: number = 11) => {
    checkPageBreak(lineHeight * 1.5)
    currentY += 3
    addText(subtitle, fontSize, true, [51, 51, 51])
    currentY += 2
  }

  // Função para adicionar item de lista
  const addListItem = (text: string, level: number = 0) => {
    const indent = margin + (level * 10)
    checkPageBreak()
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('•', indent, currentY)
    
    const lines = doc.splitTextToSize(text, pageWidth - indent - 10)
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) checkPageBreak()
      doc.text(lines[i], indent + 8, currentY)
      if (i < lines.length - 1) currentY += lineHeight
    }
    currentY += lineHeight
  }

  // Cabeçalho do documento
  doc.setFillColor(0, 122, 255)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Manual do Usuário', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text('Controle Financeiro Pessoal', pageWidth / 2, 35, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text('Versão 1.0.0 - Guia Completo', pageWidth / 2, 45, { align: 'center' })
  
  currentY = 70
  doc.setTextColor(0, 0, 0)

  // Índice
  addMainTitle('📋 Índice')
  addText('1. Sobre a Aplicação .................................................. 3')
  addText('2. Primeiros Passos .................................................... 4')
  addText('3. Dashboard - Visão Geral .......................................... 5')
  addText('4. Gestão de Receitas ................................................ 7')
  addText('5. Controle de Despesas ............................................. 9')
  addText('6. Acompanhamento de Investimentos ................................. 11')
  addText('7. Gestão de Cartões de Crédito .................................... 13')
  addText('8. Lançamentos Futuros .............................................. 15')
  addText('9. Configurações e Personalização .................................. 17')
  addText('10. Uso Mobile ....................................................... 18')
  addText('11. Atualizações em Tempo Real ...................................... 19')
  addText('12. Solução de Problemas ............................................. 20')

  // Nova página para o conteúdo
  doc.addPage()
  currentY = margin

  // Conteúdo do manual
  addMainTitle('📱 1. Sobre a Aplicação')
  
  addText('O Controle Financeiro Pessoal é uma aplicação web moderna e intuitiva para gerenciar suas finanças pessoais de forma completa e organizada. Com interface responsiva e atualizações em tempo real, você pode controlar receitas, despesas, investimentos e cartões de crédito em um só lugar.')
  
  currentY += 5
  addTitle('✨ Principais Características')
  addListItem('📊 Dashboard Configurável: Widgets personalizáveis com drag & drop')
  addListItem('💰 Gestão de Receitas: Controle completo de entradas financeiras')
  addListItem('💸 Controle de Despesas: Organização detalhada de gastos')
  addListItem('📈 Acompanhamento de Investimentos: Monitore seu patrimônio')
  addListItem('💳 Gestão de Cartões: Controle de compras parceladas')
  addListItem('🔮 Projeções Futuras: Visualize lançamentos futuros')
  addListItem('📱 Mobile First: Interface otimizada para celular')
  addListItem('⚡ Tempo Real: Atualizações instantâneas sem recarregar página')

  addMainTitle('🚀 2. Primeiros Passos')
  
  addTitle('Acesso à Aplicação')
  addListItem('Acesse a aplicação através do navegador')
  addListItem('Faça login com suas credenciais ou use o modo demo:')
  addListItem('Email: demo@demo.com', 1)
  addListItem('Senha: 123456', 1)

  addTitle('Navegação Principal')
  addText('A aplicação possui 8 seções principais:')
  addListItem('📊 Visão Geral (Dashboard): Painel principal com widgets configuráveis')
  addListItem('💰 Receitas: Cadastro e gestão de entradas financeiras')
  addListItem('💸 Despesas: Registro e controle de gastos')
  addListItem('📈 Investimentos: Acompanhamento de aplicações')
  addListItem('🔮 Futuros: Visualização de lançamentos futuros')
  addListItem('💳 Cartão: Gestão de cartões de crédito')
  addListItem('⚙️ Configurações: Gerenciamento de categorias e configurações')
  addListItem('📱 Sobre: Informações da aplicação e este manual')

  addMainTitle('📊 3. Dashboard - Visão Geral')
  
  addTitle('Widgets Disponíveis')
  addListItem('📈 Cards de Estatísticas: Resumo financeiro do mês com totais de receitas, despesas e saldo')
  addListItem('📊 Gráfico de Receitas: Visualização das receitas por categoria em gráfico de pizza interativo')
  addListItem('📉 Gráfico de Despesas: Análise de gastos por categoria com identificação dos maiores gastos')
  addListItem('🎯 KPIs Configuráveis: Indicadores personalizáveis para acompanhar metas e objetivos')
  addListItem('🧠 Análises Inteligentes: Insights automáticos sobre seus gastos com sugestões de economia')
  addListItem('💳 Widget de Cartões: Resumo das compras no cartão com próximos vencimentos')
  addListItem('💰 Saldo Atual: Saldo total independente do mês selecionado')
  addListItem('🔮 Projeções Futuras: Receitas e despesas futuras baseadas em recorrências')

  addTitle('Personalização do Dashboard')
  addText('O dashboard é completamente personalizável:')
  addListItem('Clique no botão "⚙️ Configurar Widgets"')
  addListItem('Use os controles para mostrar/ocultar widgets')
  addListItem('Arraste e solte widgets para reposicionar')
  addListItem('Redimensione widgets conforme necessário')
  addListItem('4 tamanhos disponíveis: Pequeno (1x1), Médio (2x1), Grande (2x2), Extra Grande (3x2)')

  addMainTitle('💰 4. Gestão de Receitas')
  
  addTitle('Cadastrar Nova Receita')
  addText('Para adicionar uma nova receita:')
  addListItem('Acesse a aba "Receitas"')
  addListItem('Clique em "+ Nova Receita"')
  addListItem('Preencha os campos obrigatórios:')
  addListItem('Valor: Quantia recebida', 1)
  addListItem('Data: Data do recebimento', 1)
  addListItem('Descrição: Detalhes da receita', 1)
  addListItem('Preencha os campos opcionais:')
  addListItem('Categoria: Tipo de receita para organização', 1)
  addListItem('Fonte/Origem: De onde veio a receita', 1)

  addTitle('Receitas Recorrentes')
  addText('Para receitas que se repetem regularmente:')
  addListItem('Marque a opção "Receita recorrente"')
  addListItem('Escolha a frequência:')
  addListItem('Diária: Para receitas diárias', 1)
  addListItem('Semanal: Para receitas semanais', 1)
  addListItem('Mensal: Para salários e receitas mensais', 1)
  addListItem('Anual: Para receitas anuais', 1)
  addListItem('Defina quando a recorrência deve terminar:')
  addListItem('Sem fim: Receita continua indefinidamente', 1)
  addListItem('Após X ocorrências: Para um número específico de repetições', 1)
  addListItem('Até data específica: Para terminar em uma data determinada', 1)

  addTitle('Gerenciar Receitas')
  addListItem('Alterar Status: Clique no status para alternar entre "Recebido" e "A Receber"')
  addListItem('Excluir: Clique em "Excluir" na linha desejada e confirme a exclusão')
  addListItem('Visualizar: Todas as receitas são listadas em ordem cronológica')

  addMainTitle('💸 5. Controle de Despesas')
  
  addTitle('Cadastrar Nova Despesa')
  addText('Para registrar uma nova despesa:')
  addListItem('Acesse a aba "Despesas"')
  addListItem('Clique em "+ Nova Despesa"')
  addListItem('Preencha os dados:')
  addListItem('Valor: Quantia gasta (obrigatório)', 1)
  addListItem('Data: Data da despesa (obrigatório)', 1)
  addListItem('Descrição: Detalhes do gasto (obrigatório)', 1)
  addListItem('Categoria: Tipo de despesa para organização', 1)
  addListItem('Forma de Pagamento: Como foi realizado o pagamento', 1)

  addTitle('Formas de Pagamento')
  addText('Opções disponíveis para pagamento:')
  addListItem('Dinheiro: Pagamento em espécie')
  addListItem('Débito: Cartão de débito')
  addListItem('PIX: Transferência instantânea')
  addListItem('Transferência: Transferência bancária')
  addListItem('Cartão de Crédito: Sistema completo de parcelamento')

  addTitle('Sistema de Cartão de Crédito')
  addText('Para compras no cartão de crédito:')
  addListItem('Selecione "Cartão de Crédito" como forma de pagamento')
  addListItem('Escolha o cartão cadastrado')
  addListItem('Informe o valor total da compra')
  addListItem('Defina o número de parcelas (1 a 48)')
  addListItem('Confirme a data da compra')
  addListItem('O sistema calculará automaticamente as datas das parcelas baseadas no fechamento do cartão')

  addMainTitle('📈 6. Acompanhamento de Investimentos')
  
  addTitle('Cadastrar Investimento')
  addText('Para adicionar um novo investimento:')
  addListItem('Acesse a aba "Investimentos"')
  addListItem('Clique em "+ Novo Investimento"')
  addListItem('Preencha as informações:')
  addListItem('Nome: Identificação do investimento (ex: Tesouro Selic 2027)', 1)
  addListItem('Tipo: Categoria do investimento (Renda Fixa, Variável, etc.)', 1)
  addListItem('Instituição: Corretora ou banco onde está aplicado', 1)
  addListItem('Valor Investido: Quantia aplicada inicialmente', 1)
  addListItem('Data de Aplicação: Quando o investimento foi feito', 1)
  addListItem('Rentabilidade Esperada: Percentual anual esperado (opcional)', 1)

  addTitle('Acompanhamento de Performance')
  addText('O sistema calcula automaticamente:')
  addListItem('Retorno Absoluto: Valor em R$ ganho ou perdido')
  addListItem('Retorno Percentual: Porcentagem de rentabilidade')
  addListItem('Comparação Visual: Cores indicativas (verde para ganho, vermelho para perda)')
  addListItem('Histórico: Acompanhamento da evolução do investimento')

  addMainTitle('💳 7. Gestão de Cartões de Crédito')
  
  addTitle('Cadastrar Cartão')
  addText('Para adicionar um novo cartão:')
  addListItem('Acesse "Configurações"')
  addListItem('Vá para a seção "Cartões de Crédito"')
  addListItem('Clique em "+ Novo Cartão"')
  addListItem('Configure as informações:')
  addListItem('Nome: Identificação do cartão (ex: Nubank, Itaú)', 1)
  addListItem('Dia de Fechamento: Quando a fatura fecha (1-31)', 1)
  addListItem('Dia de Vencimento: Quando vence o pagamento (1-31)', 1)
  addListItem('Limite: Valor limite do cartão (opcional)', 1)
  addListItem('Cor: Para identificação visual nos relatórios', 1)

  addTitle('Compras Parceladas')
  addText('O sistema gerencia automaticamente:')
  addListItem('Cálculo de Datas: Baseado no dia de fechamento do cartão')
  addListItem('Parcelas Individuais: Cada parcela é controlada separadamente')
  addListItem('Status de Pagamento: Controle individual por parcela')
  addListItem('Visualização Organizada: Lista específica na aba "Cartão"')

  addMainTitle('🔮 8. Lançamentos Futuros')
  
  addTitle('Visualização de Projeções')
  addText('A seção "Futuros" mostra:')
  addListItem('Receitas Futuras: Baseadas em recorrências configuradas')
  addListItem('Despesas Futuras: Gastos programados e recorrentes')
  addListItem('Investimentos Futuros: Aplicações planejadas')
  addListItem('Análise Histórica: Projeções baseadas em padrões passados')

  addTitle('Controles Disponíveis')
  addListItem('Filtro por Período: Visualize de 1 a 12 meses à frente')
  addListItem('Filtro por Tipo: Todos, receitas, despesas ou investimentos')
  addListItem('Seleção Múltipla: Para exclusão em lote de lançamentos')
  addListItem('Modo de Seleção: Interface dedicada para seleções múltiplas')

  addTitle('Gerenciamento de Lançamentos')
  addListItem('Exclusão Individual: Clique no ícone de lixeira do item')
  addListItem('Exclusão em Lote: Use o modo de seleção para marcar múltiplos itens')
  addListItem('Confirmação: Sistema avisa sobre o impacto da exclusão')
  addListItem('Atualização Automática: Dados sempre atualizados em tempo real')

  addMainTitle('⚙️ 9. Configurações e Personalização')
  
  addTitle('Categorias Personalizáveis')
  addText('Organize suas finanças com categorias:')
  addListItem('Categorias de Despesas: Alimentação, Transporte, Lazer, etc.')
  addListItem('Categorias de Receitas: Salário, Freelance, Investimentos, etc.')
  addListItem('Tipos de Investimentos: Renda Fixa, Variável, Fundos, etc.')
  addListItem('Cores Personalizáveis: Para identificação visual nos gráficos')

  addTitle('Relatórios')
  addListItem('Informe de Rendimentos: Relatório anual completo')
  addListItem('Seletor de Ano: Escolha o período desejado')
  addListItem('Formato Profissional: Otimizado para impressão')
  addListItem('Dados Organizados: Por categoria e mês')

  addMainTitle('📱 10. Uso Mobile')
  
  addTitle('Interface Responsiva')
  addText('A aplicação é otimizada para dispositivos móveis:')
  addListItem('Menu Inferior: Navegação otimizada para toque')
  addListItem('Gestos Touch: Interações naturais e intuitivas')
  addListItem('Botões Adequados: Tamanho ideal para dedos')
  addListItem('Todos os Recursos: Disponíveis em qualquer dispositivo')

  addTitle('Dicas para Uso Mobile')
  addListItem('Use orientação vertical para melhor experiência')
  addListItem('Aproveite os gestos de arrastar no dashboard')
  addListItem('Utilize o menu inferior para navegação rápida')
  addListItem('Formulários são adaptados automaticamente para tela pequena')

  addMainTitle('⚡ 11. Atualizações em Tempo Real')
  
  addTitle('Como Funciona')
  addText('O sistema atualiza automaticamente:')
  addListItem('Dados Instantâneos: Sem necessidade de recarregar página')
  addListItem('Sincronização Global: Mudanças refletidas em todos os widgets')
  addListItem('Operações CRUD: Reflexo imediato nas interfaces')
  addListItem('Experiência Fluida: Feedback visual imediato')

  addTitle('Benefícios')
  addListItem('Melhor Performance: Apenas dados necessários são atualizados')
  addListItem('Experiência Moderna: Interface sempre responsiva')
  addListItem('Dados Consistentes: Informações sempre sincronizadas')
  addListItem('Menos Espera: Sem recarregamentos desnecessários')

  addMainTitle('🆘 12. Solução de Problemas')
  
  addTitle('Problemas Comuns')
  addSubtitle('Problemas de Login')
  addListItem('Verifique se email e senha estão corretos')
  addListItem('Use o modo demo se necessário (demo@demo.com / 123456)')
  addListItem('Limpe o cache do navegador')
  addListItem('Verifique sua conexão com a internet')

  addSubtitle('Dados não Aparecem')
  addListItem('Verifique se está visualizando o mês correto')
  addListItem('Confirme se os dados foram salvos corretamente')
  addListItem('Aguarde alguns segundos para sincronização')
  addListItem('Recarregue a página se necessário')

  addSubtitle('Problemas Mobile')
  addListItem('Use navegadores atualizados (Chrome, Firefox, Safari)')
  addListItem('Verifique sua conexão com a internet')
  addListItem('Limpe o cache do navegador mobile')
  addListItem('Reinicie o aplicativo do navegador')

  addTitle('Dicas de Performance')
  addListItem('Use navegadores modernos e atualizados')
  addListItem('Mantenha boa conexão com a internet')
  addListItem('Feche abas desnecessárias do navegador')
  addListItem('Limpe regularmente o cache do navegador')

  addTitle('Suporte')
  addText('Para dúvidas adicionais:')
  addListItem('Consulte a seção "Sobre" na aplicação')
  addListItem('Verifique se existe um guia específico para sua dúvida')
  addListItem('Entre em contato através dos canais oficiais')

  // Rodapé com informações
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    
    // Linha superior do rodapé
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    // Informações do rodapé
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
    doc.text('Controle Financeiro Pessoal v1.0.0', margin, pageHeight - 8)
    doc.text('Manual do Usuário - Guia Completo', pageWidth / 2, pageHeight - 8, { align: 'center' })
  }

  return doc
}

export const downloadManualPDF = () => {
  try {
    const doc = generateManualPDF()
    doc.save('Manual-Controle-Financeiro-Pessoal-v1.0.0.pdf')
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar o PDF. Tente novamente.')
  }
}