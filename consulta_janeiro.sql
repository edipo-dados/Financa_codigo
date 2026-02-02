-- Verificar quais tabelas existem no banco
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 5. DETALHAMENTO DAS RECEITAS DE JANEIRO
SELECT 
    income_date,
    description,
    amount,
    is_paid,
    CASE WHEN is_paid THEN 'PAGA' ELSE 'A RECEBER' END as status
FROM incomes 
WHERE income_date >= '2025-01-01' 
AND income_date <= '2025-01-31'
ORDER BY income_date;

-- 6. DETALHAMENTO DAS DESPESAS DE JANEIRO
SELECT 
    expense_date,
    description,
    amount,
    is_paid,
    is_credit_card,
    is_installment,
    CASE WHEN is_paid THEN 'PAGA' ELSE 'A PAGAR' END as status
FROM expenses 
WHERE expense_date >= '2025-01-01' 
AND expense_date <= '2025-01-31'
AND (is_credit_card = false OR is_installment = true)
ORDER BY expense_date;

-- 7. DETALHAMENTO DOS INVESTIMENTOS DE JANEIRO
SELECT 
    investment_date,
    name,
    initial_amount
FROM investments 
WHERE investment_date >= '2025-01-01' 
AND investment_date <= '2025-01-31'
ORDER BY investment_date;