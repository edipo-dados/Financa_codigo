export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type RecurrenceEndType = 'never' | 'after_occurrences' | 'on_date'
export type TransactionType = 'deposit' | 'withdrawal' | 'return'

export interface CreditCard {
  id: string
  user_id: string
  name: string
  closing_day: number
  due_day: number
  credit_limit: number | null
  color: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string
  expense_date: string
  payment_method: string | null
  is_recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_start_date: string | null
  recurrence_end_date: string | null
  recurrence_count: number | null
  recurrence_end_type: RecurrenceEndType | null
  parent_expense_id: string | null
  is_credit_card: boolean
  credit_card_id: string | null
  total_amount: number | null
  installments: number | null
  installment_number: number | null
  purchase_date: string | null
  is_installment: boolean
  is_paid: boolean
  created_at: string
  updated_at: string
  category?: ExpenseCategory
  credit_card?: CreditCard
}

export interface ExpenseCategory {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Income {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string
  income_date: string
  source: string | null
  is_recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_start_date: string | null
  recurrence_end_date: string | null
  recurrence_count: number | null
  recurrence_end_type: RecurrenceEndType | null
  parent_income_id: string | null
  is_paid: boolean
  created_at: string
  updated_at: string
  category?: IncomeCategory
}

export interface IncomeCategory {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  investment_type_id: string | null
  name: string
  institution: string | null
  initial_amount: number
  current_amount: number
  investment_date: string
  expected_return: number | null
  is_recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_start_date: string | null
  recurrence_end_date: string | null
  recurrence_count: number | null
  recurrence_end_type: RecurrenceEndType | null
  parent_investment_id: string | null
  created_at: string
  updated_at: string
  investment_type?: InvestmentType
  transactions?: InvestmentTransaction[]
}

export interface InvestmentType {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface InvestmentTransaction {
  id: string
  investment_id: string
  transaction_type: TransactionType
  amount: number
  transaction_date: string
  description: string | null
  created_at: string
}

export interface DashboardStats {
  totalExpenses: number
  totalInvestments: number
  totalIncomes: number
  netWorth: number
  monthlyExpenses: number
  monthlyIncomes: number
  investmentReturn: number
  monthlyBalance: number
}

export interface ExpensesByCategory {
  category: string
  amount: number
  color: string
}

export interface IncomesByCategory {
  category: string
  amount: number
  color: string
}

export interface MonthlyComparison {
  month: string
  expenses: number
  incomes: number
  investments: number
  balance: number
}
