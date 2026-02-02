-- Debug: Comparar cálculos de fatura entre Widget e Aba de Cartões

-- 1. WIDGET DO DASHBOARD: Filtra parcelas por período (expense_date)
-- Simula o que o CreditCardWidget faz
SELECT 
  'WIDGET DASHBOARD - Parcelas no período' as source,
  COUNT(*) as parcelas_count,
  SUM(amount) as total_amount,
  MIN(expense_date) as primeira_data,
  MAX(expense_date) as ultima_data
FROM expenses 
WHERE is_credit_card = true 
  AND is_installment = true
  AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)  -- Início do mês atual
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'; -- Fim do mês atual

-- 2. ABA DE CARTÕES: Filtra parcelas por mês de vencimento específico
-- Simula o que o CreditCardPurchasesList faz quando um mês é selecionado
SELECT 
  'ABA CARTÕES - Parcelas que vencem no mês' as source,
  credit_card_id,
  cc.name as card_name,
  COUNT(*) as parcelas_count,
  SUM(amount) as total_amount,
  EXTRACT(YEAR FROM expense_date) as ano,
  EXTRACT(MONTH FROM expense_date) as mes
FROM expenses e
LEFT JOIN credit_cards cc ON e.credit_card_id = cc.id
WHERE is_credit_card = true 
  AND is_installment = true
GROUP BY credit_card_id, cc.name, EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date)
ORDER BY ano DESC, mes DESC, card_name;

-- 3. COMPARAÇÃO DETALHADA: Mostrar todas as parcelas do mês atual
SELECT 
  'DETALHAMENTO PARCELAS MÊS ATUAL' as info,
  e.id,
  e.description,
  e.amount,
  e.expense_date,
  e.installment_number,
  e.installments,
  cc.name as card_name,
  cc.closing_day,
  e.parent_expense_id,
  -- Calcular qual seria o mês da fatura baseado na data da compra original
  CASE 
    WHEN parent.purchase_date IS NOT NULL THEN
      CASE 
        WHEN EXTRACT(DAY FROM parent.purchase_date) <= cc.closing_day THEN
          TO_CHAR(parent.purchase_date, 'YYYY-MM')
        ELSE 
          TO_CHAR(parent.purchase_date + INTERVAL '1 month', 'YYYY-MM')
      END
    ELSE 'N/A'
  END as mes_fatura_calculado,
  TO_CHAR(e.expense_date, 'YYYY-MM') as mes_vencimento_parcela
FROM expenses e
LEFT JOIN credit_cards cc ON e.credit_card_id = cc.id
LEFT JOIN expenses parent ON e.parent_expense_id = parent.id
WHERE e.is_credit_card = true 
  AND e.is_installment = true
  AND e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND e.expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY cc.name, e.expense_date, e.installment_number;

-- 4. VERIFICAR SE HÁ PARCELAS ÓRFÃS (sem parent)
SELECT 
  'PARCELAS ÓRFÃS (SEM PARENT)' as problema,
  COUNT(*) as count
FROM expenses 
WHERE is_credit_card = true 
  AND is_installment = true 
  AND parent_expense_id IS NULL;