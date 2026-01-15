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
      credit_cards: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          closing_day: number
          due_day: number
          credit_limit?: number | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          closing_day?: number
          due_day?: number
          credit_limit?: number | null
          color?: string
          updated_at?: string
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
          recurrence_count: number | null
          recurrence_end_type: 'never' | 'after_occurrences' | 'on_date' | null
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
          recurrence_count?: number | null
          recurrence_end_type?: 'never' | 'after_occurrences' | 'on_date' | null
          parent_expense_id?: string | null
          is_credit_card?: boolean
          credit_card_id?: string | null
          total_amount?: number | null
          installments?: number | null
          installment_number?: number | null
          purchase_date?: string | null
          is_installment?: boolean
          is_paid?: boolean
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
          recurrence_count?: number | null
          recurrence_end_type?: 'never' | 'after_occurrences' | 'on_date' | null
          is_credit_card?: boolean
          credit_card_id?: string | null
          total_amount?: number | null
          installments?: number | null
          installment_number?: number | null
          purchase_date?: string | null
          is_installment?: boolean
          is_paid?: boolean
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
          recurrence_count: number | null
          recurrence_end_type: 'never' | 'after_occurrences' | 'on_date' | null
          parent_income_id: string | null
          is_paid: boolean
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
          recurrence_count?: number | null
          recurrence_end_type?: 'never' | 'after_occurrences' | 'on_date' | null
          parent_income_id?: string | null
          is_paid?: boolean
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
          recurrence_count?: number | null
          recurrence_end_type?: 'never' | 'after_occurrences' | 'on_date' | null
          is_paid?: boolean
          updated_at?: string
        }
      }
    }
  }
}
