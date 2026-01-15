'use client'

import { useMemo } from 'react'
import { Expense, Investment, Income } from '@/types'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { calculateFutureOccurrences, groupByMonth } from '@/lib/recurrence'
import { calculateCreditCardTotal, groupByCreditCard } from '@/lib/creditCard'
import { format, addMonths } from 'date-fns'
import ConfigurableKPI from './ConfigurableKPI'
import FinancialInsights from './FinancialInsights'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  expenses: Expense[]
  investments: Investment[]
  incomes: Income[]
  loading: boolean
  onRefresh?: () => void
  startDate?: string
  endDate?: string
}

const COLORS = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30']

export default function DashboardStats({ expenses, investments, incomes, loading, onRefresh, startDate, endDate }: Props) {
  const { theme } = useTheme()
  
  // Cores condicionais baseadas no tema
  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#f0f0f0',
    axis: theme === 'dark' ? '#9ca3af' : '#8e8e93',
    tooltipBg: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: theme === 'dark' ? '#ffffff' : '#000000',
    legendText: theme === 'dark' ? '#e5e7eb' : '#374151',
  }
  const stats = useMemo(() => {
    // Usar período personalizado ou mês atual
    const start = startDate || getCurrentMonthRange().start
    const end = endDate || getCurrentMonthRange().end
    
    const monthlyExpenses = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const monthlyIncomes = incomes
      .filter(i => i.income_date >= start && i.income_date <= end)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    // Calcular despesas e receitas pagas vs a pagar
    const expensesPaid = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end && e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    
    const expensesToPay = expenses
      .filter(e => e.expense_date >= start && e.expense_date <= end && !e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const incomesPaid = incomes
      .filter(i => i.income_date >= start && i.income_date <= end && i.is_paid)
      .reduce((sum, i) => sum + Number(i.amount), 0)
    
    const incomesToReceive = incomes
      .filter(i => i.income_date >= start && i.income_date <= end && !i.is_paid)
      .reduce((sum, i) => sum + Number(i.amount), 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalIncomes = incomes.reduce((sum, i) => sum + Number(i.amount), 0)
    
    const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.current_amount), 0)
    
    const totalInitialInvestments = investments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
    
    const investmentReturn = totalInvestments - totalInitialInvestments
    const monthlyBalance = monthlyIncomes - monthlyExpenses

    const expensesByCategory = expenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Sem categoria'
      const categoryColor = expense.category?.color || '#6B7280'
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0, color: categoryColor }
      }
      acc[categoryName].value += Number(expense.amount)
      return acc
    }, {} as Record<string, { name: string; value: number; color: string }>)

    const incomesByCategory = incomes.reduce((acc, income) => {
      const categoryName = income.category?.name || 'Sem categoria'
      const categoryColor = income.category?.color || '#34c759'
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0, color: categoryColor }
      }
      acc[categoryName].value += Number(income.amount)
      return acc
    }, {} as Record<string, { name: string; value: number; color: string }>)

    const categoryData = Object.values(expensesByCategory)
    const incomeCategoryData = Object.values(incomesByCategory)

    // Calcular projeções futuras (próximos 6 meses)
    const futureIncomes = calculateFutureOccurrences(
      incomes.filter(i => i.is_recurring),
      6
    )
    const futureExpenses = calculateFutureOccurrences(
      expenses.filter(e => e.is_recurring),
      6
    )

    // Agrupar por mês
    const incomesByMonth = groupByMonth(futureIncomes)
    const expensesByMonth = groupByMonth(futureExpenses)

    // Criar dados para o gráfico de projeção
    const projectionData = []
    const today = new Date()
    
    for (let i = 0; i < 6; i++) {
      const month = format(addMonths(today, i), 'yyyy-MM')
      const monthLabel = format(addMonths(today, i), 'MMM/yy')
      
      const incomeMonth = incomesByMonth.find(m => m.month === month)
      const expenseMonth = expensesByMonth.find(m => m.month === month)
      
      projectionData.push({
        month: monthLabel,
        receitas: incomeMonth?.total || 0,
        despesas: expenseMonth?.total || 0,
        saldo: (incomeMonth?.total || 0) - (expenseMonth?.total || 0),
      })
    }

    // Calcular totais de recorrências futuras
    const totalFutureIncomes = futureIncomes.reduce((sum, occ) => sum + occ.amount, 0)
    const totalFutureExpenses = futureExpenses.reduce((sum, occ) => sum + occ.amount, 0)

    // Calcular estatísticas de cartão de crédito
    const creditCardStats = calculateCreditCardTotal(expenses, start, end)
    const creditCardByCard = groupByCreditCard(expenses.filter(e => 
      e.expense_date >= start && e.expense_date <= end
    ))

    // NOVO: Histograma de Despesas x Receitas x Investimentos por mês (12 meses incluindo futuros)
    const histogramData = []
    const startMonth = new Date()
    startMonth.setMonth(startMonth.getMonth() - 6) // 6 meses atrás
    
    for (let i = 0; i < 12; i++) {
      const month = format(addMonths(startMonth, i), 'yyyy-MM')
      const monthLabel = format(addMonths(startMonth, i), 'MMM/yy')
      const monthDate = addMonths(startMonth, i)
      const isCurrentOrFuture = monthDate >= new Date()
      
      // Despesas do mês (passadas)
      const monthExpenses = expenses
        .filter(e => e.expense_date.startsWith(month))
        .reduce((sum, e) => sum + Number(e.amount), 0)
      
      // Receitas do mês (passadas)
      const monthIncomes = incomes
        .filter(i => i.income_date.startsWith(month))
        .reduce((sum, i) => sum + Number(i.amount), 0)
      
      // Investimentos do mês (passados)
      const monthInvestments = investments
        .filter(inv => inv.investment_date.startsWith(month))
        .reduce((sum, inv) => sum + Number(inv.initial_amount), 0)
      
      // Se for mês atual ou futuro, adicionar recorrências
      let futureExpensesMonth = 0
      let futureIncomesMonth = 0
      
      if (isCurrentOrFuture) {
        const expenseMonth = expensesByMonth.find(m => m.month === month)
        const incomeMonth = incomesByMonth.find(m => m.month === month)
        futureExpensesMonth = expenseMonth?.total || 0
        futureIncomesMonth = incomeMonth?.total || 0
      }
      
      histogramData.push({
        month: monthLabel,
        despesas: monthExpenses + futureExpensesMonth,
        receitas: monthIncomes + futureIncomesMonth,
        investimentos: monthInvestments,
      })
    }

    // NOVO: Gráfico de pizza de formas de pagamento
    const paymentMethodsData = expenses.reduce((acc, expense) => {
      let method = expense.payment_method || 'Não especificado'
      
      // Mapear para nomes mais amigáveis
      const methodMap: Record<string, string> = {
        'cash': 'Dinheiro',
        'debit': 'Débito',
        'credit_card': 'Cartão de Crédito',
        'pix': 'PIX',
        'transfer': 'Transferência',
      }
      
      method = methodMap[method] || method
      
      if (!acc[method]) {
        acc[method] = { name: method, value: 0 }
      }
      acc[method].value += Number(expense.amount)
      return acc
    }, {} as Record<string, { name: string; value: number }>)

    const paymentMethodsChartData = Object.values(paymentMethodsData)

    // NOVO: KPI de gastos de cartão
    const totalCreditCardExpenses = expenses
      .filter(e => e.is_credit_card && e.is_installment)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      monthlyExpenses,
      monthlyIncomes,
      monthlyBalance,
      totalExpenses,
      totalIncomes,
      totalInvestments,
      investmentReturn,
      netWorth: totalIncomes - totalExpenses + totalInvestments,
      categoryData,
      incomeCategoryData,
      projectionData,
      totalFutureIncomes,
      totalFutureExpenses,
      creditCardStats,
      creditCardByCard,
      expensesPaid,
      expensesToPay,
      incomesPaid,
      incomesToReceive,
      histogramData,
      paymentMethodsChartData,
      totalCreditCardExpenses,
    }
  }, [expenses, investments, incomes, startDate, endDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-apple-gray-400 text-sm">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Botão de Refresh */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-xl text-apple-gray-600 hover:text-apple-blue transition-all duration-200 shadow-apple hover:shadow-apple-lg disabled:opacity-50"
        >
          <svg 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-medium text-sm">Atualizar</span>
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(stats.monthlyIncomes)}
          icon="💰"
          color="green"
          trend={8.5}
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(stats.monthlyExpenses)}
          icon="💸"
          color="red"
          trend={-12.5}
        />
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(stats.monthlyBalance)}
          icon="📊"
          color={stats.monthlyBalance >= 0 ? 'green' : 'red'}
          trend={stats.monthlyBalance >= 0 ? 15.2 : -5.3}
        />
        <StatCard
          title="Total Investido"
          value={formatCurrency(stats.totalInvestments)}
          icon="📈"
          color="blue"
          trend={8.3}
        />
      </div>

      {/* Cards de Status de Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-apple-gray-500">Despesas Pagas</h3>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-2xl font-bold text-apple-green">
            {formatCurrency(stats.expensesPaid)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-apple-gray-500">Despesas A Pagar</h3>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl font-bold text-apple-orange">
            {formatCurrency(stats.expensesToPay)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-apple-gray-500">Receitas Recebidas</h3>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-2xl font-bold text-apple-green">
            {formatCurrency(stats.incomesPaid)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-apple-gray-500">Receitas A Receber</h3>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl font-bold text-apple-orange">
            {formatCurrency(stats.incomesToReceive)}
          </p>
        </div>
      </div>

      {/* Cards de Projeções Futuras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-apple-gray-700">Receitas Futuras</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm text-apple-gray-400 mb-3">Próximos 6 meses (recorrências)</p>
          <p className="text-3xl font-bold text-apple-green">
            {formatCurrency(stats.totalFutureIncomes)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-apple-gray-700">Despesas Futuras</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm text-apple-gray-400 mb-3">Próximos 6 meses (recorrências)</p>
          <p className="text-3xl font-bold text-apple-red">
            {formatCurrency(stats.totalFutureExpenses)}
          </p>
        </div>
      </div>

      {/* Card de Fatura do Cartão */}
      {stats.creditCardStats.total > 0 && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-apple-gray-700">💳 Fatura do Cartão</h3>
              <p className="text-sm text-apple-gray-400 mt-1">
                {stats.creditCardStats.installments} parcelas no período
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-apple-red">
                {formatCurrency(stats.creditCardStats.total)}
              </p>
            </div>
          </div>
          
          {stats.creditCardByCard.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-apple-gray-200">
              <p className="text-sm font-medium text-apple-gray-600 mb-3">Detalhamento por Cartão:</p>
              {stats.creditCardByCard.map((card) => (
                <div key={card.cardId} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: card.cardColor }}
                    />
                    <span className="text-sm font-medium text-apple-gray-700">
                      {card.cardName}
                    </span>
                    <span className="text-xs text-apple-gray-400">
                      ({card.count} {card.count === 1 ? 'parcela' : 'parcelas'})
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-apple-red">
                    {formatCurrency(card.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gráfico de Projeção */}
      {stats.projectionData.length > 0 && (
        <div className="glass-card p-8 rounded-3xl animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold fintech-text-primary">Projeção: Receitas x Despesas</h3>
              <p className="text-sm fintech-text-muted mt-1">Próximos 6 meses baseado em recorrências</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={stats.projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="month" 
                stroke={chartColors.axis}
                style={{ fontSize: '12px', fill: chartColors.axis }}
              />
              <YAxis 
                stroke={chartColors.axis}
                style={{ fontSize: '12px', fill: chartColors.axis }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: chartColors.tooltipText,
                }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: chartColors.legendText }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Saldo"
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.incomeCategoryData.length > 0 && (
          <div className="glass-card p-8 rounded-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold fintech-text-primary">Receitas por Categoria</h3>
                <p className="text-sm fintech-text-muted mt-1">Distribuição das suas entradas</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.incomeCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {stats.incomeCategoryData.map((entry, index) => (
                    <Cell key={`cell-income-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: chartColors.tooltipText,
                  }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.incomeCategoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm fintech-text-secondary truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.categoryData.length > 0 && (
          <div className="glass-card p-8 rounded-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold fintech-text-primary">Despesas por Categoria</h3>
                <p className="text-sm fintech-text-muted mt-1">Distribuição dos seus gastos</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-expense-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: chartColors.tooltipText,
                  }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm fintech-text-secondary truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NOVO: Histograma de Despesas x Receitas x Investimentos */}
      {stats.histogramData.length > 0 && (
        <div className="glass-card p-8 rounded-3xl animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold fintech-text-primary">Histórico e Projeção Mensal</h3>
              <p className="text-sm fintech-text-muted mt-1">Despesas, Receitas e Investimentos (últimos 6 meses + próximos 6 meses)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="month" 
                stroke={chartColors.axis}
                style={{ fontSize: '12px', fill: chartColors.axis }}
              />
              <YAxis 
                stroke={chartColors.axis}
                style={{ fontSize: '12px', fill: chartColors.axis }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: chartColors.tooltipText,
                }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: chartColors.legendText }}
              />
              <Bar dataKey="receitas" fill="#10b981" name="Receitas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="investimentos" fill="#3b82f6" name="Investimentos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* NOVO: Gráfico de Pizza de Formas de Pagamento + KPIs Configuráveis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Formas de Pagamento */}
        {stats.paymentMethodsChartData.length > 0 && (
          <div className="glass-card p-8 rounded-3xl animate-slide-up lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold fintech-text-primary">Formas de Pagamento</h3>
                <p className="text-sm fintech-text-muted mt-1">Distribuição dos métodos de pagamento</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.paymentMethodsChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {stats.paymentMethodsChartData.map((_entry, index) => (
                    <Cell key={`cell-payment-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: chartColors.tooltipText,
                  }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.paymentMethodsChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm fintech-text-secondary truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Configurável - Gastos de Cartão */}
        <ConfigurableKPI
          title="Gastos no Cartão"
          currentValue={stats.totalCreditCardExpenses}
          storageKey="kpi_credit_card_limit"
          icon="💳"
          color="red"
        />
      </div>

      {/* Análise Inteligente com IA */}
      <FinancialInsights 
        expenses={expenses}
        investments={investments}
        incomes={incomes}
      />

      {/* KPIs Configuráveis Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConfigurableKPI
          title="Total de Despesas"
          currentValue={stats.monthlyExpenses}
          storageKey="kpi_expenses_limit"
          icon="💸"
          color="red"
        />
        
        <ConfigurableKPI
          title="Fatura do Cartão"
          currentValue={stats.creditCardStats.total}
          storageKey="kpi_invoice_limit"
          icon="📄"
          color="orange"
        />

        <ConfigurableKPI
          title="Meta de Economia"
          currentValue={stats.monthlyBalance}
          storageKey="kpi_savings_goal"
          icon="🎯"
          color="green"
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: string
  color: 'red' | 'green' | 'blue'
  trend?: number
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    red: 'from-apple-red/10 to-apple-red/5 text-apple-red',
    green: 'from-apple-green/10 to-apple-green/5 text-apple-green',
    blue: 'from-apple-blue/10 to-apple-blue/5 text-apple-blue',
  }

  return (
    <div className="stat-card group hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-apple`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            trend >= 0 ? 'bg-apple-green/10 text-apple-green' : 'bg-apple-red/10 text-apple-red'
          }`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm text-apple-gray-500 mb-1">{title}</h3>
      <p className={`text-2xl font-semibold ${colorClasses[color].split(' ')[1]}`}>
        {value}
      </p>
    </div>
  )
}
