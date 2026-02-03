-- Script para identificar e recalcular datas das parcelas de cartão de crédito
-- Execute este script no Supabase para identificar compras que precisam ser corrigidas

-- 1. Ver todas as compras de cartão e suas parcelas
SELECT 
  e.id,
  e.description,
  e.purchase_date,
  e.expense_date,
  e.installment_number,
  e.installments,
  cc.name as card_name,
  cc.closing_day,
  cc.due_day,
  e.credit_card_id,
  CASE 
    WHEN e.is_installment = false THEN 'COMPRA PARENT'
    ELSE 'PARCELA'
  END as tipo
FROM expenses e
JOIN credit_cards cc ON e.credit_card_id = cc.id
WHERE e.is_credit_card = true 
ORDER BY e.purchase_date, e.credit_card_id, e.installment_number;

-- 2. Identificar compras que PODEM estar com datas incorretas
-- (primeira parcela que está no mesmo mês da compra quando deveria estar no mês seguinte)
SELECT 
  e.id,
  e.description,
  e.purchase_date,
  e.expense_date,
  cc.name as card_name,
  cc.closing_day,
  cc.due_day,
  EXTRACT(DAY FROM e.purchase_date::date) as purchase_day,
  EXTRACT(MONTH FROM e.purchase_date::date) as purchase_month,
  EXTRACT(MONTH FROM e.expense_date::date) as expense_month,
  CASE 
    WHEN EXTRACT(DAY FROM e.purchase_date::date) <= cc.closing_day 
    THEN 'Deveria ir para mês seguinte'
    ELSE 'Deveria ir para 2 meses depois'
  END as expected_behavior,
  CASE 
    WHEN EXTRACT(DAY FROM e.purchase_date::date) <= cc.closing_day 
         AND EXTRACT(MONTH FROM e.expense_date::date) = EXTRACT(MONTH FROM e.purchase_date::date)
    THEN '❌ POSSÍVEL ERRO: Parcela no mesmo mês da compra'
    WHEN EXTRACT(DAY FROM e.purchase_date::date) > cc.closing_day 
         AND EXTRACT(MONTH FROM e.expense_date::date) <= EXTRACT(MONTH FROM e.purchase_date::date) + 1
    THEN '❌ POSSÍVEL ERRO: Parcela deveria estar 2 meses depois'
    ELSE '✅ Parece correto'
  END as status_check
FROM expenses e
JOIN credit_cards cc ON e.credit_card_id = cc.id
WHERE e.is_credit_card = true 
  AND e.is_installment = true
  AND e.installment_number = 1  -- Apenas primeira parcela para análise
ORDER BY e.purchase_date;

-- 3. Contar quantas compras podem precisar de correção
SELECT 
  cc.name as card_name,
  cc.closing_day,
  cc.due_day,
  COUNT(*) as total_compras,
  COUNT(CASE 
    WHEN EXTRACT(DAY FROM e.purchase_date::date) <= cc.closing_day 
         AND EXTRACT(MONTH FROM e.expense_date::date) = EXTRACT(MONTH FROM e.purchase_date::date)
    THEN 1
    WHEN EXTRACT(DAY FROM e.purchase_date::date) > cc.closing_day 
         AND EXTRACT(MONTH FROM e.expense_date::date) <= EXTRACT(MONTH FROM e.purchase_date::date) + 1
    THEN 1
  END) as possiveis_erros
FROM expenses e
JOIN credit_cards cc ON e.credit_card_id = cc.id
WHERE e.is_credit_card = true 
  AND e.is_installment = true
  AND e.installment_number = 1
GROUP BY cc.id, cc.name, cc.closing_day, cc.due_day
ORDER BY cc.name;

-- INSTRUÇÕES:
-- 1. Execute as consultas acima para identificar compras com possíveis problemas
-- 2. Use o botão "Recalcular Todas" no modal de edição de compras de cartão
-- 3. Ou execute a função recalculateAllCreditCardPurchases() no código JavaScript