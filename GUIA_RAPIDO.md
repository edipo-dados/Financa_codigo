# 🚀 Guia Rápido - Sistema de Controle Financeiro

## 📋 Checklist de Configuração

### 1. ✅ Instalação
```bash
npm install
```

### 2. ✅ Configurar Variáveis de Ambiente
Crie `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave
```

### 3. ✅ Executar Migration no Supabase
1. Acesse: https://supabase.com/dashboard
2. SQL Editor → New Query
3. Copie e execute: `EXECUTAR_NO_SUPABASE.sql`

### 4. ✅ Iniciar Aplicação
```bash
npm run dev
```

---

## 🎯 Funcionalidades Principais

### 💸 Despesas
- Criar despesas únicas ou recorrentes
- Marcar como pago/a pagar
- Categorizar com cores

### 💰 Receitas
- Criar receitas únicas ou recorrentes
- Marcar como recebido/a receber
- Categorizar com cores

### 💳 Cartão de Crédito
- Cadastrar cartões
- Compras parceladas (até 48x)
- Fatura mensal automática
- Aba dedicada: **💳 Compras no Cartão**

### 📊 Dashboard
- Receitas e despesas do mês
- Saldo mensal
- Pagas vs A Pagar
- Recebidas vs A Receber
- Fatura do cartão
- Gráficos e projeções

---

## 💡 Como Usar

### Criar Despesa Normal
1. **💸 Despesas** → **+ Nova Despesa**
2. Preencha valor, descrição, data
3. Selecione categoria
4. Salvar

### Criar Compra Parcelada
1. **💸 Despesas** → **+ Nova Despesa**
2. **Forma de Pagamento:** Cartão de Crédito
3. Selecione o cartão
4. Valor total: R$ 1.200
5. Parcelas: 6x
6. Salvar
7. ✅ 6 parcelas de R$ 200 criadas automaticamente!

### Marcar como Pago
1. Vá em **💸 Despesas** ou **💰 Receitas**
2. Clique no botão de status (verde/laranja)
3. ✅ Alterna entre Pago/A Pagar

### Excluir Compra Parcelada
**Opção 1:** Pela lista de despesas
- Encontre qualquer parcela
- Clique em **🗑️ Excluir Compra**
- Confirme
- ✅ Todas as parcelas removidas!

**Opção 2:** Aba dedicada (recomendado)
- Vá em **💳 Compras no Cartão**
- Clique em **Excluir**
- Confirme
- ✅ Compra + parcelas removidas!

---

## 🗂️ Estrutura de Abas

- **📊 Visão Geral** - Dashboard principal
- **💰 Receitas** - Gerenciar receitas
- **💸 Despesas** - Gerenciar despesas
- **📈 Investimentos** - Gerenciar investimentos
- **🔮 Lançamentos Futuros** - Projeções
- **💳 Compras no Cartão** - Gerenciar compras parceladas
- **⚙️ Configurações** - Cartões, categorias, etc.

---

## 🎨 Recursos Visuais

### Status de Pagamento
- **✓ Pago** (verde) - Despesa paga
- **⏳ A Pagar** (laranja) - Despesa pendente
- **✓ Recebido** (verde) - Receita recebida
- **⏳ A Receber** (laranja) - Receita pendente

### Badges
- **Recorrente** (azul) - Lançamento recorrente
- **Parcela X/Y** (roxo) - Parcela de cartão
- **💳 Nome do Cartão** (cor do cartão) - Cartão utilizado

---

## 🔧 Solução Rápida de Problemas

### Erro: "Could not find the 'is_paid' column"
**Solução:** Execute `EXECUTAR_NO_SUPABASE.sql` no Supabase

### Parcelas não aparecem
**Solução:** Execute a migration do banco de dados

### Não consigo excluir parcela
**Solução:** Use o botão "🗑️ Excluir Compra" ou vá em "💳 Compras no Cartão"

---

## 📚 Documentação Completa

- **README.md** - Visão geral completa
- **SETUP.md** - Configuração detalhada
- **ARCHITECTURE.md** - Arquitetura do sistema
- **CHANGELOG.md** - Histórico de mudanças

---

## 🎯 Próximos Passos

1. ✅ Execute a migration
2. ✅ Crie sua primeira despesa
3. ✅ Cadastre um cartão de crédito
4. ✅ Faça uma compra parcelada
5. ✅ Explore o dashboard

---

**Pronto para começar!** 🚀

Qualquer dúvida, consulte a documentação completa.
