import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Income } from '@/types'

export function useIncomes(userId: string | undefined) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchIncomes()
  }, [userId])

  const fetchIncomes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('incomes')
      .select('*, category:income_categories(*)')
      .eq('user_id', userId!)
      .order('income_date', { ascending: false })

    if (!error && data) {
      setIncomes(data as any)
    }
    setLoading(false)
  }

  const addIncome = async (income: Omit<Income, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('useIncomes: Tentando inserir receita:', income)
    
    const { data, error } = await supabase
      .from('incomes')
      .insert(income)
      .select()
      .single()

    if (error) {
      console.error('useIncomes: Erro ao inserir:', error)
    } else {
      console.log('useIncomes: Receita inserida com sucesso:', data)
      await fetchIncomes()
    }
    
    return { data, error }
  }

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const { error } = await supabase
      .from('incomes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      await fetchIncomes()
    }
    return { error }
  }

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from('incomes').delete().eq('id', id)

    if (!error) {
      await fetchIncomes()
    }
    return { error }
  }

  return {
    incomes,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes,
  }
}
