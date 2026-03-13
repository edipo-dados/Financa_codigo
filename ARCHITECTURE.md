# 🏗️ Arquitetura do Sistema - EAS Controle Financeiro

## 📋 Visão Geral

Sistema de controle financeiro pessoal desenvolvido com Next.js 15, React 19, TypeScript e Supabase.

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, TypeScript
- **Estilização:** Tailwind CSS
- **Gráficos:** Recharts
- **Gerenciamento de Estado:** React Hooks + Context API
- **Drag & Drop:** @hello-pangea/dnd

### Backend
- **Database:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **APIs:** Next.js API Routes
- **Storage:** Supabase Storage

### Deploy
- **Hospedagem:** Vercel
- **CI/CD:** GitHub Actions (automático via Vercel)

## 📁 Estrutura de Diretórios

```
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── api/               # API Routes
│   │   │   ├── categories/    # Categorias (despesas/receitas)
│   │   │   ├── credit-cards/  # Cartões de crédito
│   │   │   ├── credit-card-purchases/  # Compras de cartão
│   │   │   ├── expenses/      # Despesas
│   │   │   ├── incomes/       # Receitas
│   │   │   └── summary/       # Resumo financeiro
│   │   ├── dashboard/         # Dashboard principal
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/            # Componentes React
│   │   ├── widgets/          # Widgets do dashboard
│   │   ├── *Form.tsx         # Formulários
│   │   ├── *List.tsx         # Listas
│   │   ├── *Modal.tsx        # Modais
│   │   └── *Manager.tsx      # Gerenciadores
│   │
│   ├── hooks/                # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useExpenses.ts
│   │   ├── useIncomes.ts
│   │   └── useInvestments.ts
│   │
│   ├── lib/                  # Bibliotecas e utilitários
│   │   ├── supabase.ts      # Cliente Supabase
│   │   ├── creditCard.ts    # Lógica de cartões
│   │   ├── pdfGenerator.ts  # Geração de PDFs
│   │   └── utils.ts         # Funções utilitárias
│   │
│   └── types/               # TypeScript types
│       └── index.ts
│
├── supabase/
│   └── migrations/          # Migrações do banco
│
└── public/                  # Arquivos estáticos
```

## 🗄️ Modelo de Dados

### Tabelas Principais

**users** (Supabase Auth)
- Gerenciado pelo Supabase Auth

**expenses** (Despesas)
- Despesas comuns
- Despesas recorrentes
- Parcelas de cartão de crédito

**incomes** (Receitas)
- Receitas comuns
- Receitas recorrentes

**investments** (Investimentos)
- Investimentos únicos
- Investimentos recorrentes

**credit_cards** (Cartões de Crédito)
- Informações do cartão
- Dia de fechamento e vencimento

**expense_categories** (Categorias de Despesas)

**income_categories** (Categorias de Receitas)

**investment_types** (Tipos de Investimento)

**family_members** (Membros da Família)

### Relacionamentos

```
users (1) ─── (N) expenses
users (1) ─── (N) incomes
users (1) ─── (N) investments
users (1) ─── (N) credit_cards
users (1) ─── (N) expense_categories
users (1) ─── (N) income_categories
users (1) ─── (N) family_members

credit_cards (1) ─── (N) expenses (compras de cartão)
expense_categories (1) ─── (N) expenses
income_categories (1) ─── (N) incomes
family_members (1) ─── (N) expenses
family_members (1) ─── (N) incomes
```

## 🔄 Fluxo de Dados

### Despesas Comuns
1. Usuário cria despesa via `ExpenseForm`
2. Dados enviados para `/api/expenses` (POST)
3. Salvo no Supabase
4. Hook `useExpenses` atualiza automaticamente
5. Lista atualizada em `ExpensesList`

### Compras de Cartão (Parceladas)
1. Usuário cria compra via `CreditCardPurchaseForm`
2. Dados enviados para `/api/credit-card-purchases` (POST)
3. API cria:
   - 1 despesa "parent" (compra principal)
   - N despesas "installment" (parcelas)
