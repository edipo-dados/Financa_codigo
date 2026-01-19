'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  userId: string
}

export default function CreditCardPurchasesList({ userId }: Props) {
  const { expenses, loading, refetch } = useExpenses(userId)



  // Filtrar apenas compras parent de cartão (não parcelas)
  const creditCardPurchases = expenses.filter(e => 
    e.is_credit_card && !e.is_installment
  )

  const handleDelete = async (purchase: any) => {
    const confirmMsg = purchase.installments 
      ? `Esta compra está parcelada em ${purchase.installments}x. Todas as ${purchase.installments} parcelas serão excluídas. Deseja continuar?`
      : 'Deseja realmente excluir esta compra?'
    
    if (!confirm(confirmMsg)) return

    try {
      // Buscar e excluir todas as parcelas filhas
      const { data: childExpenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('parent_expense_id', purchase.id)

      if (childExpenses && childExpenses.length > 0) {
        // Excluir todas as parcelas
        const { error: childError } = await supabase
          .from('expenses')
          .delete()
          .eq('parent_expense_id', purchase.id)

        if (childError) {
          console.error('Error deleting installments:', childError)
          alert('Erro ao excluir parcelas: ' + childError.message)
          return
        }
      }

      // Excluir a compra parent
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', purchase.id)

      if (error) {
        console.error('Error deleting purchase:', error)
        alert('Erro ao excluir compra: ' + error.message)
      } else {
        refetch()
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('Erro ao excluir compra')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-apple-gray-400 text-sm">Carregando compras...</p>
        </div>
      </div>
    )
  }

  if (creditCardPurchases.length === 0) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center">
        <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">💳</span>
        </div>
        <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">Nenhuma compra no cartão</h3>
        <p className="text-apple-gray-400 text-sm">As compras parceladas aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Compras no Cartão</h2>
          <p className="text-sm text-apple-gray-400 mt-1">Gerencie suas compras parceladas</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-apple-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Data da Compra</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Cartão</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Parcelas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor/Parcela</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-gray-100">
              {creditCardPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-apple-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                    {formatDate(purchase.purchase_date || purchase.expense_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-apple-gray-700 font-medium">
                    {purchase.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {purchase.credit_card ? (
                      <span 
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" 
                        style={{ 
                          backgroundColor: `${purchase.credit_card.color}15`, 
                          color: purchase.credit_card.color 
                        }}
                      >
                        💳 {purchase.credit_card.name}
                      </span>
                    ) : (
                      <span className="text-apple-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-apple-red">
                    {formatCurrency(Number(purchase.total_amount || purchase.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                    {purchase.installments ? `${purchase.installments}x` : '1x'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                    {purchase.installments 
                      ? formatCurrency(Number(purchase.total_amount || purchase.amount) / purchase.installments)
                      : formatCurrency(Number(purchase.amount))
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(purchase)}
                      className="text-apple-red hover:text-apple-red/80 transition-colors font-medium"
                      title="Excluir compra e todas as parcelas"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl bg-apple-blue/5 border border-apple-blue/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h4 className="text-sm font-semibold text-apple-gray-700 mb-1">Sobre Exclusão de Compras</h4>
            <p className="text-xs text-apple-gray-600">
              Ao excluir uma compra parcelada, todas as parcelas associadas serão removidas automaticamente. 
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
