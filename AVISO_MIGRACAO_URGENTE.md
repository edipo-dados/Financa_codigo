# ⚠️ AVISO: Migração Necessária para Investimentos

## 🚨 AÇÃO URGENTE REQUERIDA

A funcionalidade de **recorrência em investimentos** foi reativada, mas **PRECISA da migração do banco** para funcionar corretamente.

### ❌ O que acontece SEM a migração:
- Erro ao tentar salvar investimento com recorrência
- Mensagem: "Could not find the 'is_recurring' column of 'investments'"
- Investimentos simples (sem recorrência) funcionam normalmente

### ✅ O que funciona APÓS a migração:
- ✅ Aportes mensais automáticos
- ✅ Investimentos recorrentes (semanal, mensal, anual)
- ✅ Configuração de término (nunca, após X aportes, até data)
- ✅ Preview das próximas ocorrências
- ✅ Edição de recorrências existentes

## 🔧 COMO EXECUTAR A MIGRAÇÃO:

### 1. Acesse o Supabase Dashboard
- URL: https://supabase.com/dashboard
- Faça login e selecione seu projeto

### 2. Vá para SQL Editor
- Menu lateral → "SQL Editor"
- Clique em "New query"

### 3. Execute esta migração:
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

### 4. Clique em "Run"
- Se executar sem erros, a migração foi bem-sucedida
- As colunas aparecerão na tabela `investments`

## 📋 Teste Após a Migração:

1. **Investimento Simples**: Adicione um investimento sem recorrência
2. **Investimento Recorrente**: Marque o checkbox "💰 Investimento Recorrente"
3. **Configure**: Frequência mensal, 12 aportes
4. **Verifique**: Preview deve mostrar as próximas ocorrências
5. **Salve**: Deve salvar sem erros

## 🎯 Status Atual:

### ✅ Implementado e Funcionando:
- [x] Interface de recorrência completa
- [x] Validação de configurações
- [x] Preview de ocorrências
- [x] Integração com sistema existente
- [x] Build compilando perfeitamente

### ⏳ Aguardando Migração:
- [ ] Colunas de recorrência no banco
- [ ] Salvamento de investimentos recorrentes
- [ ] Geração automática de aportes futuros

## 🚀 Resultado Final:

Após executar a migração, você terá o **sistema completo de investimentos recorrentes**, igual ao que já existe para receitas e despesas, permitindo:

- 💰 Aportes mensais automáticos
- 📅 Planejamento de investimentos periódicos  
- 📊 Projeções financeiras mais precisas
- ⚙️ Edição de recorrências existentes

---

**IMPORTANTE**: Execute a migração o quanto antes para ter acesso completo às funcionalidades de investimento!