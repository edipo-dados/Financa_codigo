'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvestments } from '@/hooks/useInvestments'
import { useIncomes } from '@/hooks/useIncomes'
import DraggableDashboard from '@/components/DraggableDashboard'
import ExpensesList from '@/components/ExpensesList'
import InvestmentsList from '@/components/InvestmentsList'
import IncomesList from '@/components/IncomesList'
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
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(user?.id)
  const { investments, loading: investmentsLoading, refetch: refetchInvestments } = useInvestments(user?.id)
  const { incomes, loading: incomesLoading, refetch: refetchIncomes } = useIncomes(user?.id)
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'expenses' | 'investments' | 'future' | 'creditcard' | 'settings' | 'about'>('overview')
  
  // Estado para navegação de mês
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Estado para filtro de período
  const [currentPeriod, setCurrentPeriod] = useState<DateRange>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    label: 'Mês Atual',
  })

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
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
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
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-semibold fintech-text-primary mb-1 sm:mb-2">Dashboard</h1>
        </div>

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
              
              <DraggableDashboard
                expenses={expenses}
                investments={investments}
                incomes={incomes}
                loading={expensesLoading || investmentsLoading || incomesLoading}
                onRefresh={handleRefresh}
                startDate={currentPeriod.startDate}
                endDate={currentPeriod.endDate}
              />
            </div>
          )}

          {activeTab === 'incomes' && (
            <IncomesList userId={user.id} />
          )}

          {activeTab === 'expenses' && (
            <ExpensesList userId={user.id} />
          )}

          {activeTab === 'investments' && (
            <InvestmentsList userId={user.id} />
          )}

          {activeTab === 'future' && (
            <FutureLaunches
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
      />
    </div>
  )
}
