-- Adicionar colunas de recorrência para investimentos
ALTER TABLE investments ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE investments ADD COLUMN recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly'));
ALTER TABLE investments ADD COLUMN recurrence_start_date DATE;
ALTER TABLE investments ADD COLUMN recurrence_end_date DATE;
ALTER TABLE investments ADD COLUMN recurrence_count INTEGER;
ALTER TABLE investments ADD COLUMN recurrence_end_type TEXT CHECK (recurrence_end_type IN ('never', 'after_occurrences', 'on_date'));
ALTER TABLE investments ADD COLUMN parent_investment_id UUID REFERENCES investments(id) ON DELETE CASCADE;

-- Criar índices para as novas colunas
CREATE INDEX idx_investments_recurring ON investments(user_id, is_recurring);
CREATE INDEX idx_investments_parent ON investments(parent_investment_id);