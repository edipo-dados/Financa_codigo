-- Test query to verify expense deletion and dashboard calculation
-- Run this before and after deleting an expense to see the difference

-- 1. Count total expenses that should appear in dashboard (excluding credit card parent purchases)
SELECT 
  'TOTAL EXPENSES IN DASHBOARD' as description,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM expenses 
WHERE (is_credit_card = false OR is_installment = true);

-- 2. Show expenses from current month that should be counted
SELECT 
  'CURRENT MONTH EXPENSES' as description,
  expense_date,
  description,
  amount,
  is_credit_card,
  is_installment,
  CASE 
    WHEN is_credit_card AND NOT is_installment THEN 'PARENT (NOT COUNTED)'
    WHEN is_credit_card AND is_installment THEN 'INSTALLMENT (COUNTED)'
    ELSE 'NORMAL (COUNTED)'
  END as status
FROM expenses 
WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY expense_date DESC, amount DESC;

-- 3. Calculate what the dashboard should show for current month
SELECT 
  'DASHBOARD CALCULATION' as description,
  SUM(CASE WHEN (is_credit_card = false OR is_installment = true) THEN amount ELSE 0 END) as total_expenses_should_show
FROM expenses 
WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';