'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { useCreditCards } from '@/hooks/useCreditCards'
import { Expense, ExpenseCategory } from '@/types'
import { createInstallmentsData, validateCreditCardPurchase, recalculateAllCreditCardPurchases } from '@/lib/creditCard'

interface Props {
  isOpen: boolean
  onClose: () => void
  purchase: Expense
  onSuccess: () => void
}

export default function EditCreditCardPurchaseModal({ isOpen, onClose, purchase, onSuccess }: Props) {
  const { members } = useFamilyMembers(purchase.user_id)
  const { creditCards } = useCreditCards(purchase.user_id)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [recalculatingAll, setRecalculatingAll] = useState(false)
  
  const [formData, setFormData] = useState({
    description: purchase.description,
    total_amount: (purchase.total_amount || purchase.amount).toString(),
    purchase_date: purchase.purchase_date || purchase.expense_date,
    category_id: purchase.category_id || '',
    member_id: purchase.member_id || '',
    credit_card_id: purchase.credit_card_id || '',
    installments: purchase.installments || 1
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      // Reset form data when purchase changes
      setFormData({
        description: purchase.description,
        total_amount: (purchase.total_amount || purchase.amount).toString(),
        purchase_date: purchase.purchase_date || purchase.expense_date,
        category_id: purchase.category_id || '',
        member_id: purchase.member_id || '',
        credit_card_id: purchase.credit_card_id || '',
        installments: purchase.installments || 1
      })
    }
  }, [isOpen, purchase])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', purchase.user_id)
      .order('name')
    
    if (data) setCategories(data)
  }

  if (!isOpen) return null

  const handleRecalculateAll = async () => {
    if (!confirm('Tem certeza que deseja recalcular TODAS as compras de cartão de crédito? Esta ação irá corrigir as datas de vencimento de todas as parcelas existentes.')) {
      return
    }

    setRecalculatingAll(true)
    
    try {
      const result = await recalculateAllCreditCardPurchases(supabase, purchase.user_id)
      
      if (result.success) {
        alert(`✅ ${result.message}`)
        onSuccess() // Refresh the data
      } else {
        alert(`❌ Erro no recálculo: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao recalcular:', error)
      alert('❌ Erro interno ao recalcular compras')
    } finally {
      setRecalculatingAll(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const totalAmount = parseFloat(formData.total_amount)
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert('Por favor, insira um valor válido')
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      alert('Por favor, insira uma descrição')
      setLoading(false)
      return
    }

    if (!formData.credit_card_id) {
      alert('Por favor, selecione um cartão de crédito')
      setLoading(false)
      return
    }

    try {
      // Atualizar a compra principal (parent)
      const updateData = {
        description: formData.description.trim(),
        total_amount: totalAmount,
        purchase_date: formData.purchase_date,
        category_id: formData.category_id || null,
        member_id: formData.member_id || null,
        credit_card_id: formData.credit_card_id,
        installments: formData.installments,
        amount: totalAmount // Manter sincronizado
      }

      const { error: parentError } = await (supabase as any)
        .from('expenses')
        .update(updateData)
        .eq('id', purchase.id)

      if (parentError) {
        console.error('Erro ao atualizar compra:', parentError)
        alert('Erro ao atualizar compra: ' + parentError.message)
        setLoading(false)
        return
      }

      // Buscar e atualizar todas as parcelas filhas (ordenadas por número da parcela)
      const { data: installments, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('parent_expense_id', purchase.id)
        .order('installment_number', { ascending: true })

      if (fetchError) {
        console.error('Erro ao buscar parcelas:', fetchError)
      } else if (installments && installments.length > 0) {
        // Verificar se precisa recalcular datas das parcelas
        const needsDateRecalculation = formData.purchase_date !== (purchase.purchase_date || purchase.expense_date)
        const needsAmountRecalculation = formData.installments !== purchase.installments || totalAmount !== (purchase.total_amount || purchase.amount)

        if (needsDateRecalculation || needsAmountRecalculation) {
          console.log('Recalculando parcelas:', {
            needsDateRecalculation,
            needsAmountRecalculation,
            oldDate: purchase.purchase_date || purchase.expense_date,
            newDate: formData.purchase_date,
            oldInstallments: purchase.installments,
            newInstallments: formData.installments
          })

          // Buscar informações do cartão para recalcular datas
          const selectedCard = creditCards.find(c => c.id === formData.credit_card_id)
          if (!selectedCard) {
            alert('Erro: Cartão não encontrado para recálculo de datas')
            setLoading(false)
            return
          }

          console.log('Cartão selecionado:', selectedCard)

          // Gerar novos dados das parcelas com datas recalculadas
          const newInstallmentsData = createInstallmentsData(
            totalAmount,
            formData.installments,
            formData.purchase_date,
            selectedCard.closing_day,
            formData.description.trim()
          )

          console.log('Novos dados das parcelas:', newInstallmentsData)

          // Atualizar cada parcela com nova data e valor (correspondência por installment_number)
          for (const installment of installments) {
            const installmentNumber = (installment as any).installment_number
            const newData = newInstallmentsData.find(data => data.installment_number === installmentNumber)
            
            if (newData) {
              await (supabase as any)
                .from('expenses')
                .update({
                  amount: newData.amount,
                  description: newData.description,
                  expense_date: newData.expense_date, // Nova data calculada
                  category_id: formData.category_id || null,
                  member_id: formData.member_id || null,
                  credit_card_id: formData.credit_card_id,
                  purchase_date: formData.purchase_date,
                  total_amount: totalAmount,
                  installments: formData.installments
                })
                .eq('id', (installment as any).id)
            }
          }

          // Se o número de parcelas aumentou, criar novas parcelas
          if (formData.installments > installments.length) {
            const existingNumbers = installments.map((inst: any) => inst.installment_number)
            const newInstallments = newInstallmentsData
              .filter(data => !existingNumbers.includes(data.installment_number))
              .map(inst => ({
                user_id: purchase.user_id,
                amount: inst.amount,
                description: inst.description,
                expense_date: inst.expense_date,
                category_id: formData.category_id || null,
                member_id: formData.member_id || null,
                payment_method: 'credit_card',
                is_credit_card: true,
                credit_card_id: formData.credit_card_id,
                total_amount: totalAmount,
                installments: formData.installments,
                installment_number: inst.installment_number,
                purchase_date: formData.purchase_date,
                parent_expense_id: purchase.id,
                is_installment: true,
                is_recurring: false,
                is_paid: false,
              }))

            if (newInstallments.length > 0) {
              const { error: newInstallmentsError } = await (supabase as any)
                .from('expenses')
                .insert(newInstallments)

              if (newInstallmentsError) {
                console.error('Erro ao criar novas parcelas:', newInstallmentsError)
                alert('Aviso: Algumas parcelas podem não ter sido criadas: ' + newInstallmentsError.message)
              }
            }
          }

          // Se o número de parcelas diminuiu, excluir parcelas extras
          if (formData.installments < installments.length) {
            const installmentsToDelete = installments.filter((inst: any) => 
              inst.installment_number > formData.installments
            )
            
            for (const installment of installmentsToDelete) {
              await (supabase as any)
                .from('expenses')
                .delete()
                .eq('id', (installment as any).id)
            }
          }
        } else {
          // Apenas atualizar informações básicas das parcelas (sem recalcular datas/valores)
          const installmentUpdates = {
            description: formData.description.trim(),
            category_id: formData.category_id || null,
            member_id: formData.member_id || null,
            credit_card_id: formData.credit_card_id,
            purchase_date: formData.purchase_date,
            total_amount: totalAmount,
            installments: formData.installments
          }

          const { error: installmentsError } = await (supabase as any)
            .from('expenses')
            .update(installmentUpdates)
            .eq('parent_expense_id', purchase.id)

          if (installmentsError) {
            console.error('Erro ao atualizar parcelas:', installmentsError)
            alert('Aviso: Compra atualizada, mas houve erro ao atualizar algumas parcelas: ' + installmentsError.message)
          }
        }
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
      alert('Erro ao atualizar compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card p-6 rounded-3xl max-w-2xl w-full mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-apple-gray-700 flex items-center gap-2">
              💳 Editar Compra no Cartão
            </h3>
            <p className="text-sm text-apple-gray-500 mt-1">
              Altere as informações da compra parcelada
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="Ex: Compras no supermercado"
                required
              />
            </div>

            {/* Valor Total */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor Total *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                placeholder="0,00"
                required
              />
            </div>

            {/* Número de Parcelas */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Número de Parcelas *
              </label>
              <input
                type="number"
                min="1"
                max="48"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                required
              />
              <p className="text-xs text-apple-gray-400 mt-1">
                {formData.total_amount && formData.installments > 0 && (
                  <>
                    {formData.installments}x de R$ {(parseFloat(formData.total_amount) / formData.installments).toFixed(2)}
                  </>
                )}
              </p>
            </div>

            {/* Data da Compra */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data da Compra *
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                required
              />
            </div>

            {/* Cartão de Crédito */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Cartão de Crédito *
              </label>
              <select
                value={formData.credit_card_id}
                onChange={(e) => setFormData({ ...formData, credit_card_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
                required
              >
                <option value="">Selecione um cartão</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Fechamento: dia {card.closing_day})
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Membro da Família */}
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Membro da Família
              </label>
              <select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="w-full px-4 py-3 border border-apple-gray-200 rounded-lg focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
              >
                <option value="">Selecione um membro (opcional)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.relationship && `(${member.relationship})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informações da Compra Original */}
          <div className="bg-apple-gray-50 p-4 rounded-lg border border-apple-gray-200">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-2">Informações da compra:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p><strong>Criada em:</strong> {new Date(purchase.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>ID:</strong> {purchase.id.slice(0, 8)}...</p>
                  <p><strong>Parcelas originais:</strong> {purchase.installments}x</p>
                  <p><strong>Valor original:</strong> R$ {(purchase.total_amount || purchase.amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso sobre alterações */}
          <div className="bg-apple-orange/5 p-4 rounded-lg border border-apple-orange/20">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-apple-gray-600">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Alterações no valor total ou número de parcelas irão recalcular automaticamente o valor de cada parcela</li>
                  <li>• Alterações na data da compra irão recalcular as datas de vencimento de todas as parcelas</li>
                  <li>• Todas as parcelas desta compra serão atualizadas com as novas informações</li>
                  <li>• Se aumentar o número de parcelas, novas parcelas serão criadas</li>
                  <li>• Se diminuir o número de parcelas, as parcelas extras serão excluídas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botão para recalcular todas as compras */}
          <div className="bg-apple-blue/5 p-4 rounded-lg border border-apple-blue/20">
            <div className="flex items-start gap-3">
              <span className="text-lg">🔄</span>
              <div className="flex-1">
                <p className="font-medium text-sm text-apple-gray-700 mb-2">
                  Recalcular Todas as Compras de Cartão
                </p>
                <p className="text-xs text-apple-gray-600 mb-3">
                  Se você tem compras antigas com datas incorretas (especialmente para cartões com fechamento no final do mês), 
                  use esta opção para corrigir automaticamente todas as datas de vencimento das parcelas.
                </p>
                <button
                  type="button"
                  onClick={handleRecalculateAll}
                  disabled={recalculatingAll}
                  className="px-3 py-2 bg-apple-blue text-white text-xs rounded-lg hover:bg-apple-blue/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {recalculatingAll ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recalculando...
                    </>
                  ) : (
                    <>
                      🔄 Recalcular Todas
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-apple-gray-200 text-apple-gray-600 rounded-lg hover:bg-apple-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-apple-blue text-white px-4 py-3 rounded-lg hover:bg-apple-blue/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                '💾 Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}