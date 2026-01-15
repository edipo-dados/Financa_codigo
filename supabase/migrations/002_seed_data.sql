-- Este arquivo contém dados de exemplo para desenvolvimento
-- Execute apenas após criar seu primeiro usuário
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário

-- Categorias de despesas padrão
-- INSERT INTO expense_categories (user_id, name, color) VALUES
--   ('USER_ID_AQUI', 'Alimentação', '#10B981'),
--   ('USER_ID_AQUI', 'Transporte', '#3B82F6'),
--   ('USER_ID_AQUI', 'Moradia', '#8B5CF6'),
--   ('USER_ID_AQUI', 'Saúde', '#EF4444'),
--   ('USER_ID_AQUI', 'Lazer', '#F59E0B'),
--   ('USER_ID_AQUI', 'Educação', '#06B6D4'),
--   ('USER_ID_AQUI', 'Vestuário', '#EC4899'),
--   ('USER_ID_AQUI', 'Outros', '#6B7280');

-- Tipos de investimento padrão
-- INSERT INTO investment_types (user_id, name) VALUES
--   ('USER_ID_AQUI', 'Renda Fixa'),
--   ('USER_ID_AQUI', 'Ações'),
--   ('USER_ID_AQUI', 'Fundos Imobiliários'),
--   ('USER_ID_AQUI', 'Criptomoedas'),
--   ('USER_ID_AQUI', 'Tesouro Direto'),
--   ('USER_ID_AQUI', 'CDB'),
--   ('USER_ID_AQUI', 'LCI/LCA'),
--   ('USER_ID_AQUI', 'Fundos de Investimento');

-- Função auxiliar para criar categorias padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO expense_categories (user_id, name, color) VALUES
    (user_uuid, 'Alimentação', '#10B981'),
    (user_uuid, 'Transporte', '#3B82F6'),
    (user_uuid, 'Moradia', '#8B5CF6'),
    (user_uuid, 'Saúde', '#EF4444'),
    (user_uuid, 'Lazer', '#F59E0B'),
    (user_uuid, 'Educação', '#06B6D4'),
    (user_uuid, 'Vestuário', '#EC4899'),
    (user_uuid, 'Outros', '#6B7280');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para criar tipos de investimento padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_investment_types(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO investment_types (user_id, name) VALUES
    (user_uuid, 'Renda Fixa'),
    (user_uuid, 'Ações'),
    (user_uuid, 'Fundos Imobiliários'),
    (user_uuid, 'Criptomoedas'),
    (user_uuid, 'Tesouro Direto'),
    (user_uuid, 'CDB'),
    (user_uuid, 'LCI/LCA'),
    (user_uuid, 'Fundos de Investimento');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger para criar categorias e tipos padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Criar categorias padrão
  PERFORM create_default_categories(new.id);
  
  -- Criar tipos de investimento padrão
  PERFORM create_default_investment_types(new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
