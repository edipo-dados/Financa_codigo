'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FamilyMember } from '@/types'

export function useFamilyMembers(userId?: string) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Erro ao buscar membros da família:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMember = async (member: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('family_members')
        .insert([member])
        .select()
        .single()

      if (error) throw error
      
      setMembers(prev => [...prev, data as FamilyMember])
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      return { data: null, error }
    }
  }

  const updateMember = async (id: string, updates: Partial<FamilyMember>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setMembers(prev => prev.map(member => 
        member.id === id ? { ...member, ...data } : member
      ))
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao atualizar membro:', error)
      return { data: null, error }
    }
  }

  const deleteMember = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('family_members')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      
      setMembers(prev => prev.filter(member => member.id !== id))
      return { error: null }
    } catch (error) {
      console.error('Erro ao excluir membro:', error)
      return { error }
    }
  }

  const refetch = () => {
    fetchMembers()
  }

  useEffect(() => {
    fetchMembers()
  }, [userId])

  return {
    members,
    loading,
    addMember,
    updateMember,
    deleteMember,
    refetch
  }
}