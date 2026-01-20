# 🔧 Executar Migração de Investimentos

## ⚠️ AÇÃO NECESSÁRIA: Executar Migração no Supabase

Para que os investimentos funcionem completamente com recorrências, você precisa executar a migração no banco de dados.

### 📋 Passos para Executar a Migração:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto

2. **Navegue até SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a Migração**
   - Copie e cole o conteúdo do arquivo `supabase/migrations/007_add_investment_recurrence.sql`
   - Clique em "Run" para executar

### 📄 Conteúdo da Migração:

```sql
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
```

### ✅ Após Executar a Migração:

1. **Verifique se foi executada com sucesso**
   - Não deve haver erros no SQL Editor
   - As colunas devem aparecer na tabela `investments`

2. **Reative a funcionalidade de recorrência**
   - A funcionalidade está temporariamente desabilitada no código
   - Após a migração, posso reativar o código de recorrência

3. **Teste os investimentos**
   - Tente adicionar um investimento simples primeiro
   - Depois teste com recorrência

## 🔄 Status Atual:

### ✅ Implementado:
- ✅ Filtros avançados na lista de investimentos (membro, tipo, data, busca)
- ✅ Exibição de membros da família nos cartões de investimento
- ✅ Migração criada para suporte a recorrências
- ✅ Formulário preparado para recorrências (temporariamente desabilitado)

### ⏸️ Aguardando Migração:
- ⏸️ Funcionalidade de recorrência em investimentos
- ⏸️ Aportes mensais/periódicos
- ⏸️ Edição de recorrências de investimentos

### 🎯 Próximos Passos:
1. Executar migração no Supabase
2. Reativar código de recorrência
3. Testar funcionalidade completa

## 📞 Suporte:

Se encontrar algum erro durante a migração, me informe e posso ajudar a resolver.