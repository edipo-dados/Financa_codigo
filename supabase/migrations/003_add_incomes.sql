-- Create income_categories table
CREATE TABLE income_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#34c759',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create incomes table
CREATE TABLE incomes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES income_categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  income_date DATE NOT NULL,
  source TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_start_date DATE,
  recurrence_end_date DATE,
  recurrence_count INTEGER,
  recurrence_end_type TEXT CHECK (recurrence_end_type IN ('never', 'after_occurrences', 'on_date')),
  parent_income_id UUID REFERENCES incomes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_incomes_date ON incomes(income_date);
CREATE INDEX idx_incomes_category ON incomes(category_id);

-- Enable Row Level Security
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for income_categories
CREATE POLICY "Users can view own income categories" ON income_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income categories" ON income_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income categories" ON income_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income categories" ON income_categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for incomes
CREATE POLICY "Users can view own incomes" ON incomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes" ON incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes" ON incomes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes" ON incomes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create default income categories for new users
CREATE OR REPLACE FUNCTION create_default_income_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO income_categories (user_id, name, color) VALUES
    (user_uuid, 'Salário', '#34c759'),
    (user_uuid, 'Freelance', '#007aff'),
    (user_uuid, 'Investimentos', '#af52de'),
    (user_uuid, 'Vendas', '#ff9500'),
    (user_uuid, 'Bônus', '#ffcc00'),
    (user_uuid, 'Outros', '#8e8e93');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to create income categories for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Criar categorias de despesas padrão
  PERFORM create_default_categories(new.id);
  
  -- Criar tipos de investimento padrão
  PERFORM create_default_investment_types(new.id);
  
  -- Criar categorias de receitas padrão
  PERFORM create_default_income_categories(new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE income_categories IS 'Categorias de receitas dos usuários';
COMMENT ON TABLE incomes IS 'Receitas/Entradas dos usuários';
COMMENT ON COLUMN incomes.source IS 'Fonte da receita (ex: empresa, cliente, etc)';
COMMENT ON COLUMN incomes.is_recurring IS 'Indica se é uma receita recorrente';
COMMENT ON COLUMN incomes.recurrence_end_type IS 'Tipo de término: never (sem fim), after_occurrences (após X vezes), on_date (até data específica)';
COMMENT ON COLUMN incomes.recurrence_count IS 'Número de ocorrências quando recurrence_end_type = after_occurrences';
