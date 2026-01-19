-- Script para criar usuário de teste no Supabase
-- Execute este script no SQL Editor do seu painel Supabase

-- Método mais simples: usar a função de signup do Supabase
-- Execute este comando no SQL Editor:

SELECT auth.signup(
  'teste@teste.com',
  '123456',
  '{"full_name": "Usuário Teste"}'::jsonb
);

-- Verificar se funcionou:
SELECT email, created_at FROM auth.users WHERE email = 'teste@teste.com';