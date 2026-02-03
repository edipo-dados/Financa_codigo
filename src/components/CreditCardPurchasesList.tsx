'use client'

import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import EditCreditCardPurchaseModal from './EditCreditCardPurchaseModal'

interface Props {
  userId: string
}

export default function CreditCardPurchasesList({ userId }: Props) {
  const { expenses, loading, refetch } = useExpenses(userId)
  const { creditCards } = useCreditCards(userId)
  const { members } = useFamilyMembers(userId)
  const [editingPurchase, setEditingPurchase] = useState<any>(null)

  // Estados dos filtros
  const [selectedStatus, setSelectedStatus] = useState<string>('all') // all, paid, unpaid
  const [selectedCard, setSelectedCard] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<string>('all')
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string>('all') // YYYY-MM format

  // Filtrar apenas compras parent de cartão (não parcelas)
  const creditCardPurchases = expenses.filter(e => 
    e.is_credit_card && !e.is_installment
  )

  // Função para calcular o mês de fechamento da fatura
  const getInvoiceMonth = (purchase: any, cardClosingDay: number) => {
    if (!purchase.purchase_date) return null
    
    const purchaseDate = new Date(purchase.purchase_date)
    const purchaseDay = purchaseDate.getDate()
    
    // Se a compra foi antes do fechamento, entra na fatura do mês atual
    // Se foi depois, entra na fatura do próximo mês
    if (purchaseDay <= cardClosingDay) {
      return `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      const nextMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, 1)
      return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
    }
  }

  // Gerar lista de meses de fatura disponíveis baseado no cartão selecionado
  const availableInvoiceMonths = useMemo(() => {
    if (selectedCard === 'all') return []
    
    const selectedCardData = creditCards.find(c => c.id === selectedCard)
    if (!selectedCardData) return []
    
    // Buscar todas as parcelas do cartão selecionado
    const cardInstallments = expenses.filter(e => 
      e.is_credit_card && 
      e.is_installment && 
      e.credit_card_id === selectedCard
    )
    
    const months = new Set<string>()
    
    // Adicionar meses baseados nas datas das parcelas
    cardInstallments.forEach(installment => {
      const installmentDate = new Date(installment.expense_date)
      const monthKey = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
      months.add(monthKey)
    })
    
    return Array.from(months).sort() // Ordem cronológica (janeiro primeiro)
  }, [selectedCard, expenses, creditCards])

  // Aplicar filtros
  const filteredPurchases = useMemo(() => {
    return creditCardPurchases.filter(purchase => {
      // Filtro por cartão (aplicar primeiro)
      if (selectedCard !== 'all' && purchase.credit_card_id !== selectedCard) {
        return false
      }

      // Filtro por mês de fechamento da fatura (baseado nas parcelas que vencem no mês)
      if (selectedInvoiceMonth !== 'all' && selectedCard !== 'all') {
        // Buscar parcelas desta compra
        const installments = expenses.filter(e => 
          e.parent_expense_id === purchase.id && e.is_installment
        )
        
        if (installments.length > 0) {
          // Verificar se alguma parcela vence no mês selecionado
          const hasInstallmentInMonth = installments.some(installment => {
            const installmentDate = new Date(installment.expense_date)
            const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
            return installmentMonth === selectedInvoiceMonth
          })
          
          if (!hasInstallmentInMonth) {
            return false
          }
        } else {
          // Se não há parcelas, usar a lógica original baseada na data da compra
          const selectedCardData = creditCards.find(c => c.id === selectedCard)
          if (selectedCardData) {
            const purchaseInvoiceMonth = getInvoiceMonth(purchase, selectedCardData.closing_day)
            if (purchaseInvoiceMonth !== selectedInvoiceMonth) {
              return false
            }
          }
        }
      }

      // Filtro por status de pagamento (baseado nas parcelas)
      if (selectedStatus !== 'all') {
        // Buscar parcelas desta compra para verificar status
        const installments = expenses.filter(e => 
          e.parent_expense_id === purchase.id && e.is_installment
        )
        
        if (installments.length > 0) {
          const allPaid = installments.every(inst => inst.is_paid)
          const allUnpaid = installments.every(inst => !inst.is_paid)
          
          if (selectedStatus === 'paid' && !allPaid) return false
          if (selectedStatus === 'unpaid' && !allUnpaid) return false
          if (selectedStatus === 'partial' && (allPaid || allUnpaid)) return false
        } else {
          // Se não há parcelas, verificar o próprio purchase
          if (selectedStatus === 'paid' && !purchase.is_paid) return false
          if (selectedStatus === 'unpaid' && purchase.is_paid) return false
        }
      }

      // Filtro por membro da família
      if (selectedMember !== 'all' && purchase.member_id !== selectedMember) {
        return false
      }

      return true
    })
  }, [creditCardPurchases, expenses, selectedStatus, selectedCard, selectedMember, selectedInvoiceMonth, creditCards])

  // Calcular valor total da fatura do mês selecionado (APÓS filteredPurchases)
  const invoiceTotal = useMemo(() => {
    if (selectedInvoiceMonth === 'all' || selectedCard === 'all') return 0
    
    // Usar as mesmas compras que aparecem na lista filtrada
    const invoicePurchases = filteredPurchases.filter(purchase => {
      // Verificar se esta compra tem parcelas que vencem no mês selecionado
      const installments = expenses.filter(e => 
        e.parent_expense_id === purchase.id && e.is_installment
      )
      
      if (installments.length > 0) {
        // Verificar se alguma parcela vence no mês selecionado
        return installments.some(installment => {
          const installmentDate = new Date(installment.expense_date)
          const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
          return installmentMonth === selectedInvoiceMonth
        })
      } else {
        // Se não há parcelas, usar a lógica original baseada na data da compra
        const selectedCardData = creditCards.find(c => c.id === selectedCard)
        if (selectedCardData) {
          const purchaseInvoiceMonth = getInvoiceMonth(purchase, selectedCardData.closing_day)
          return purchaseInvoiceMonth === selectedInvoiceMonth
        }
      }
      
      return false
    })
    
    // Somar apenas as parcelas que vencem no mês selecionado das compras filtradas
    let total = 0
    invoicePurchases.forEach(purchase => {
      const installments = expenses.filter(e => 
        e.parent_expense_id === purchase.id && e.is_installment
      )
      
      if (installments.length > 0) {
        // Somar apenas parcelas que vencem no mês selecionado
        const monthInstallments = installments.filter(installment => {
          const installmentDate = new Date(installment.expense_date)
          const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
          return installmentMonth === selectedInvoiceMonth
        })
        
        total += monthInstallments.reduce((sum, installment) => sum + Number(installment.amount), 0)
      } else {
        // Se não há parcelas, usar o valor total da compra
        total += Number(purchase.total_amount || purchase.amount)
      }
    })
    
    console.log('💳 CreditCardPurchasesList invoiceTotal (CORRIGIDO):', {
      selectedCard,
      selectedInvoiceMonth,
      invoicePurchases: invoicePurchases.length,
      total,
      purchasesList: invoicePurchases.map(p => ({
        id: p.id,
        description: p.description,
        total_amount: p.total_amount || p.amount,
        installments_in_month: expenses.filter(e => 
          e.parent_expense_id === p.id && 
          e.is_installment &&
          (() => {
            const installmentDate = new Date(e.expense_date)
            const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
            return installmentMonth === selectedInvoiceMonth
          })()
        ).length
      }))
    })
    
    return total
  }, [selectedInvoiceMonth, selectedCard, expenses, filteredPurchases, creditCards])

  // Função para obter status da fatura
  const getInvoiceStatus = (purchase: any) => {
    const installments = expenses.filter(e => 
      e.parent_expense_id === purchase.id && e.is_installment
    )
    
    if (installments.length === 0) {
      return purchase.is_paid ? 'paid' : 'unpaid'
    }
    
    const paidCount = installments.filter(inst => inst.is_paid).length
    const totalCount = installments.length
    
    if (paidCount === 0) return 'unpaid'
    if (paidCount === totalCount) return 'paid'
    return 'partial'
  }

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '✅ Paga'
      case 'unpaid': return '⏳ Pendente'
      case 'partial': return '🔄 Parcial'
      default: return '-'
    }
  }

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50'
      case 'unpaid': return 'text-red-600 bg-red-50'
      case 'partial': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

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

  if (filteredPurchases.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filtros */}
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-4">🔍 Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Cartão */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">Cartão</label>
              <select
                value={selectedCard}
                onChange={(e) => {
                  setSelectedCard(e.target.value)
                  setSelectedInvoiceMonth('all') // Reset invoice month when card changes
                }}
                className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="all">Todos os Cartões</option>
                {creditCards.map(card => (
                  <option key={card.id} value={card.id}>
                    💳 {card.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Mês de Fechamento da Fatura */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Mês da Fatura
                {selectedCard === 'all' && (
                  <span className="text-xs text-apple-gray-400 ml-1">(selecione um cartão)</span>
                )}
              </label>
              <select
                value={selectedInvoiceMonth}
                onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                disabled={selectedCard === 'all'}
                className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">Todos os Meses</option>
                {availableInvoiceMonths.map(month => {
                  const [year, monthNum] = month.split('-')
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })
                  return (
                    <option key={month} value={month}>
                      📅 {monthName}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Filtro por Status da Fatura */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">Status da Fatura</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="all">Todas as Faturas</option>
                <option value="paid">✅ Pagas</option>
                <option value="unpaid">⏳ Pendentes</option>
                <option value="partial">🔄 Parcialmente Pagas</option>
              </select>
            </div>

            {/* Filtro por Membro */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">Membro da Família</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="all">Todos os Membros</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    👤 {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão para limpar filtros */}
          {(selectedStatus !== 'all' || selectedCard !== 'all' || selectedMember !== 'all' || selectedInvoiceMonth !== 'all') && (
            <div className="mt-4 pt-4 border-t border-apple-gray-200">
              <button
                onClick={() => {
                  setSelectedStatus('all')
                  setSelectedCard('all')
                  setSelectedMember('all')
                  setSelectedInvoiceMonth('all')
                }}
                className="px-4 py-2 text-sm bg-apple-gray-100 text-apple-gray-600 rounded-lg hover:bg-apple-gray-200 transition-colors"
              >
                🔄 Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Card com valor total da fatura do mês */}
        {selectedCard !== 'all' && selectedInvoiceMonth !== 'all' && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  💳 Valor Total da Fatura
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  {creditCards.find(c => c.id === selectedCard)?.name} - {
                    new Date(selectedInvoiceMonth + '-01').toLocaleDateString('pt-BR', { 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(invoiceTotal)}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  0 compras (filtros aplicados)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💳</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
            {creditCardPurchases.length === 0 ? 'Nenhuma compra no cartão' : 'Nenhuma compra encontrada'}
          </h3>
          <p className="text-apple-gray-400 text-sm">
            {creditCardPurchases.length === 0 
              ? 'As compras parceladas aparecerão aqui' 
              : 'Tente ajustar os filtros para encontrar as compras desejadas'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-apple-gray-700 mb-4">🔍 Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Cartão */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">Cartão</label>
            <select
              value={selectedCard}
              onChange={(e) => {
                setSelectedCard(e.target.value)
                setSelectedInvoiceMonth('all') // Reset invoice month when card changes
              }}
              className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="all">Todos os Cartões</option>
              {creditCards.map(card => (
                <option key={card.id} value={card.id}>
                  💳 {card.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Mês de Fechamento da Fatura */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Mês da Fatura
              {selectedCard === 'all' && (
                <span className="text-xs text-apple-gray-400 ml-1">(selecione um cartão)</span>
              )}
            </label>
            <select
              value={selectedInvoiceMonth}
              onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
              disabled={selectedCard === 'all'}
              className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">Todos os Meses</option>
              {availableInvoiceMonths.map(month => {
                const [year, monthNum] = month.split('-')
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })
                return (
                  <option key={month} value={month}>
                    📅 {monthName}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Filtro por Status da Fatura */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">Status da Fatura</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="all">Todas as Faturas</option>
              <option value="paid">✅ Pagas</option>
              <option value="unpaid">⏳ Pendentes</option>
              <option value="partial">🔄 Parcialmente Pagas</option>
            </select>
          </div>

          {/* Filtro por Membro */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">Membro da Família</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
            >
              <option value="all">Todos os Membros</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  👤 {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        {(selectedStatus !== 'all' || selectedCard !== 'all' || selectedMember !== 'all' || selectedInvoiceMonth !== 'all') && (
          <div className="mt-4 pt-4 border-t border-apple-gray-200">
            <button
              onClick={() => {
                setSelectedStatus('all')
                setSelectedCard('all')
                setSelectedMember('all')
                setSelectedInvoiceMonth('all')
              }}
              className="px-4 py-2 text-sm bg-apple-gray-100 text-apple-gray-600 rounded-lg hover:bg-apple-gray-200 transition-colors"
            >
              🔄 Limpar Filtros
            </button>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mt-4 pt-4 border-t border-apple-gray-200">
          <p className="text-sm text-apple-gray-600">
            Mostrando <span className="font-semibold">{filteredPurchases.length}</span> de <span className="font-semibold">{creditCardPurchases.length}</span> compras
            {selectedCard !== 'all' && selectedInvoiceMonth !== 'all' && (
              <span className="ml-2 text-blue-600">
                • Fatura: {availableInvoiceMonths.find(m => m === selectedInvoiceMonth) && 
                  new Date(selectedInvoiceMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                }
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Card com valor total da fatura do mês */}
      {selectedCard !== 'all' && selectedInvoiceMonth !== 'all' && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                💳 Valor Total da Fatura
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                {creditCards.find(c => c.id === selectedCard)?.name} - {
                  new Date(selectedInvoiceMonth + '-01').toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(invoiceTotal)}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {filteredPurchases.length} {filteredPurchases.length === 1 ? 'compra' : 'compras'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-apple-gray-700">Compras no Cartão</h2>
        </div>
        {/* Botão de Refresh */}
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-xl text-apple-gray-600 hover:text-apple-blue transition-all duration-200 shadow-apple hover:shadow-apple-lg disabled:opacity-50"
        >
          <svg 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-medium text-sm">Atualizar</span>
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-apple-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Data da Compra</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Cartão</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Membro</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Parcelas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Progresso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Valor/Parcela</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Status Fatura</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-apple-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-gray-100">
              {filteredPurchases.map((purchase) => {
                const invoiceStatus = getInvoiceStatus(purchase)
                const memberName = members.find(m => m.id === purchase.member_id)?.name || '-'
                
                // Calcular progresso das parcelas
                const allInstallments = expenses.filter(e => 
                  e.parent_expense_id === purchase.id && e.is_installment
                )
                
                let installmentsToShow = allInstallments
                let paidInstallments = 0
                let totalInstallments = allInstallments.length || purchase.installments || 1
                
                // Se um mês específico está selecionado, mostrar progresso específico para esse mês
                if (selectedInvoiceMonth !== 'all') {
                  // Filtrar parcelas do mês selecionado
                  const monthInstallments = allInstallments.filter(installment => {
                    const installmentDate = new Date(installment.expense_date)
                    const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
                    return installmentMonth === selectedInvoiceMonth
                  })
                  
                  if (monthInstallments.length > 0) {
                    // Mostrar progresso geral, mas destacar parcelas do mês
                    paidInstallments = allInstallments.filter(inst => inst.is_paid).length
                    const monthPaidInstallments = monthInstallments.filter(inst => inst.is_paid).length
                    const progressText = `${paidInstallments}/${totalInstallments} parcelas (${monthPaidInstallments}/${monthInstallments.length} neste mês)`
                  } else {
                    paidInstallments = allInstallments.filter(inst => inst.is_paid).length
                  }
                } else {
                  paidInstallments = allInstallments.filter(inst => inst.is_paid).length
                }
                
                const progressText = selectedInvoiceMonth !== 'all' && allInstallments.length > 0
                  ? (() => {
                      const monthInstallments = allInstallments.filter(installment => {
                        const installmentDate = new Date(installment.expense_date)
                        const installmentMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`
                        return installmentMonth === selectedInvoiceMonth
                      })
                      const monthPaidInstallments = monthInstallments.filter(inst => inst.is_paid).length
                      return monthInstallments.length > 0 
                        ? `${paidInstallments}/${totalInstallments} total (${monthPaidInstallments}/${monthInstallments.length} neste mês)`
                        : `${paidInstallments}/${totalInstallments} parcelas`
                    })()
                  : totalInstallments > 1 
                    ? `${paidInstallments}/${totalInstallments} parcelas`
                    : 'À vista'
                
                return (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {memberName !== '-' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                          👤 {memberName}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {totalInstallments > 1 ? (
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-medium ${
                            paidInstallments === totalInstallments 
                              ? 'text-green-600' 
                              : paidInstallments === 0 
                                ? 'text-red-600' 
                                : 'text-orange-600'
                          }`}>
                            {progressText}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  paidInstallments === totalInstallments 
                                    ? 'bg-green-500' 
                                    : paidInstallments === 0 
                                      ? 'bg-red-500' 
                                      : 'bg-orange-500'
                                }`}
                                style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round((paidInstallments / totalInstallments) * 100)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-apple-gray-500">{progressText}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray-600">
                      {purchase.installments 
                        ? formatCurrency(Number(purchase.total_amount || purchase.amount) / purchase.installments)
                        : formatCurrency(Number(purchase.amount))
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(invoiceStatus)}`}>
                        {getStatusText(invoiceStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPurchase(purchase)}
                          className="text-apple-blue hover:text-apple-blue/80 transition-colors font-medium text-sm"
                          title="Editar compra"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(purchase)}
                          className="text-apple-red hover:text-apple-red/80 transition-colors font-medium text-sm"
                          title="Excluir compra e todas as parcelas"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {/* Modal de Edição de Compra */}
      {editingPurchase && (
        <EditCreditCardPurchaseModal
          isOpen={!!editingPurchase}
          onClose={() => setEditingPurchase(null)}
          purchase={editingPurchase}
          onSuccess={() => {
            refetch()
            setEditingPurchase(null)
          }}
        />
      )}
    </div>
  )
}
