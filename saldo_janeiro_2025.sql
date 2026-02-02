-- ========================================
-- CÁLCULO DO SALDO LÍQUIDO DE JANEIRO 2025
-- ========================================
-- Fórmula: (Receitas - Despesas - Investimentos) + Saldo Acumulado Anterior

-- 1. RECEITAS DE JANEIRO 2025
WITH receitas_janeiro AS (
  SELECT 
    COALESCE(SUM(amount), 0) as total_receitas,
    COALESCE(SUM(CASE WHEN is_paid = true THEN amount ELSE 0 END), 0) as receitas_pagas,
    COALESCE(SUM(CASE WHEN is_paid = false THEN amount ELSE 0 END), 0) as receitas_pendentes,
    COUNT(*) as qtd_receitas
  FROM incomes 
  WHERE income_date >= '2025-01-01' 
    AND income_date <= '2025-01-31'
),

-- 2. DESPESAS DE JANEIRO 2025 (apenas parcelas de cartão, não compras parent)
despesas_janeiro AS (
  SELECT 
    COALESCE(SUM(amount), 0) as total_despesas,
    COALESCE(SUM(CASE WHEN is_paid = true THEN amount ELSE 0 END), 0) as despesas_pagas,
    COALESCE(SUM(CASE WHEN is_paid = false THEN amount ELSE 0 END), 0) as despesas_pendentes,
    COUNT(*) as qtd_despesas
  FROM expenses 
  WHERE expense_date >= '2025-01-01' 
    AND expense_date <= '2025-01-31'
    AND (is_credit_card = false OR is_installment = true)
),

-- 3. INVESTIMENTOS DE JANEIRO 2025
investimentos_janeiro AS (
  SELECT 
    COALESCE(SUM(initial_amount), 0) as total_investimentos,
    COUNT(*) as qtd_investimentos
  FROM investments 
  WHERE investment_date >= '2025-01-01' 
    AND investment_date <= '2025-01-31'
),

-- 4. SALDO ACUMULADO ATÉ DEZEMBRO 2024
saldo_anterior AS (
  SELECT 
    (
      -- Receitas pagas até dezembro 2024
      COALESCE((SELECT SUM(amount) FROM incomes WHERE income_date <= '2024-12-31' AND is_paid = true), 0) -
      -- Despesas pagas até dezembro 2024 (apenas parcelas)
      COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date <= '2024-12-31' AND is_paid = true AND (is_credit_card = false OR is_installment = true)), 0) -
      -- Investimentos até dezembro 2024
      COALESCE((SELECT SUM(initial_amount) FROM investments WHERE investment_date <= '2024-12-31'), 0)
    ) as saldo_acumulado_anterior
)

