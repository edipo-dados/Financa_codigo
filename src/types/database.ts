export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          description: string
          expense_date: string
          payment_method: string | null
          is_recurring: boolean
          recurrence_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date: string | null
          recurrence_end_date: string | null
          parent_expense_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          description: string
          expense_date: string
          payment_method?: string | null
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date?: string | null
          recurrence_end_date?: string | null
          parent_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          amount?: number
          description?: string
          expense_date?: string
          payment_method?: string | null
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date?: string | null
          recurrence_end_date?: string | null
          updated_at?: string
        }
      }
      investment_types: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          investment_type_id: string | null
          name: string
          institution: string | null
          initial_amount: number
          current_amount: number
          investment_date: string
          expected_return: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          investment_type_id?: string | null
          name: string
          institution?: string | null
          initial_amount: number
          current_amount: number
          investment_date: string
          expected_return?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          investment_type_id?: string | null
          name?: string
          institution?: string | null
          current_amount?: number
          expected_return?: number | null
          updated_at?: string
        }
      }
      investment_transactions: {
        Row: {
          id: string
          investment_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'return'
          amount: number
          transaction_date: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          investment_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'return'
          amount: number
          transaction_date: string
          description?: string | null
          created_at?: string
        }
        Update: {
          transaction_type?: 'deposit' | 'withdrawal' | 'return'
          amount?: number
          transaction_date?: string
          description?: string | null
        }
      }
      income_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
      }
      incomes: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          description: string
          income_date: string
          source: string | null
          is_recurring: boolean
          recurrence_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date: string | null
          recurrence_end_date: string | null
          parent_income_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          description: string
          income_date: string
          source?: string | null
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date?: string | null
          recurrence_end_date?: string | null
          parent_income_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          amount?: number
          description?: string
          income_date?: string
          source?: string | null
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_start_date?: string | null
          recurrence_end_date?: string | null
          updated_at?: string
        }
      }
    }
  }
}
