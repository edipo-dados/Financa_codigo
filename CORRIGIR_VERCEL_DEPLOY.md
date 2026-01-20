# 🚀 Corrigir Problemas de Deploy no Vercel

## ❌ Erro Identificado:
```
Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase_url", which does not exist.
```

## 🔧 Soluções:

### Opção 1: Configurar Variáveis de Ambiente no Vercel (RECOMENDADO)

1. **Acesse o Dashboard do Vercel**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto

2. **Configure as Variáveis de Ambiente**
   - Vá em "Settings" → "Environment Variables"
   - Adicione as seguintes variáveis:

   ```
   Nome: NEXT_PUBLIC_SUPABASE_URL
   Valor: https://vpjaheorjvviysznxtpv.supabase.co
   Ambiente: Production, Preview, Development
   ```

   ```
   Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwamFoZW9yanZ2aXlzem54dHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMzIwNywiZXhwIjoyMDg0MDA5MjA3fQ.giDx15FFGuiL96JN1MkoSUbJwoNnKbl1knmQg9M5n9Q
   Ambiente: Production, Preview, Development
   ```

3. **Redesploy o Projeto**
   - Vá em "Deployments"
   - Clique nos três pontos do último deploy
   - Selecione "Redeploy"

### Opção 2: Verificar Configuração de Secrets

Se você estava usando secrets do Vercel:

1. **Vá em Settings → Environment Variables**
2. **Verifique se existem secrets com nomes:**
   - `supabase_url`
   - `supabase_anon_key`
3. **Se não existirem, crie-os ou use a Opção 1**

## 🔍 Verificações Adicionais:

### 1. Verificar se o Build Está Passando
```bash
npm run build
```

### 2. Verificar Commits Pendentes
```bash
git status
git log --oneline -5
```

### 3. Forçar Novo Deploy
- Faça uma pequena alteração (como adicionar um espaço em um arquivo)
- Commit e push
- Ou use "Redeploy" no dashboard do Vercel

## 📋 Checklist de Deploy:

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build local funcionando (`npm run build`)
- [ ] Commits enviados para o GitHub (`git push`)
- [ ] Deploy executado no Vercel
- [ ] Site funcionando em produção

## 🎯 Status Atual dos Deploys:

### ✅ Últimas Alterações Enviadas:
- Correção do sistema de investimentos
- Adição de filtros avançados
- Exibição de membros da família
- Migração preparada para recorrências

### 🔄 Próximo Deploy Incluirá:
- Funcionalidade de recorrência (após migração)
- Melhorias na interface
- Correções de bugs

## 📞 Se o Problema Persistir:

1. **Verifique os logs do Vercel**
   - Vá em "Functions" → "View Function Logs"
   - Procure por erros específicos

2. **Teste local primeiro**
   - `npm run dev`
   - Verifique se tudo funciona localmente

3. **Limpe o cache do Vercel**
   - No dashboard, vá em Settings → General
   - Role até "Danger Zone"
   - Clique em "Clear Build Cache"