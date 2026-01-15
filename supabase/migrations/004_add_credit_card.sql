-- Migration: Sistema de Cartão de Crédito
-- Adiciona suporte completo a cartões de crédito com parcelamento

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

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_credit_card_id ON expenses(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_credit_card ON expenses(is_credit_card);
CREATE INDEX IF NOT EXISTS idx_expenses_is_installment ON expenses(is_installment);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON expenses(parent_expense_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança para credit_cards
CREATE POLICY "Users can view their own credit cards"
  ON credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
  ON credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_credit_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_card_updated_at();

-- 8. Inserir cartões padrão para usuários existentes (opcional)
-- Descomente as linhas abaixo se quiser criar cartões padrão
/*
INSERT INTO credit_cards (user_id, name, closing_day, due_day, color)
SELECT 
  id as user_id,
  'Cartão Principal' as name,
  10 as closing_day,
  20 as due_day,
  '#007aff' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM credit_cards WHERE credit_cards.user_id = auth.users.id
);

INSERT INTO credit_cards (user_id, name, closing_day, due_day, color)
SELECT 
  id as user_id,
  'Cartão Secundário' as name,
  15 as closing_day,
  25 as due_day,
  '#34c759' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM credit_cards WHERE credit_cards.user_id = auth.users.id AND name = 'Cartão Secundário'
);
*/
