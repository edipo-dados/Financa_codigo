'use client'

import { useMemo, useState } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
}

interface Insight {
  type: 'warning' | 'success' | 'info' | 'tip'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'spending' | 'saving' | 'investment' | 'budget'
  actionable: string
  potentialSaving?: number
}

export default function FinancialInsights({ expenses, investments, incomes }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const insights = useMemo(() => {
    const insights: Insight[] = []
    const currentMonth = new Date()
    const lastMonth = subMonths(currentMonth, 1)
    const threeMonthsAgo = subMonths(currentMonth, 3)

    // Análise de dados dos últimos 3 meses
    const currentMonthStart = startOfMonth(currentMonth).toISOString().split('T')[0]
    const currentMonthEnd = endOfMonth(currentMonth).toISOString().split('T')[0]
    const lastMonthStart = startOfMonth(lastMonth).toISOString().split('T')[0]
    const lastMonthEnd = endOfMonth(lastMonth).toISOString().split('T')[0]
    const threeMonthsStart = startOfMonth(threeMonthsAgo).toISOString().split('T')[0]

    // Despesas do mês atual vs mês passado
    const currentMonthExpenses = expenses
      .filter(e => e.expense_date >= currentMonthStart && e.expense_date <= currentMonthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const lastMonthExpenses = expenses
      .filter(e => e.expense_date >= lastMonthStart && e.expense_date <= lastMonthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Receitas do mês atual vs mês passado
    const currentMonthIncomes = incomes
      .filter(i => i.income_date >= currentMonthStart && i.income_date <= currentMonthEnd)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    const lastMonthIncomes = incomes
      .filter(i => i.income_date >= lastMonthStart && i.income_date <= lastMonthEnd)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    // 1. Análise de crescimento de gastos
    if (lastMonthExpenses > 0) {
      const expenseGrowth = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      
      if (expenseGrowth > 20) {
        insights.push({
          type: 'warning',
          title: 'Gastos aumentaram significativamente',
          description: `Suas despesas cresceram ${expenseGrowth.toFixed(1)}% em relação ao mês passado (${formatCurrency(currentMonthExpenses - lastMonthExpenses)} a mais).`,
          impact: 'high',
          category: 'spending',
          actionable: 'Revise suas despesas recentes e identifique gastos desnecessários. Considere criar um orçamento mais rígido.',
          potentialSaving: (currentMonthExpenses - lastMonthExpenses) * 0.3
        })
      } else if (expenseGrowth < -10) {
        insights.push({
          type: 'success',
          title: 'Parabéns! Você reduziu seus gastos',
          description: `Suas despesas diminuíram ${Math.abs(expenseGrowth).toFixed(1)}% em relação ao mês passado. Economia de ${formatCurrency(lastMonthExpenses - currentMonthExpenses)}.`,
          impact: 'high',
          category: 'saving',
          actionable: 'Continue mantendo esse controle. Considere investir a diferença economizada.'
        })
      }
    }

    // 2. Análise por categoria - identificar maiores gastos
    const expensesByCategory = expenses
      .filter(e => e.expense_date >= threeMonthsStart)
      .reduce((acc, expense) => {
        const categoryName = expense.category?.name || 'Sem categoria'
        if (!acc[categoryName]) {
          acc[categoryName] = { total: 0, count: 0, color: expense.category?.color || '#6B7280' }
        }
        acc[categoryName].total += Number(expense.amount)
        acc[categoryName].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number; color: string }>)

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 3)

    if (sortedCategories.length > 0) {
      const [topCategory, topData] = sortedCategories[0]
      const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.total, 0)
      const categoryPercentage = (topData.total / totalExpenses) * 100

      if (categoryPercentage > 40) {
        insights.push({
          type: 'warning',
          title: `Categoria "${topCategory}" consome muito do orçamento`,
          description: `${categoryPercentage.toFixed(1)}% dos seus gastos (${formatCurrency(topData.total)}) estão concentrados em "${topCategory}".`,
          impact: 'high',
          category: 'budget',
          actionable: `Analise se é possível reduzir gastos em "${topCategory}". Considere alternativas mais econômicas ou renegociar contratos.`,
          potentialSaving: topData.total * 0.15
        })
      }
    }

    // 3. Análise de cartão de crédito
    const creditCardExpenses = expenses
      .filter(e => e.is_credit_card && e.expense_date >= threeMonthsStart)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalExpensesLast3Months = expenses
      .filter(e => e.expense_date >= threeMonthsStart)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    if (totalExpensesLast3Months > 0) {
      const creditCardPercentage = (creditCardExpenses / totalExpensesLast3Months) * 100
      
      if (creditCardPercentage > 60) {
        insights.push({
          type: 'warning',
          title: 'Alto uso do cartão de crédito',
          description: `${creditCardPercentage.toFixed(1)}% dos seus gastos são no cartão de crédito. Isso pode indicar dependência do crédito.`,
          impact: 'high',
          category: 'spending',
          actionable: 'Tente usar mais dinheiro ou débito. Quite as faturas em dia para evitar juros. Considere um planejamento financeiro mais rigoroso.'
        })
      }
    }

    // 4. Análise de investimentos
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
    const currentInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.current_amount), 0)
    const investmentReturn = currentInvestmentValue - totalInvested

    if (totalInvested === 0 && currentMonthIncomes > currentMonthExpenses) {
      insights.push({
        type: 'tip',
        title: 'Você tem dinheiro sobrando - hora de investir!',
        description: `Seu saldo positivo de ${formatCurrency(currentMonthIncomes - currentMonthExpenses)} pode ser investido para gerar renda passiva.`,
        impact: 'medium',
        category: 'investment',
        actionable: 'Comece com investimentos de baixo risco como Tesouro Direto ou CDB. Mesmo pequenos valores fazem diferença no longo prazo.'
      })
    } else if (totalInvested > 0 && investmentReturn > 0) {
      const returnPercentage = (investmentReturn / totalInvested) * 100
      insights.push({
        type: 'success',
        title: 'Seus investimentos estão rendendo!',
        description: `Retorno de ${returnPercentage.toFixed(2)}% (${formatCurrency(investmentReturn)}) sobre o investido.`,
        impact: 'medium',
        category: 'investment',
        actionable: 'Continue investindo regularmente. Considere aumentar o valor mensal se possível.'
      })
    }

    // 5. Análise de despesas não pagas
    const unpaidExpenses = expenses
      .filter(e => !e.is_paid && e.expense_date <= currentMonthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    if (unpaidExpenses > 0) {
      insights.push({
        type: 'warning',
        title: 'Você tem contas em atraso',
        description: `${formatCurrency(unpaidExpenses)} em despesas ainda não foram pagas.`,
        impact: 'high',
        category: 'budget',
        actionable: 'Quite essas pendências o quanto antes para evitar juros e multas. Organize um calendário de vencimentos.'
      })
    }

    // 6. Análise de padrão de gastos por método de pagamento
    const paymentMethods = expenses
      .filter(e => e.expense_date >= threeMonthsStart)
      .reduce((acc, expense) => {
        const method = expense.payment_method || 'Não especificado'
        if (!acc[method]) acc[method] = 0
        acc[method] += Number(expense.amount)
        return acc
      }, {} as Record<string, number>)

    const cashExpenses = paymentMethods['cash'] || 0
    const totalRecentExpenses = Object.values(paymentMethods).reduce((sum, amount) => sum + amount, 0)

    if (totalRecentExpenses > 0 && (cashExpenses / totalRecentExpenses) < 0.1) {
      insights.push({
        type: 'tip',
        title: 'Considere usar mais dinheiro físico',
        description: 'Usar dinheiro físico ajuda a ter mais controle sobre os gastos e evita gastos impulsivos.',
        impact: 'low',
        category: 'spending',
        actionable: 'Experimente a regra dos envelopes: separe dinheiro físico para categorias específicas como alimentação e lazer.'
      })
    }

    // 7. Análise de sazonalidade (se houver dados suficientes)
    if (expenses.length > 50) {
      const monthlyAverages = expenses
        .filter(e => e.expense_date >= threeMonthsStart)
        .reduce((acc, expense) => {
          const month = expense.expense_date.substring(0, 7) // YYYY-MM
          if (!acc[month]) acc[month] = 0
          acc[month] += Number(expense.amount)
          return acc
        }, {} as Record<string, number>)

      const avgMonthlyExpense = Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) / Object.keys(monthlyAverages).length

      if (currentMonthExpenses > avgMonthlyExpense * 1.3) {
        insights.push({
          type: 'info',
          title: 'Mês de gastos acima da média',
          description: `Este mês você gastou ${((currentMonthExpenses / avgMonthlyExpense - 1) * 100).toFixed(1)}% acima da sua média mensal.`,
          impact: 'medium',
          category: 'budget',
          actionable: 'Verifique se houve gastos extraordinários. Se for um padrão, ajuste seu orçamento mensal.'
        })
      }
    }

    // Ordenar insights por impacto
    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }, [expenses, investments, incomes])

  const totalPotentialSaving = insights
    .filter(i => i.potentialSaving)
    .reduce((sum, i) => sum + (i.potentialSaving || 0), 0)

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      case 'tip': return '💡'
      default: return '📊'
    }
  }

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'border-apple-orange bg-apple-orange/5'
      case 'success': return 'border-apple-green bg-apple-green/5'
      case 'info': return 'border-apple-blue bg-apple-blue/5'
      case 'tip': return 'border-apple-purple bg-apple-purple/5'
      default: return 'border-apple-gray-300 bg-apple-gray-50'
    }
  }

  const getImpactBadge = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-apple-red text-white'
      case 'medium': return 'bg-apple-orange text-white'
      case 'low': return 'bg-apple-gray-400 text-white'
    }
  }

  if (insights.length === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-apple-gray-700 mb-2">
            Parabéns! Suas finanças estão equilibradas
          </h3>
          <p className="text-apple-gray-500">
            Não encontramos pontos críticos para melhorar. Continue assim!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-apple-gray-700 flex items-center gap-2">
            🤖 Análise Inteligente das Finanças
          </h3>
          <p className="text-sm text-apple-gray-500 mt-1">
            IA analisou seus dados e encontrou {insights.length} insights
          </p>
        </div>
        {totalPotentialSaving > 0 && (
          <div className="text-right">
            <p className="text-sm text-apple-gray-500">Economia potencial</p>
            <p className="text-lg font-semibold text-apple-green">
              {formatCurrency(totalPotentialSaving)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {insights.slice(0, isExpanded ? insights.length : 3).map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-xl ${getInsightColor(insight.type)} animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div>
                  <h4 className="font-semibold text-apple-gray-700">
                    {insight.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactBadge(insight.impact)}`}>
                      {insight.impact === 'high' ? 'Alto Impacto' : insight.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                    </span>
                    <span className="text-xs text-apple-gray-400 capitalize">
                      {insight.category === 'spending' ? 'Gastos' : 
                       insight.category === 'saving' ? 'Economia' :
                       insight.category === 'investment' ? 'Investimentos' : 'Orçamento'}
                    </span>
                  </div>
                </div>
              </div>
              {insight.potentialSaving && (
                <div className="text-right">
                  <p className="text-xs text-apple-gray-500">Economia potencial</p>
                  <p className="text-sm font-semibold text-apple-green">
                    {formatCurrency(insight.potentialSaving)}
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-apple-gray-600 mb-3 text-sm leading-relaxed">
              {insight.description}
            </p>
            
            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-xs font-medium text-apple-gray-500 mb-1">💡 Recomendação:</p>
              <p className="text-sm text-apple-gray-700">
                {insight.actionable}
              </p>
            </div>
          </div>
        ))}
      </div>

      {insights.length > 3 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary"
          >
            {isExpanded ? 'Ver Menos' : `Ver Mais ${insights.length - 3} Insights`}
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-apple-blue/5 rounded-xl border border-apple-blue/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h4 className="font-semibold text-apple-gray-700 mb-2">
              Dica do Especialista
            </h4>
            <p className="text-sm text-apple-gray-600 leading-relaxed">
              A análise é baseada nos seus dados dos últimos 3 meses. Para insights mais precisos, 
              mantenha seus lançamentos sempre atualizados e categorize suas despesas corretamente. 
              Pequenas mudanças consistentes geram grandes resultados no longo prazo!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}