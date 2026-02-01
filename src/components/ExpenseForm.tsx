'use client'

import { useState, useEffect } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { supabase } from '@/lib/supabase'
import { ExpenseCategory } from '@/types'
import { generateRecurrenceOccurrences, getRecurrenceDescription, validateRecurrenceConfig, RecurrenceFrequency, RecurrenceEndType } from '@/lib/recurrence'
import { createInstallmentsData, validateCreditCardPurchase } from '@/lib/creditCard'
import { parseISO } from 'date-fns'

interface Props {
  userId: string
  onSuccess: () => void
  onRefresh?: () => void
}

export default function ExpenseForm({ userId, onSuccess, onRefresh }: Props) {
  const { addExpense } = useExpenses(userId)
  const { creditCards } = useCreditCards(userId)
  const { members } = useFamilyMembers(userId)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: '',
    category_id: '',
    member_id: '',
    payment_method: 'cash',
    is_recurring: false,
    recurrence_frequency: 'monthly' as RecurrenceFrequency,
    recurrence_end_type: 'never' as RecurrenceEndType,
    recurrence_count: '12',
    recurrence_end_date: '',
    // Campos de cartão de crédito
    is_credit_card: false,
    credit_card_id: '',
    total_amount: '',
    installments: 1,
    purchase_date: '',
  })

  useEffect(() => {
    fetchCategories()
    // Inicializar datas após montagem para evitar hidratação
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({
      ...prev,
      expense_date: today,
      purchase_date: today
    }))
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', userId)
    
    if (data) setCategories(data)
  }

  const getPreviewOccurrences = () => {
    if (!formData.is_recurring) return []
    
    const config = {
      startDate: parseISO(formData.expense_date),
      frequency: formData.recurrence_frequency,
      endType: formData.recurrence_end_type,
      endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
      occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
    }
    
    const validation = validateRecurrenceConfig(config)
    if (!validation.valid) return []
    
    return generateRecurrenceOccurrences(config, 12)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Se for compra no cartão de crédito
      if (formData.is_credit_card && formData.payment_method === 'credit_card') {
        const card = creditCards.find(c => c.id === formData.credit_card_id)
        
        if (!card) {
          alert('Selecione um cartão de crédito')
          setLoading(false)
          return
        }

        // Validar compra
        const validation = validateCreditCardPurchase({
          totalAmount: parseFloat(formData.total_amount),
          installments: formData.installments,
          purchaseDate: formData.purchase_date,
          closingDay: card.closing_day,
        })

        if (!validation.valid) {
          alert(validation.error)
          setLoading(false)
          return
        }

        // Gerar dados das parcelas
        const installmentsData = createInstallmentsData(
          parseFloat(formData.total_amount),
          formData.installments,
          formData.purchase_date,
          card.closing_day,
          formData.description
        )

        // Criar despesa principal (parent)
        const parentExpense = {
          user_id: userId,
          amount: parseFloat(formData.total_amount),
          description: formData.description,
          expense_date: formData.purchase_date,
          category_id: formData.category_id || null,
          member_id: formData.member_id || null,
          payment_method: 'credit_card',
          is_credit_card: true,
          credit_card_id: formData.credit_card_id,
          total_amount: parseFloat(formData.total_amount),
          installments: formData.installments,
          purchase_date: formData.purchase_date,
          is_installment: false,
          is_recurring: false,
          is_paid: false,
        }

        const { data: parent, error: parentError } = await supabase
          .from('expenses')
          .insert(parentExpense as any)
          .select()
          .single() as any

        if (parentError) {
          console.error('Error creating parent expense:', parentError)
          alert('Erro ao criar despesa: ' + parentError.message)
          setLoading(false)
          return
        }

        // Criar parcelas
        const parcelas = installmentsData.map(inst => ({
          user_id: userId,
          amount: inst.amount,
          description: inst.description,
          expense_date: inst.expense_date,
          category_id: formData.category_id || null,
          member_id: formData.member_id || null,
          payment_method: 'credit_card',
          is_credit_card: true,
          credit_card_id: formData.credit_card_id,
          total_amount: parseFloat(formData.total_amount),
          installments: formData.installments,
          installment_number: inst.installment_number,
          purchase_date: formData.purchase_date,
          parent_expense_id: parent?.id,
          is_installment: true,
          is_recurring: false,
          is_paid: false,
        }))

        const { error: installmentsError } = await supabase
          .from('expenses')
          .insert(parcelas as any)

        if (installmentsError) {
          console.error('Error creating installments:', installmentsError)
          alert('Erro ao criar parcelas: ' + installmentsError.message)
          setLoading(false)
          return
        }

        onSuccess()
        if (onRefresh) onRefresh()
        setLoading(false)
        return
      }

      // Validar recorrência (para despesas normais recorrentes)
      if (formData.is_recurring) {
        const config = {
          startDate: parseISO(formData.expense_date),
          frequency: formData.recurrence_frequency,
          endType: formData.recurrence_end_type,
          endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
          occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
        }
        
        const validation = validateRecurrenceConfig(config)
        if (!validation.valid) {
          alert(validation.error)
          setLoading(false)
          return
        }
      }

      // Criar despesa normal
      const expense = {
        user_id: userId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expense_date: formData.expense_date,
        category_id: formData.category_id || null,
        member_id: formData.member_id || null,
        payment_method: formData.payment_method === 'cash' ? null : formData.payment_method,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : null,
        recurrence_start_date: formData.is_recurring ? formData.expense_date : null,
        recurrence_end_type: formData.is_recurring ? formData.recurrence_end_type : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_type === 'on_date' ? formData.recurrence_end_date : null,
        recurrence_count: formData.is_recurring && formData.recurrence_end_type === 'after_occurrences' ? parseInt(formData.recurrence_count) : null,
        parent_expense_id: null,
        is_credit_card: false,
        credit_card_id: null,
        total_amount: null,
        installments: null,
        installment_number: null,
        purchase_date: null,
        is_installment: false,
        is_paid: false,
      }

      const { error } = await addExpense(expense)
      
      if (!error) {
        onSuccess()
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('Erro ao salvar despesa')
    }
    
    setLoading(false)
  }

  const previewOccurrences = getPreviewOccurrences()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Forma de Pagamento - PRIMEIRO CAMPO */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Forma de Pagamento *
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => {
              const isCreditCard = e.target.value === 'credit_card'
              setFormData({ 
                ...formData, 
                payment_method: e.target.value,
                is_credit_card: isCreditCard,
                is_recurring: isCreditCard ? false : formData.is_recurring
              })
            }}
            className="input-field"
            required
          >
            <option value="cash">Dinheiro</option>
            <option value="debit">Débito</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="pix">PIX</option>
            <option value="transfer">Transferência</option>
          </select>
          <p className="text-xs text-apple-gray-500 mt-1">
            ⚠️ Selecione primeiro a forma de pagamento - ela altera os campos do formulário
          </p>
        </div>

        {/* Valor - condicionado pela forma de pagamento */}
        {!formData.is_credit_card && (
          <div>
            <label className="block text-sm font-medium text-apple-gray-600 mb-2">
              Valor *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              placeholder="0,00"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Data Inicial *
          </label>
          <input
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Descrição *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            placeholder="Ex: Compras no supermercado"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Categoria
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-gray-600 mb-2">
            Membro da Família
          </label>
          <select
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione um membro (opcional)</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                ● {member.name}
                {member.relationship && ` (${member.relationship})`}
              </option>
            ))}
          </select>
          {members.length === 0 && (
            <p className="text-xs text-apple-gray-400 mt-1">
              Cadastre membros da família em Configurações para organizar melhor suas despesas
            </p>
          )}
        </div>

        {formData.is_credit_card && formData.payment_method === 'credit_card' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Cartão de Crédito *
              </label>
              <select
                value={formData.credit_card_id}
                onChange={(e) => setFormData({ ...formData, credit_card_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Selecione um cartão</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Fechamento: dia {card.closing_day})
                  </option>
                ))}
              </select>
              {creditCards.length === 0 && (
                <p className="text-xs text-apple-red mt-1">
                  Você precisa cadastrar um cartão primeiro em Configurações
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Valor Total da Compra *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="input-field"
                placeholder="0,00"
                required
              />
            </div>

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
                className="input-field"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Data da Compra *
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </>
        )}

        <div className="md:col-span-2 flex items-center gap-3 p-4 bg-apple-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="recurring"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            disabled={formData.is_credit_card}
            className="w-5 h-5 text-apple-blue rounded focus:ring-2 focus:ring-apple-blue/30 disabled:opacity-50"
          />
          <label htmlFor="recurring" className="text-sm font-medium text-apple-gray-700 cursor-pointer">
            Despesa recorrente
            {formData.is_credit_card && (
              <span className="ml-2 text-xs text-apple-gray-400">(não disponível para cartão de crédito)</span>
            )}
          </label>
        </div>

        {formData.is_recurring && (
          <div className="md:col-span-2 space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Frequência
              </label>
              <select
                value={formData.recurrence_frequency}
                onChange={(e) => setFormData({ ...formData, recurrence_frequency: e.target.value as any })}
                className="input-field"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                Término da Recorrência
              </label>
              <select
                value={formData.recurrence_end_type}
                onChange={(e) => setFormData({ ...formData, recurrence_end_type: e.target.value as any })}
                className="input-field"
              >
                <option value="never">Sem fim</option>
                <option value="after_occurrences">Após X ocorrências</option>
                <option value="on_date">Até data específica</option>
              </select>
            </div>

            {formData.recurrence_end_type === 'after_occurrences' && (
              <div>
                <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                  Número de Ocorrências
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.recurrence_count}
                  onChange={(e) => setFormData({ ...formData, recurrence_count: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 12"
                />
              </div>
            )}

            {formData.recurrence_end_type === 'on_date' && (
              <div>
                <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                  className="input-field"
                  min={formData.expense_date}
                />
              </div>
            )}

            {previewOccurrences.length > 0 && (
              <div className="p-4 bg-apple-red/5 rounded-xl border border-apple-red/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-apple-gray-700">
                    Prévia das Próximas Ocorrências
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-apple-red hover:text-apple-red/80"
                  >
                    {showPreview ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-xs text-apple-gray-500 mb-2">
                  {getRecurrenceDescription({
                    startDate: parseISO(formData.expense_date),
                    frequency: formData.recurrence_frequency,
                    endType: formData.recurrence_end_type,
                    endDate: formData.recurrence_end_date ? parseISO(formData.recurrence_end_date) : undefined,
                    occurrences: formData.recurrence_count ? parseInt(formData.recurrence_count) : undefined,
                  })}
                </p>
                {showPreview && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {previewOccurrences.slice(0, 12).map((occ, idx) => (
                      <div key={idx} className="text-xs text-apple-gray-600 flex justify-between">
                        <span>{occ.date.toLocaleDateString('pt-BR')}</span>
                        <span className="text-apple-gray-400">{occ.occurrenceNumber}ª ocorrência</span>
                      </div>
                    ))}
                    {previewOccurrences.length > 12 && (
                      <p className="text-xs text-apple-gray-400 italic">
                        ... e mais {previewOccurrences.length - 12} ocorrências
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Salvando...
          </span>
        ) : (
          '+ Adicionar Despesa'
        )}
      </button>
    </form>
  )
}
