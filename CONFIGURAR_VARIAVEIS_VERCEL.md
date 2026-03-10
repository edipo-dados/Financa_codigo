# 🔧 Configurar Variáveis de Ambiente no Vercel

## ❌ Erro Atual

```
Error: supabaseKey is required.
```

Este erro ocorre porque a variável `SUPABASE_SERVICE_ROLE_KEY` não está configurada no Vercel.

## ✅ Solução: Adicionar Variáveis no Vercel

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto
3. Vá em **Settings** (Configurações)
4. Clique em **Environment Variables** (Variáveis de Ambiente)

### Passo 2: Adicionar as Variáveis

Adicione as seguintes variáveis de ambiente:

#### 1. NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://vpjaheorjvviysznxtpv.supabase.co`
- **Environment:** Production, Preview, Development (marque todos)

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** (use a mesma que está no seu .env.local - a chave anon do Supabase)
- **Environment:** Production, Preview, Development (marque todos)

#### 3. SUPABASE_SERVICE_ROLE_KEY ⚠️ IMPORTANTE
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwamFoZW9yanZ2aXlzem54dHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMzIwNywiZXhwIjoyMDg0MDA5MjA3fQ.giDx15FFGuiL96JN1MkoSUbJwoNnKbl1knmQg9M5n9Q`
- **Environment:** Production, Preview, Development (marque todos)

### Passo 3: Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments** (Implantações)
2. Clique nos três pontos (...) do último deploy
3. Clique em **Redeploy**
4. Marque a opção **Use existing Build Cache** (opcional)
5. Clique em **Redeploy**

## 🔒 Segurança

⚠️ **ATENÇÃO:** A `SUPABASE_SERVICE_ROLE_KEY` tem acesso total ao banco de dados!

- ✅ Use APENAS no backend (rotas API)
- ❌ NUNCA exponha no frontend
- ❌ NUNCA commite no Git (já está no .gitignore)
- ✅ Use apenas em variáveis de ambiente

## 📝 Verificação

Após o redeploy, verifique se as APIs estão funcionando:

```bash
# Testar API de despesas
curl "https://seu-dominio.vercel.app/api/expenses?user_id=seu-user-id"

# Testar API de receitas
curl "https://seu-dominio.vercel.app/api/incomes?user_id=seu-user-id"

# Testar API de resumo
curl "https://seu-dominio.vercel.app/api/summary?user_id=seu-user-id"
```

## 🎯 Próximos Passos

Depois que as variáveis estiverem configuradas e o redeploy concluído:

1. As APIs estarão funcionando
2. Você poderá consumir as APIs na sua aplicação de IA
3. Consulte a `API_DOCUMENTATION.md` para exemplos de uso

## 📞 Suporte

Se o erro persistir após configurar as variáveis:

1. Verifique se todas as 3 variáveis foram adicionadas
2. Verifique se marcou todos os ambientes (Production, Preview, Development)
3. Certifique-se de fazer o redeploy após adicionar as variáveis
4. Limpe o cache do Vercel se necessário
