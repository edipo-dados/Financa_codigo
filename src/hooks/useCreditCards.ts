/**
 * Hook para gerenciar cartões de crédito
 * CRUD completo com sincronização em tempo real
 */

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { CreditCard } from '@/lib/creditCard'

export function useCreditCards(userId: string) {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userId === 'none') {
      setLoading(false)
      return
    }

    fetchCreditCards()
    
    // Subscription para atualizações em tempo real
    const subscription = supabase
      .channel('credit_cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_cards',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCreditCards()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchCreditCards = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching credit cards:', error)
    } else {
      setCreditCards(data || [])
    }
    setLoading(false)
  }

  const addCreditCard = async (creditCard: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('credit_cards')
      // @ts-ignore
      .insert(creditCard)
      .select()
      .single()

    if (error) {
      console.error('Error adding credit card:', error)
      return { data: null, error }
    }

    return { data, error: null }
  }

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Funcionalidade não disponível no modo demo' } }
    }

    const { data, error } = await supabase
      .from('credit_cards')
      // @ts-ignore
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating credit card:', error)
      return { data: null, error }
    }

    return { data, error: null }
  }

  const deleteCreditCard = async (id: string) => {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting credit card:', error)
      return { error }
    }

    return { error: null }
  }

  return {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refresh: fetchCreditCards,
  }
}
