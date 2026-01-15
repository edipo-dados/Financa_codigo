'use client'

import { useState } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import IncomeForm from './IncomeForm'

interface Props {
  userId: string
}

export default function IncomesList({ userId }: Props) {
  const { incomes, loading, deleteIncome, refetch } = useIncomes(userId)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta receita?')) {
      await deleteIncome(id)
      refetch()
    }
  }

  const togglePaid = async (income: any) => {
    const { error } = await supabase
      .from('incomes')
      // @ts-ignore
      .update({ is_paid: !income.is_paid })
      .eq('id', income.id)
    
    if (error) {
      console.error('Error updating paid status:', error)
      alert('Erro ao atualizar status: ' + error.message)
    } else {
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Receitas</h2>
          <p className="text-sm text-apple-gray-400 mt-1">Gerencie suas entradas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? '✕ Cancelar' : '+ Nova Receita'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-slide-up">
          <IncomeForm userId={userId} onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-apple-gray-400 text-sm">Carregando receitas...</p>
          </div>
        </div>
      ) : incomes.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">Nenhuma receita cadastrada</h3>
          <p className="text-apple-gray-400 text-sm">Comece adicionando sua primeira receita</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-apple-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Fonte</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-apple-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {formatDate(income.income_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-apple-gray-700 font-medium">
                      {income.description}
                      {income.is_recurring && (
                        <span className="ml-2 px-2 py-0.5 bg-apple-green/10 text-apple-green text-xs rounded-md">
                          Recorrente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {income.category ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${income.category.color}15` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: income.category.color }} />
                          <span style={{ color: income.category.color }}>{income.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-apple-gray-400">Sem categoria</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {income.source || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-apple-green">
                      {formatCurrency(Number(income.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => togglePaid(income)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          income.is_paid
                            ? 'bg-apple-green/10 text-apple-green hover:bg-apple-green/20'
                            : 'bg-apple-orange/10 text-apple-orange hover:bg-apple-orange/20'
                        }`}
                        title="Clique para alterar o status"
                      >
                        {income.is_paid ? '✓ Recebido' : '⏳ A Receber'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="text-apple-red hover:text-apple-red/80 transition-colors font-medium"
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
      )}
    </div>
  )
}
