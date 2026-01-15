-- ============================================
-- CORREÇÃO: Política RLS para criação de perfis
-- ============================================
-- Execute este script no SQL Editor do Supabase para corrigir o erro de criação de usuários

-- 1. Adicionar política de INSERT para profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Verificar se a função handle_new_user existe e está correta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar se tudo está funcionando
SELECT 'Correção aplicada com sucesso!' as status;

-- ============================================
-- VERIFICAÇÃO: Execute estas queries para testar
-- ============================================

-- Verificar políticas da tabela profiles
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se o trigger existe
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar se a função existe
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';