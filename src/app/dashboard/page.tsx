'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvestments } from '@/hooks/useInvestments'
import { useIncomes } from '@/hooks/useIncomes'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import ExpensesList from '@/components/ExpensesList'
import InvestmentsList from '@/components/InvestmentsList'
import IncomesList from '@/components/IncomesList'
import ExpenseForm from '@/components/ExpenseForm'
import IncomeForm from '@/components/IncomeForm'
import Navigation from '@/components/Navigation'
import MobileBottomNav from '@/components/MobileBottomNav'
import CategoryManager from '@/components/CategoryManager'
import InvestmentTypeManager from '@/components/InvestmentTypeManager'
import IncomeCategoryManager from '@/components/IncomeCategoryManager'
import MonthNavigator from '@/components/MonthNavigator'
import FutureLaunches from '@/components/FutureLaunches'
import CreditCardManager from '@/components/CreditCardManager'
import CreditCardPurchasesList from '@/components/CreditCardPurchasesList'
import ThemeSettings from '@/components/ThemeSettings'
import IncomeReport from '@/components/IncomeReport'
import About from '@/components/About'
import FamilyMemberManager from '@/components/FamilyMemberManager'
import { formatCurrency } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(user?.id)
  const { investments, loading: investmentsLoading, refetch: refetchInvestments } = useInvestments(user?.id)
  const { incomes, loading: incomesLoading, refetch: refetchIncomes } = useIncomes(user?.id)
  const { members } = useFamilyMembers(user?.id)
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'expenses' | 'investments' | 'future' | 'creditcard' | 'settings' | 'about'>('overview')

  // Modais de acesso rápido
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false)
  const [showQuickIncomeModal, setShowQuickIncomeModal] = useState(false)

  // Filtro de mês global (pai)
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)

  // Filtro de membro
  const [selectedMember, setSelectedMember] = useState<string>('')

  // Inicializar data após montagem
  useEffect(() => {
    setCurrentMonth(new Date())
  }, [])

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleRefresh = () => {
    refetchExpenses()
    refetchInvestments()
    refetchIncomes()
  }

  // Período derivado do mês selecionado
  const currentPeriod = useMemo(() => {
    if (!currentMonth) return null
    return {
      startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
    }
  }, [currentMonth])

  // Saldo anual — de janeiro até o fim do mês selecionado
  const yearBalance = useMemo(() => {
    if (!currentMonth) return { totalIncomes: 0, totalExpenses: 0, balance: 0 }

    const yearStart = format(startOfYear(currentMonth), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    let yearIncomes = incomes.filter(i => {
      if (i.description.endsWith('(Excluída)')) return false
      return i.income_date >= yearStart && i.income_date <= monthEnd
    })
    let yearExpenses = expenses.filter(e => {
      if (e.description.endsWith('(Excluída)')) return false
      if (e.is_credit_card && !e.is_installment) return false
      return e.expense_date >= yearStart && e.expense_date <= monthEnd
    })

    if (selectedMember) {
      yearIncomes = yearIncomes.filter(i => i.member_id === selectedMember)
      yearExpenses = yearExpenses.filter(e => e.member_id === selectedMember)
    }

    const totalIncomes = yearIncomes.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalExpenses = yearExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return { totalIncomes, totalExpenses, balance: totalIncomes - totalExpenses }
  }, [incomes, expenses, currentMonth, selectedMember])

  // Saldo do mês — mesma lógica
  const monthBalance = useMemo(() => {
    if (!currentPeriod) return { totalIncomes: 0, totalExpenses: 0, balance: 0 }

    let monthIncomes = incomes.filter(i => {
      if (i.description.endsWith('(Excluída)')) return false
      return i.income_date >= currentPeriod.startDate && i.income_date <= currentPeriod.endDate
    })
    let monthExpenses = expenses.filter(e => {
      if (e.description.endsWith('(Excluída)')) return false
      if (e.is_credit_card && !e.is_installment) return false
      return e.expense_date >= currentPeriod.startDate && e.expense_date <= currentPeriod.endDate
    })

    if (selectedMember) {
      monthIncomes = monthIncomes.filter(i => i.member_id === selectedMember)
      monthExpenses = monthExpenses.filter(e => e.member_id === selectedMember)
    }

    const totalIncomes = monthIncomes.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return { totalIncomes, totalExpenses, balance: totalIncomes - totalExpenses }
  }, [incomes, expenses, currentPeriod, selectedMember])

  // Investimentos (card separado)
  const investmentSummary = useMemo(() => {
    let filtered = investments
    if (selectedMember) {
      filtered = filtered.filter(i => i.member_id === selectedMember)
    }
    const totalInvested = filtered.reduce((sum, i) => sum + Number(i.initial_amount), 0)
    const totalCurrent = filtered.reduce((sum, i) => sum + Number(i.current_amount), 0)
    return { totalInvested, totalCurrent, profit: totalCurrent - totalInvested, count: filtered.length }
  }, [investments, selectedMember])

  if (authLoading || !user || !currentMonth || !currentPeriod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <p className="fintech-text-muted text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'incomes', label: 'Receitas', icon: '💰' },
    { id: 'expenses', label: 'Despesas', icon: '💸' },
    { id: 'investments', label: 'Investimentos', icon: '📈' },
    { id: 'future', label: 'Futuros', icon: '🔮' },
    { id: 'creditcard', label: 'Cartão', icon: '💳' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
    { id: 'about', label: 'Sobre', icon: '📱' },
  ]

  const mobileTabs = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'expenses', label: 'Despesas', icon: '💸' },
    { id: 'incomes', label: 'Receitas', icon: '💰' },
    { id: 'creditcard', label: 'Cartões', icon: '💳' },
  ]

  const selectedMemberName = selectedMember
    ? members.find(m => m.id === selectedMember)?.name || ''
    : ''

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Filtro de Mês Global */}
        <div className="mb-6">
          <MonthNavigator
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex mb-8 gap-2 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-apple-blue text-white shadow-apple-lg scale-[1.02]'
                  : 'bg-white/50 fintech-text-secondary hover:bg-white hover:shadow-apple dark:bg-fintech-dark-elevated dark:hover:bg-fintech-dark-border'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Filtro de Membro */}
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <label className="text-sm font-medium text-apple-gray-700">Membro:</label>
                  </div>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue text-sm"
                  >
                    <option value="">Todos</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.relationship && `(${member.relationship})`}
                      </option>
                    ))}
                  </select>
                  {selectedMember && (
                    <button
                      onClick={() => setSelectedMember('')}
                      className="px-3 py-1 text-xs bg-apple-gray-100 text-apple-gray-600 rounded-lg hover:bg-apple-gray-200 transition-colors"
                    >
                      ✕ Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Botões de Acesso Rápido - Mobile */}
              <div className="md:hidden">
                <div className="glass-card p-4 rounded-2xl">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowQuickExpenseModal(true)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-xl border border-red-200 transition-all duration-200 active:scale-95"
                    >
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white text-lg">💸</div>
                      <div className="text-left">
                        <p className="font-semibold text-red-700 text-sm">Nova Despesa</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowQuickIncomeModal(true)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl border border-green-200 transition-all duration-200 active:scale-95"
                    >
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">💰</div>
                      <div className="text-left">
                        <p className="font-semibold text-green-700 text-sm">Nova Receita</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Saldo do Ano */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold fintech-text-primary mb-4">
                  💰 Saldo Acumulado {currentMonth.getFullYear()} (Jan - {format(currentMonth, 'MMM')})
                  {selectedMemberName && <span className="text-sm font-normal text-apple-gray-500 ml-2">({selectedMemberName})</span>}
                </h3>
                <div className={`text-4xl font-bold mb-4 ${yearBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearBalance.balance >= 0 ? '+' : ''}{formatCurrency(yearBalance.balance)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-green-600 font-medium">Receitas Acumuladas</p>
                    <p className="text-lg font-bold text-green-700">+{formatCurrency(yearBalance.totalIncomes)}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">Despesas Acumuladas</p>
                    <p className="text-lg font-bold text-red-700">-{formatCurrency(yearBalance.totalExpenses)}</p>
                  </div>
                </div>
              </div>

              {/* Saldo do Mês */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold fintech-text-primary mb-4">
                  📅 Saldo do Mês
                  {selectedMemberName && <span className="text-sm font-normal text-apple-gray-500 ml-2">({selectedMemberName})</span>}
                </h3>
                <div className={`text-3xl font-bold mb-4 ${monthBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthBalance.balance >= 0 ? '+' : ''}{formatCurrency(monthBalance.balance)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-green-600 font-medium">Receitas no Mês</p>
                    <p className="text-lg font-bold text-green-700">+{formatCurrency(monthBalance.totalIncomes)}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">Despesas no Mês</p>
                    <p className="text-lg font-bold text-red-700">-{formatCurrency(monthBalance.totalExpenses)}</p>
                  </div>
                </div>
              </div>

              {/* Investimentos */}
              {investmentSummary.count > 0 && (
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold fintech-text-primary mb-4">
                    📈 Investimentos
                    {selectedMemberName && <span className="text-sm font-normal text-apple-gray-500 ml-2">({selectedMemberName})</span>}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-xs text-blue-600 font-medium">Valor Investido</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(investmentSummary.totalInvested)}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <p className="text-xs text-indigo-600 font-medium">Valor Atual</p>
                      <p className="text-lg font-bold text-indigo-700">{formatCurrency(investmentSummary.totalCurrent)}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${investmentSummary.profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <p className={`text-xs font-medium ${investmentSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rendimento</p>
                      <p className={`text-lg font-bold ${investmentSummary.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {investmentSummary.profit >= 0 ? '+' : ''}{formatCurrency(investmentSummary.profit)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-apple-gray-400 mt-3">{investmentSummary.count} investimento(s) — não contabilizados como despesa</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'incomes' && (
            <IncomesList
              userId={user.id}
              startDate={currentPeriod.startDate}
              endDate={currentPeriod.endDate}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesList
              userId={user.id}
              startDate={currentPeriod.startDate}
              endDate={currentPeriod.endDate}
            />
          )}

          {activeTab === 'investments' && (
            <InvestmentsList
              userId={user.id}
              startDate={currentPeriod.startDate}
              endDate={currentPeriod.endDate}
            />
          )}

          {activeTab === 'future' && (
            <FutureLaunches
              userId={user.id}
              expenses={expenses}
              incomes={incomes}
              investments={investments}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'creditcard' && (
            <CreditCardPurchasesList userId={user.id} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 sm:space-y-6">
              <FamilyMemberManager userId={user.id} />
              <IncomeReport incomes={incomes} investments={investments} userId={user.id} />
              <ThemeSettings />
              <CreditCardManager userId={user.id} />
              <IncomeCategoryManager userId={user.id} />
              <CategoryManager userId={user.id} />
              <InvestmentTypeManager userId={user.id} />
            </div>
          )}

          {activeTab === 'about' && <About />}
        </div>
      </main>

      {/* Modal Nova Despesa */}
      {showQuickExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-fintech-dark-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-fintech-dark-surface p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">💸 Nova Despesa</h2>
                <button onClick={() => setShowQuickExpenseModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <ExpenseForm userId={user.id} onSuccess={() => { setShowQuickExpenseModal(false); handleRefresh() }} onRefresh={handleRefresh} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Receita */}
      {showQuickIncomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-fintech-dark-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-fintech-dark-surface p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">💰 Nova Receita</h2>
                <button onClick={() => setShowQuickIncomeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <IncomeForm userId={user.id} onSuccess={() => { setShowQuickIncomeModal(false); handleRefresh() }} onRefresh={handleRefresh} />
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
      />
    </div>
  )
}
