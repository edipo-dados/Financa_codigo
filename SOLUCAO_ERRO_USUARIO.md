# 🚨 Solução: "Database error saving new user"

## Problema
Erro ao criar novos usuários na aplicação em produção no Vercel.

## Causa
A tabela `profiles` não tem uma política RLS (Row Level Security) para permitir INSERT de novos perfis.

## ✅ Solução Rápida

### Opção 1: Execute o Script Consolidado Atualizado
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `EXECUTAR_NO_SUPABASE.sql` (já atualizado com a correção)

### Opção 2: Execute Apenas a Correção
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `CORRIGIR_PROFILES_RLS.sql`

### Opção 3: Comando Manual
Execute este comando no SQL Editor do Supabase:

```sql
-- Adicionar política de INSERT para profiles
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verificar função de criação de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🔍 Verificação

Após executar a correção, verifique se funcionou:

```sql
-- Verificar políticas da tabela profiles
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Deve mostrar:
-- Users can view own profile    | SELECT
-- Users can insert own profile  | INSERT  ← Esta deve existir agora
-- Users can update own profile  | UPDATE
```

## 🧪 Teste

1. Tente criar um novo usuário na aplicação
2. O erro "Database error saving new user" deve desaparecer
3. O usuário deve conseguir se registrar normalmente

## 📋 Checklist de Verificação

- [ ] Script executado sem erros
- [ ] Política "Users can insert own profile" criada
- [ ] Função `handle_new_user` existe
- [ ] Trigger `on_auth_user_created` existe
- [ ] Teste de criação de usuário funcionando

## 🎯 Resultado Esperado

Após a correção:
- ✅ Novos usuários podem se registrar
- ✅ Perfis são criados automaticamente
- ✅ Aplicação funciona normalmente em produção

## 🔧 Explicação Técnica

### O que acontecia:
1. Usuário se registrava no Supabase Auth ✅
2. Trigger tentava criar perfil na tabela `profiles` ❌
3. RLS bloqueava INSERT porque não havia política ❌
4. Erro: "Database error saving new user" ❌

### O que acontece agora:
1. Usuário se registra no Supabase Auth ✅
2. Trigger cria perfil na tabela `profiles` ✅
3. RLS permite INSERT com nova política ✅
4. Usuário criado com sucesso ✅

## 🚀 Próximos Passos

1. Execute a correção
2. Teste a criação de usuários
3. Continue usando a aplicação normalmente
4. A IA Financeira estará disponível para novos usuários!

---

**Problema resolvido!** 🎉