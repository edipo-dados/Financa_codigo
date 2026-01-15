import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Investment, InvestmentTransaction } from '@/types'

export function useInvestments(userId: string | undefined) {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchInvestments()
  }, [userId])

  const fetchInvestments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('investments')
      .select('*, investment_type:investment_types(*), transactions:investment_transactions(*)')
      .eq('user_id', userId!)
      .order('investment_date', { ascending: false })

    if (!error && data) {
      setInvestments(data as any)
    }
    setLoading(false)
  }

  const addInvestment = async (investment: Omit<Investment, 'id' | 'created_at' | 'updated_at' | 'transactions'>) => {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single()

    if (!error) {
      await fetchInvestments()
    }
    return { data, error }
  }

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    const { error } = await supabase
      .from('investments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      await fetchInvestments()
    }
    return { error }
  }

  const deleteInvestment = async (id: string) => {
    const { error } = await supabase.from('investments').delete().eq('id', id)

    if (!error) {
      await fetchInvestments()
    }
    return { error }
  }

  const addTransaction = async (transaction: Omit<InvestmentTransaction, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('investment_transactions')
      .insert(transaction)
      .select()
      .single()

    if (!error) {
      const investment = investments.find(inv => inv.id === transaction.investment_id)
      if (investment) {
        let newAmount = investment.current_amount
        
        if (transaction.transaction_type === 'deposit') {
          newAmount += transaction.amount
        } else if (transaction.transaction_type === 'withdrawal') {
          newAmount -= transaction.amount
        } else if (transaction.transaction_type === 'return') {
          newAmount += transaction.amount
        }

        await updateInvestment(transaction.investment_id, { current_amount: newAmount })
      }
    }
    return { data, error }
  }

  return {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addTransaction,
    refetch: fetchInvestments,
  }
}
