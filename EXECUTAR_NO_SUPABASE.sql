-- ============================================
-- SCRIPT CONSOLIDADO PARA EXECUTAR NO SUPABASE
-- ============================================
-- Copie TODO este arquivo e execute no SQL Editor do Supabase
-- Este script adiciona todos os campos necessários para o sistema de cartão de crédito

-- ============================================
-- PARTE 1: Criar tabela de cartões de crédito
-- ============================================

-- 1. Criar tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  credit_limit DECIMAL(10, 2),
  color TEXT NOT NULL DEFAULT '#007aff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 2: Adicionar campos em expenses
-- ============================================

-- 2. Adicionar campos de cartão de crédito na tabela expenses
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS is_credit_card BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS installments INTEGER,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- ============================================
-- PARTE 3: Adicionar campo is_paid em incomes
-- ============================================

-- 3. Adicionar campo is_paid na tabela incomes
ALTER TABLE incomes 
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- ============================================
-- PARTE 4: Criar índices para performance
-- ============================================

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_credit_card_id ON expenses(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_credit_card ON expenses(is_credit_card);
CREATE INDEX IF NOT EXISTS idx_expenses_is_installment ON expenses(is_installment);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON expenses(parent_expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_paid ON expenses(is_paid);
CREATE INDEX IF NOT EXISTS idx_incomes_is_paid ON incomes(is_paid);

-- ============================================
-- PARTE 5: Habilitar RLS (Row Level Security)
-- ============================================

-- 5. Habilitar RLS para credit_cards
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 6: Criar políticas de segurança
-- ============================================

-- 6. Criar políticas de segurança para credit_cards
DROP POLICY IF EXISTS "Users can view their own credit cards" ON credit_cards;
CREATE POLICY "Users can view their own credit cards"
  ON credit_cards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credit cards" ON credit_cards;
CREATE POLICY "Users can insert their own credit cards"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credit cards" ON credit_cards;
CREATE POLICY "Users can update their own credit cards"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own credit cards" ON credit_cards;
CREATE POLICY "Users can delete their own credit cards"
  ON credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PARTE 7: Criar função para atualizar updated_at
-- ============================================

-- 7. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_credit_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 8: Criar trigger
-- ============================================

-- 8. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON credit_cards;
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_card_updated_at();

-- ============================================
-- PARTE 9: Marcar lançamentos passados como pagos
-- ============================================

-- 9. Atualizar despesas e receitas existentes como pagas por padrão
-- (assumindo que lançamentos passados já foram pagos)
UPDATE expenses 
SET is_paid = TRUE 
WHERE expense_date < CURRENT_DATE AND is_paid = FALSE;

UPDATE incomes 
SET is_paid = TRUE 
WHERE income_date < CURRENT_DATE AND is_paid = FALSE;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar se tudo foi criado corretamente:
SELECT 'credit_cards table' as check_item, COUNT(*) as count FROM credit_cards;
SELECT 'expenses with is_paid' as check_item, COUNT(*) as count FROM expenses WHERE is_paid IS NOT NULL;
SELECT 'incomes with is_paid' as check_item, COUNT(*) as count FROM incomes WHERE is_paid IS NOT NULL;

-- Se não houver erros, o script foi executado com sucesso! ✅
