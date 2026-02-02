-- 🔍 DEBUG: Verificar despesas após exclusão
-- Execute esta consulta para ver exatamente o que está no banco

-- 1. VERIFICAR SE A DESPESA DE R$ 1.550 AINDA EXISTE
SELECT 
  'DESPESAS COM VALOR R$ 1.550:' as titulo,
  id,
  description as descricao,
  amount as valor,
  expense_date as data,
  is_paid as pago,
  is_credit_card as cartao,
  is_installment as parcela,
  parent_expense_id as pai,
  CASE 
    WHEN is_credit_card AND NOT is_installment THEN '🛒 COMPRA PARENT'
    WHEN is_credit_card AND is_installment THEN '💳 PARCELA'
    ELSE '💵 DESPESA NORMAL'
  END as tipo
FROM expenses 
WHERE amount = 1550.00
ORDER BY expense_date DESC;

-- 2. VERIFICAR TODAS AS DESPESAS DO MÊS ATUAL
SELECT 
  'TODAS AS DESPESAS DO MÊS ATUAL:' as titulo,
  expense_date as data,
  description as descricao,
  amount as valor,
  is_paid as pago,
  is_credit_card as cartao,
  is_installment as parcela,
  CASE 
    WHEN is_credit_card AND NOT is_installment THEN '🛒 PARENT (NÃO CONTA)'
    WHEN is_credit_card AND is_installment THEN '💳 PARCELA (CONTA)'
    ELSE '💵 NORMAL (CONTA)'
  END as tipo_contabilizacao
FROM expenses 
WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY expense_date DESC, amount DESC;

-- 3. CALCULAR TOTAL DE DESPESAS QUE DEVEM SER CONTABILIZADAS
SELECT 
  'TOTAL DE DESPESAS QUE DEVEM APARECER NO DASHBOARD:' as titulo,
  COUNT(*) as quantidade_despesas,
  SUM(amount) as total_valor
FROM expenses 
WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND (is_credit_card = false OR is_installment = true); -- Filtro correto

-- 4. VERIFICAR SE HÁ DESPESAS ÓRFÃS (parcelas sem parent)
SELECT 
  'DESPESAS ÓRFÃS (PARCELAS SEM PARENT):' as titulo,
  id,
  description as descricao,
  amount as valor,
  parent_expense_id as pai_id,
  'PROBLEMA: Parcela sem compra parent' as status
FROM expenses 
WHERE is_installment = true 
  AND parent_expense_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM expenses parent 
    WHERE parent.id = expenses.parent_expense_id
  );

-- 5. VERIFICAR SE HÁ COMPRAS PARENT SEM PARCELAS
SELECT 
  'COMPRAS PARENT SEM PARCELAS:' as titulo,
  id,
  description as descricao,
  amount as valor,
  installments as parcelas_esperadas,
  'PROBLEMA: Compra sem parcelas' as status
FROM expenses 
WHERE is_credit_card = true 
  AND is_installment = false
  AND installments > 1
  AND NOT EXISTS (
    SELECT 1 FROM expenses child 
    WHERE child.parent_expense_id = expenses.id
  );