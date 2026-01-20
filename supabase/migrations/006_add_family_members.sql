-- Criar tabela de membros da família
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  relationship VARCHAR(50), -- Ex: Cônjuge, Filho(a), Pai, Mãe, etc.
  color VARCHAR(7) DEFAULT '#3b82f6', -- Cor para identificação visual
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_active ON family_members(user_id, is_active);

-- Adicionar coluna member_id nas tabelas existentes
ALTER TABLE expenses ADD COLUMN member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;
ALTER TABLE incomes ADD COLUMN member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;
ALTER TABLE investments ADD COLUMN member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;

-- Criar índices para as novas colunas
CREATE INDEX idx_expenses_member_id ON expenses(member_id);
CREATE INDEX idx_incomes_member_id ON incomes(member_id);
CREATE INDEX idx_investments_member_id ON investments(member_id);

-- Habilitar RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own family members" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON family_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON family_members
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_family_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_family_members_updated_at();