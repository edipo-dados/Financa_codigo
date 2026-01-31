'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvestments } from '@/hooks/useInvestments'
import { useIncomes } from '@/hooks/useIncomes'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import DraggableDashboard from '@/components/DraggableDashboard'
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
import PeriodFilter, { DateRange } from '@/components/PeriodFilter'
import FutureLaunches from '@/components/FutureLaunches'
import CreditCardManager from '@/components/CreditCardManager'
import CreditCardPurchasesList from '@/components/CreditCardPurchasesList'
import ThemeSettings from '@/components/ThemeSettings'
import IncomeReport from '@/components/IncomeReport'
import About from '@/components/About'
import FamilyMemberManager from '@/components/FamilyMemberManager'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(user?.id)
  const { investments, loading: investmentsLoading, refetch: refetchInvestments } = useInvestments(user?.id)
  const { incomes, loading: incomesLoading, refetch: refetchIncomes } = useIncomes(user?.id)
  const { members } = useFamilyMembers(user?.id)
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'expenses' | 'investments' | 'future' | 'creditcard' | 'settings' | 'about'>('overview')
  
  // Estados para modais de acesso rápido
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false)
  const [showQuickIncomeModal, setShowQuickIncomeModal] = useState(false)
  
  // Estado para navegação de mês
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Estado para filtro de período
  const [currentPeriod, setCurrentPeriod] = useState<DateRange>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    label: 'Mês Atual',
  })

  // Estado para filtro de membro da família
  const [selectedMember, setSelectedMember] = useState<string>('')

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Atualizar período quando o mês mudar
  useEffect(() => {
    setCurrentPeriod({
      startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
      label: format(currentMonth, 'MMMM yyyy'),
    })
  }, [currentMonth])

  const handleRefresh = () => {
    refetchExpenses()
    refetchInvestments()
    refetchIncomes()
  }

  // Filtrar dados por membro selecionado
  const filteredExpenses = selectedMember 
    ? expenses.filter(e => e.member_id === selectedMember)
    : expenses

  const filteredIncomes = selectedMember 
    ? incomes.filter(i => i.member_id === selectedMember)
    : incomes

  const filteredInvestments = selectedMember 
    ? investments.filter(i => i.member_id === selectedMember)
    : investments

  if (authLoading || !user) {
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

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Desktop Tabs - Hidden on Mobile */}
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
              <MonthNavigator 
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
              
              <PeriodFilter
                currentPeriod={currentPeriod}
                onPeriodChange={setCurrentPeriod}
              />

              {/* Filtro de Membro da Família */}
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <label className="text-sm font-medium text-apple-gray-700">
                      Filtrar por Membro:
                    </label>
                  </div>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue text-sm"
                  >
                    <option value="">Todos os membros</option>
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

              {/* Botões de Acesso Rápido - Apenas Mobile */}
              <div className="md:hidden">
                <div className="glass-card p-4 rounded-2xl">
                  <h3 className="text-sm font-medium text-apple-gray-700 mb-3 flex items-center gap-2">
                    <span>⚡</span>
                    Acesso Rápido
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowQuickExpenseModal(true)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-xl border border-red-200 transition-all duration-200 active:scale-95"
                    >
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white text-lg">
                        💸
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-red-700 text-sm">Nova Despesa</p>
                        <p className="text-xs text-red-600">Adicionar gasto</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowQuickIncomeModal(true)}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl border border-green-200 transition-all duration-200 active:scale-95"
                    >
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                        💰
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-green-700 text-sm">Nova Receita</p>
                        <p className="text-xs text-green-600">Adicionar entrada</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <DraggableDashboard
                expenses={filteredExpenses}
                investments={filteredInvestments}
                incomes={filteredIncomes}
                loading={expensesLoading || investmentsLoading || incomesLoading}
                onRefresh={handleRefresh}
                startDate={currentPeriod.startDate}
                endDate={currentPeriod.endDate}
                userId={user.id}
              />
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
              <IncomeReport 
                incomes={incomes}
                investments={investments}
                userId={user.id}
              />
              <ThemeSettings />
              <CreditCardManager userId={user.id} />
              <IncomeCategoryManager userId={user.id} />
              <CategoryManager userId={user.id} />
              <InvestmentTypeManager userId={user.id} />
            </div>
          )}

          {activeTab === 'about' && (
            <About />
          )}
        </div>
      </main>

      {/* Modais de Acesso Rápido */}
      {/* Modal de Nova Despesa */}
      {showQuickExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-fintech-dark-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-fintech-dark-surface p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  💸 Nova Despesa
                </h2>
                <button
                  onClick={() => setShowQuickExpenseModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <ExpenseForm
                userId={user.id}
                onSuccess={() => {
                  setShowQuickExpenseModal(false)
                  handleRefresh()
                }}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Receita */}
      {showQuickIncomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-fintech-dark-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-fintech-dark-surface p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  💰 Nova Receita
                </h2>
                <button
                  onClick={() => setShowQuickIncomeModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <IncomeForm
                userId={user.id}
                onSuccess={() => {
                  setShowQuickIncomeModal(false)
                  handleRefresh()
                }}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
      />
    </div>
  )
}
