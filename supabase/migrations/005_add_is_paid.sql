-- Migration: Adicionar campo is_paid para controle de pagamento
-- Permite marcar despesas e receitas como pagas ou não pagas

-- 1. Adicionar campo is_paid na tabela incomes (se não existir)
ALTER TABLE incomes 
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_expenses_is_paid ON expenses(is_paid);
CREATE INDEX IF NOT EXISTS idx_incomes_is_paid ON incomes(is_paid);

-- 3. Atualizar despesas e receitas existentes como pagas por padrão
-- (assumindo que lançamentos passados já foram pagos)
UPDATE expenses 
SET is_paid = TRUE 
WHERE expense_date < CURRENT_DATE AND is_paid = FALSE;

UPDATE incomes 
SET is_paid = TRUE 
WHERE income_date < CURRENT_DATE AND is_paid = FALSE;
