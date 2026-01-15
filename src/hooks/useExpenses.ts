import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Expense } from '@/types'

export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchExpenses()
  }, [userId])

  const fetchExpenses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:expense_categories(*), credit_card:credit_cards(*)')
      .eq('user_id', userId!)
      .order('expense_date', { ascending: false })

    if (!error && data) {
      setExpenses(data as any)
    }
    setLoading(false)
  }

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('expenses')
      // @ts-ignore
      .insert(expense)
      .select()
      .single()

    if (!error) {
      await fetchExpenses()
    }
    return { data, error }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase
      .from('expenses')
      // @ts-ignore
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  }
}