-- 5. CÁLCULO FINAL DO SALDO LÍQUIDO DE JANEIRO 2025
SELECT 
  '🗓️ JANEIRO 2025 - RESUMO FINANCEIRO' as titulo,
  '' as separador1,
  
  -- Dados do período
  '📊 DADOS DO PERÍODO:' as secao_periodo,
  CONCAT('💰 Receitas: R$ ', TO_CHAR(r.total_receitas, 'FM999G999G999D00')) as receitas_total,
  CONCAT('   ✅ Pagas: R$ ', TO_CHAR(r.receitas_pagas, 'FM999G999G999D00')) as receitas_pagas,
  CONCAT('   ⏳ Pendentes: R$ ', TO_CHAR(r.receitas_pendentes, 'FM999G999G999D00')) as receitas_pendentes,
  CONCAT('   📝 Quantidade: ', r.qtd_receitas, ' receita(s)') as receitas_qtd,
  
  '' as separador2,
  CONCAT('💸 Despesas: R$ ', TO_CHAR(d.total_despesas, 'FM999G999G999D00')) as despesas_total,
  CONCAT('   ✅ Pagas: R$ ', TO_CHAR(d.despesas_pagas, 'FM999G999G999D00')) as despesas_pagas,
  CONCAT('   ⏳ Pendentes: R$ ', TO_CHAR(d.despesas_pendentes, 'FM999G999G999D00')) as despesas_pendentes,
  CONCAT('   📝 Quantidade: ', d.qtd_despesas, ' despesa(s)') as despesas_qtd,
  
  '' as separador3,
  CONCAT('📈 Investimentos: R$ ', TO_CHAR(i.total_investimentos, 'FM999G999G999D00')) as investimentos_total,
  CONCAT('   📝 Quantidade: ', i.qtd_investimentos, ' investimento(s)') as investimentos_qtd,
  
  '' as separador4,
  
  -- Cálculos
  '🧮 CÁLCULOS:' as secao_calculos,
  CONCAT('📊 Saldo Acumulado Anterior: R$ ', TO_CHAR(s.saldo_acumulado_anterior, 'FM999G999G999D00')) as saldo_anterior,
  CONCAT('💵 Saldo do Período: R$ ', TO_CHAR((r.total_receitas - d.total_despesas - i.total_investimentos), 'FM999G999G999D00')) as saldo_periodo,
  
  '' as separador5,
  
  -- Resultado final
  '🎯 RESULTADO FINAL:' as secao_resultado,
  CONCAT('💎 SALDO LÍQUIDO JANEIRO: R$ ', 
    TO_CHAR(
      (r.total_receitas - d.total_despesas - i.total_investimentos) + s.saldo_acumulado_anterior, 
      'FM999G999G999D00'
    )
  ) as saldo_liquido_final,
  
  '' as separador6,
  
  -- Fórmula explicada
  '📋 FÓRMULA APLICADA:' as secao_formula,
  'Saldo Líquido = (Receitas - Despesas - Investimentos) + Saldo Anterior' as formula,
  CONCAT('Saldo Líquido = (', 
    TO_CHAR(r.total_receitas, 'FM999G999G999D00'), ' - ',
    TO_CHAR(d.total_despesas, 'FM999G999G999D00'), ' - ',
    TO_CHAR(i.total_investimentos, 'FM999G999G999D00'), ') + ',
    TO_CHAR(s.saldo_acumulado_anterior, 'FM999G999G999D00')
  ) as calculo_detalhado

FROM receitas_janeiro r
CROSS JOIN despesas_janeiro d  
CROSS JOIN investimentos_janeiro i
CROSS JOIN saldo_anterior s;

-- ========================================
-- CONSULTA ADICIONAL: DETALHAMENTO POR TRANSAÇÃO
-- ========================================

-- Receitas de Janeiro detalhadas
SELECT 
  '💰 RECEITAS DE JANEIRO 2025:' as titulo,
  income_date as data,
  description as descricao,
  CONCAT('R$ ', TO_CHAR(amount, 'FM999G999G999D00')) as valor,
  CASE WHEN is_paid THEN '✅ PAGA' ELSE '⏳ PENDENTE' END as status
FROM incomes 
WHERE income_date >= '2025-01-01' AND income_date <= '2025-01-31'
ORDER BY income_date;

-- Despesas de Janeiro detalhadas
SELECT 
  '💸 DESPESAS DE JANEIRO 2025:' as titulo,
  expense_date as data,
  description as descricao,
  CONCAT('R$ ', TO_CHAR(amount, 'FM999G999G999D00')) as valor,
  CASE WHEN is_paid THEN '✅ PAGA' ELSE '⏳ PENDENTE' END as status,
  CASE 
    WHEN is_credit_card AND is_installment THEN '💳 PARCELA'
    WHEN is_credit_card AND NOT is_installment THEN '💳 COMPRA TOTAL'
    ELSE '💵 DESPESA NORMAL'
  END as tipo
FROM expenses 
WHERE expense_date >= '2025-01-01' AND expense_date <= '2025-01-31'
  AND (is_credit_card = false OR is_installment = true)
ORDER BY expense_date;

-- Investimentos de Janeiro detalhados
SELECT 
  '📈 INVESTIMENTOS DE JANEIRO 2025:' as titulo,
  investment_date as data,
  name as descricao,
  CONCAT('R$ ', TO_CHAR(initial_amount, 'FM999G999G999D00')) as valor_investido,
  CONCAT('R$ ', TO_CHAR(current_amount, 'FM999G999G999D00')) as valor_atual
FROM investments 
WHERE investment_date >= '2025-01-01' AND investment_date <= '2025-01-31'
ORDER BY investment_date;