4. Cálculo automático de datas baseado no fechamento do cartão
5. Exibição em `CreditCardPurchasesList`

### Receitas/Despesas Recorrentes
1. Usuário marca como recorrente no formulário
2. Salvo com configuração de recorrência
3. Sistema gera "receitas/despesas virtuais" em memória
4. Ao editar uma virtual, cria uma real com `parent_id`
5. Sistema não gera mais virtual para aquela data

## 🎨 Componentes Principais

### Dashboard
- **DraggableDashboard:** Dashboard configurável com drag & drop
- **Widgets:** Componentes reutilizáveis de visualização

### Listas
- **ExpensesList:** Lista de despesas com filtros
- **IncomesList:** Lista de receitas com filtros
- **CreditCardPurchasesList:** Lista de compras de cartão

### Formulários
- **ExpenseForm:** Criação de despesas
- **IncomeForm:** Criação de receitas
- **CreditCardPurchaseForm:** Criação de compras parceladas

### Modais
- **EditExpenseModal:** Edição de despesas
- **EditIncomeModal:** Edição de receitas
- **EditCreditCardPurchaseModal:** Edição de compras

## 🔐 Autenticação

- Supabase Auth com email/senha
- Modo demo disponível (sem autenticação)
- Row Level Security (RLS) no Supabase
- Service Role Key para APIs

## 📱 Responsividade

### Desktop
- Navegação completa (8 tabs)
- Dashboard com widgets arrastáveis
- Visualizações detalhadas

### Mobile
- Navegação simplificada (4 tabs):
  - Dashboard
  - Despesas
  - Receitas
  - Cartões
- Bottom navigation
- Interface otimizada para toque

## 🚀 APIs REST

Todas as APIs usam `SUPABASE_SERVICE_ROLE_KEY` para autenticação.

### Endpoints Disponíveis

- `GET/POST /api/expenses` - Despesas
- `GET/POST /api/incomes` - Receitas
- `GET/POST /api/credit-cards` - Cartões
- `GET/POST /api/credit-card-purchases` - Compras de cartão
- `GET/POST /api/categories` - Categorias
- `GET /api/summary` - Resumo financeiro

Ver `API_DOCUMENTATION.md` para detalhes completos.

## 🔧 Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### Deploy

1. Push para `main` branch
2. Vercel faz deploy automático
3. Variáveis configuradas no Vercel Dashboard

## 📊 Funcionalidades Principais

### Gestão Financeira
- ✅ Despesas (comuns e recorrentes)
- ✅ Receitas (comuns e recorrentes)
- ✅ Investimentos (únicos e recorrentes)
- ✅ Cartões de crédito (compras parceladas)
- ✅ Categorização
- ✅ Membros da família

### Visualizações
- ✅ Dashboard configurável
- ✅ Gráficos interativos
- ✅ Resumo financeiro
- ✅ Projeções futuras
- ✅ Relatórios em PDF

### Recursos Avançados
- ✅ Recorrências automáticas
- ✅ Cálculo de parcelas de cartão
- ✅ Filtros por período e membro
- ✅ Modo escuro
- ✅ Responsivo (mobile/desktop)

## 🐛 Debugging

### Logs
- Console do navegador para frontend
- Vercel Logs para APIs
- Supabase Dashboard para queries

### Problemas Comuns

**Receitas/Despesas duplicadas:**
- Verificar `parent_income_id`/`parent_expense_id`
- Sistema filtra virtuais quando existe real

**Parcelas de cartão com data errada:**
- Verificar `closing_day` e `due_day` do cartão
- Função `calculateFirstInvoiceDate` em `creditCard.ts`

## 📝 Convenções de Código

- TypeScript strict mode
- Componentes funcionais com hooks
- Tailwind para estilização
- Nomenclatura em inglês para código
- Comentários em português quando necessário

## 🔄 Atualizações Futuras

- [ ] Notificações push
- [ ] Exportação de dados
- [ ] Integração com bancos
- [ ] App mobile nativo
- [ ] Múltiplas moedas
