'use client'

import { useState } from 'react'
import { Income, Investment } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { format, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  incomes: Income[]
  investments: Investment[]
  userId: string
}

export default function IncomeReport({ incomes, investments, userId }: Props) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isGenerating, setIsGenerating] = useState(false)

  // Obter anos disponíveis dos dados
  const availableYears = Array.from(new Set([
    ...incomes.map(income => new Date(income.income_date).getFullYear()),
    ...investments.map(inv => new Date(inv.investment_date).getFullYear()),
    new Date().getFullYear()
  ])).sort((a, b) => b - a)

  const generateReport = () => {
    setIsGenerating(true)
    
    const startDate = startOfYear(new Date(selectedYear, 0, 1))
    const endDate = endOfYear(new Date(selectedYear, 0, 1))
    
    // Filtrar dados do ano selecionado
    const yearIncomes = incomes.filter(income => {
      const incomeDate = new Date(income.income_date)
      return incomeDate >= startDate && incomeDate <= endDate
    })
    
    const yearInvestments = investments.filter(inv => {
      const invDate = new Date(inv.investment_date)
      return invDate >= startDate && invDate <= endDate
    })

    // Calcular totais
    const totalIncomes = yearIncomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const totalInvestments = yearInvestments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
    const currentInvestmentValue = yearInvestments.reduce((sum, inv) => sum + Number(inv.current_amount), 0)
    const investmentReturn = currentInvestmentValue - totalInvestments

    // Agrupar receitas por categoria
    const incomesByCategory = yearIncomes.reduce((acc, income) => {
      const categoryName = income.category?.name || 'Sem categoria'
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, items: [] }
      }
      acc[categoryName].total += Number(income.amount)
      acc[categoryName].items.push(income)
      return acc
    }, {} as Record<string, { total: number; items: Income[] }>)

    // Agrupar investimentos por tipo
    const investmentsByType = yearInvestments.reduce((acc, inv) => {
      const typeName = inv.investment_type?.name || 'Sem tipo'
      if (!acc[typeName]) {
        acc[typeName] = { total: 0, currentValue: 0, items: [] }
      }
      acc[typeName].total += Number(inv.initial_amount)
      acc[typeName].currentValue += Number(inv.current_amount)
      acc[typeName].items.push(inv)
      return acc
    }, {} as Record<string, { total: number; currentValue: number; items: Investment[] }>)

    // Gerar HTML do relatório
    const reportHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Rendimentos ${selectedYear}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #007aff, #5ac8fa);
            color: white;
            border-radius: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 1.8em;
            font-weight: 700;
            margin: 0;
        }
        .summary-card.income .value { color: #34c759; }
        .summary-card.investment .value { color: #007aff; }
        .summary-card.return .value { color: #ff9500; }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .section-header h2 {
            margin: 0;
            color: #333;
            font-size: 1.3em;
        }
        .section-content {
            padding: 20px;
        }
        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .category-item:last-child {
            border-bottom: none;
        }
        .category-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        .category-value {
            font-weight: 700;
            color: #007aff;
            text-align: right;
            flex-shrink: 0;
            margin-left: 20px;
        }
        .items-list {
            margin-top: 8px;
        }
        .item {
            font-size: 0.85em;
            color: #666;
            margin: 3px 0;
            padding: 2px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e9ecef;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
        }
        @media print {
            body { 
                background: white; 
                font-size: 12px;
            }
            .header { 
                background: #007aff !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .summary {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Informe de Rendimentos</h1>
        <p>Ano de ${selectedYear} • Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
    </div>

    <div class="summary">
        <div class="summary-card income">
            <h3>💰 Total de Receitas</h3>
            <p class="value">${formatCurrency(totalIncomes)}</p>
        </div>
        <div class="summary-card investment">
            <h3>📈 Total Investido</h3>
            <p class="value">${formatCurrency(totalInvestments)}</p>
        </div>
        <div class="summary-card return">
            <h3>🎯 Rendimento</h3>
            <p class="value">${formatCurrency(investmentReturn)}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>💰 Receitas por Categoria</h2>
        </div>
        <div class="section-content">
            ${Object.keys(incomesByCategory).length === 0 ? 
                '<div class="no-data">Nenhuma receita encontrada para este período</div>' :
                Object.entries(incomesByCategory).map(([category, data]) => `
                <div class="category-item">
                    <div style="flex: 1;">
                        <div class="category-name">${category}</div>
                        <div class="items-list">
                            ${data.items.map(item => `
                                <div class="item">
                                    📅 ${format(new Date(item.income_date), "dd/MM/yyyy")} - ${item.description} - ${formatCurrency(Number(item.amount))}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="category-value">${formatCurrency(data.total)}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>📈 Investimentos por Tipo</h2>
        </div>
        <div class="section-content">
            ${Object.keys(investmentsByType).length === 0 ? 
                '<div class="no-data">Nenhum investimento encontrado para este período</div>' :
                Object.entries(investmentsByType).map(([type, data]) => `
                <div class="category-item">
                    <div style="flex: 1;">
                        <div class="category-name">${type}</div>
                        <div class="items-list">
                            ${data.items.map(item => `
                                <div class="item">
                                    📅 ${format(new Date(item.investment_date), "dd/MM/yyyy")} - ${item.name}<br>
                                    💰 Investido: ${formatCurrency(Number(item.initial_amount))} → Atual: ${formatCurrency(Number(item.current_amount))}
                                    ${Number(item.current_amount) !== Number(item.initial_amount) ? 
                                        `<br>📊 ${Number(item.current_amount) > Number(item.initial_amount) ? 'Ganho' : 'Perda'}: ${formatCurrency(Number(item.current_amount) - Number(item.initial_amount))}` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="category-value">
                        ${formatCurrency(data.currentValue)}
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                            ${data.currentValue !== data.total ? 
                                `(${data.currentValue > data.total ? '+' : ''}${formatCurrency(data.currentValue - data.total)})` : 
                                '(sem variação)'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        <p><strong>Relatório gerado automaticamente pelo Sistema de Controle Financeiro EAS</strong></p>
        <p>Este documento contém informações confidenciais e deve ser tratado com segurança</p>
        <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
    </div>
</body>
</html>
    `

    // Criar e baixar o arquivo
    const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `informe-rendimentos-${selectedYear}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setTimeout(() => setIsGenerating(false), 1000)
  }

  return (
    <div className="fintech-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold fintech-text-primary flex items-center gap-2">
            📊 Informe de Rendimentos
          </h3>
          <p className="text-xs sm:text-sm fintech-text-muted mt-1">
            Relatório completo de receitas e investimentos
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Seletor de Ano */}
        <div>
          <label className="block text-sm font-medium fintech-text-secondary mb-2">
            Selecionar Ano
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-field w-full sm:w-auto"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Preview dos Dados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-fintech-dark-elevated rounded-xl">
          <div className="text-center">
            <p className="text-xs sm:text-sm fintech-text-muted">Receitas</p>
            <p className="text-sm sm:text-base font-semibold fintech-text-success">
              {incomes.filter(i => new Date(i.income_date).getFullYear() === selectedYear).length} itens
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm fintech-text-muted">Investimentos</p>
            <p className="text-sm sm:text-base font-semibold text-apple-blue">
              {investments.filter(i => new Date(i.investment_date).getFullYear() === selectedYear).length} itens
            </p>
          </div>
          <div className="text-center col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm fintech-text-muted">Período</p>
            <p className="text-sm sm:text-base font-semibold fintech-text-primary">
              {selectedYear}
            </p>
          </div>
        </div>

        {/* Botão de Download */}
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className={`
            w-full btn-primary flex items-center justify-center gap-2 touch-target
            ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gerando Relatório...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Baixar Informe de Rendimentos {selectedYear}</span>
            </>
          )}
        </button>

        {/* Informações sobre o relatório */}
        <div className="text-xs sm:text-sm fintech-text-muted bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="font-medium mb-1">📋 O relatório inclui:</p>
          <ul className="space-y-1 ml-4">
            <li>• Resumo financeiro do ano</li>
            <li>• Receitas detalhadas por categoria</li>
            <li>• Investimentos por tipo com rendimentos</li>
            <li>• Formato HTML para impressão ou visualização</li>
          </ul>
        </div>
      </div>
    </div>
  )
}