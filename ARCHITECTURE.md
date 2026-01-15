# Arquitetura do Sistema

## Visão Geral

Aplicação full stack de controle financeiro pessoal construída com Next.js 14, React, TypeScript e Supabase.

## Stack Tecnológica

### Frontend
- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Recharts**: Visualização de dados

### Backend
- **Next.js API Routes**: Endpoints serverless
- **Supabase**: Backend-as-a-Service
  - PostgreSQL: Banco de dados
  - Auth: Autenticação
  - Row Level Security: Segurança de dados

### Deploy
- **Vercel**: Hospedagem e CI/CD
- **Supabase Cloud**: Banco de dados gerenciado

## Arquitetura de Camadas

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Components, Pages, UI)                │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│  (Hooks, Utils, State Management)       │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│  (Supabase Client, API Calls)           │
├─────────────────────────────────────────┤
│           Database Layer                │
│  (PostgreSQL + RLS)                     │
└─────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Página de login
│   ├── layout.tsx         # Layout raiz
│   ├── globals.css        # Estilos globais
│   └── dashboard/         # Área autenticada
│       └── page.tsx       # Dashboard principal
│
├── components/            # Componentes React
│   ├── AuthForm.tsx      # Formulário de autenticação
│   ├── Navigation.tsx    # Barra de navegação
│   ├── DashboardStats.tsx # Estatísticas e gráficos
│   ├── ExpensesList.tsx  # Lista de despesas
│   ├── ExpenseForm.tsx   # Formulário de despesas
│   ├── InvestmentsList.tsx # Lista de investimentos
│   └── InvestmentForm.tsx  # Formulário de investimentos
│
├── hooks/                 # Custom React Hooks
│   ├── useAuth.ts        # Hook de autenticação
│   ├── useExpenses.ts    # Hook de despesas
│   └── useInvestments.ts # Hook de investimentos
│
├── lib/                   # Utilitários e configurações
│   ├── supabase.ts       # Cliente Supabase
│   └── utils.ts          # Funções auxiliares
│
└── types/                 # Definições TypeScript
    ├── database.ts       # Tipos do banco de dados
    └── index.ts          # Tipos da aplicação
```

## Modelo de Dados

### Relacionamentos

```
profiles (1) ──< (N) expense_categories
profiles (1) ──< (N) expenses
profiles (1) ──< (N) investment_types
profiles (1) ──< (N) investments
investments (1) ──< (N) investment_transactions

expenses (1) ──< (N) expenses (recorrentes)
expense_categories (1) ──< (N) expenses
investment_types (1) ──< (N) investments
```

### Entidades Principais

**Profile**
- Criado automaticamente no signup
- Vinculado ao auth.users do Supabase

**Expense**
- Pode ser avulsa ou recorrente
- Recorrentes têm parent_expense_id
- Categorizada opcionalmente

**Investment**
- Rastreia valor inicial e atual
- Calcula rentabilidade automaticamente
- Histórico via transactions

## Fluxo de Dados

### Autenticação
```
1. Usuário → AuthForm
2. AuthForm → useAuth hook
3. useAuth → Supabase Auth
4. Supabase → Trigger → Create Profile
5. Auth State → Redirect to Dashboard
```

### CRUD de Despesas
```
1. User Action → ExpenseForm/ExpensesList
2. Component → useExpenses hook
3. useExpenses → Supabase Client
4. Supabase → RLS Check → Database
5. Response → Update Local State
6. Re-render Components
```

### Dashboard Stats
```
1. Dashboard → Load expenses & investments
2. DashboardStats → useMemo calculations
3. Calculate totals, returns, categories
4. Render charts with Recharts
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS que garantem:
- Usuários só veem seus próprios dados
- Operações CRUD restritas ao owner
- Validação no nível do banco de dados

Exemplo de política:
```sql
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);
```

### Autenticação

- JWT tokens gerenciados pelo Supabase
- Sessões persistidas no localStorage
- Refresh automático de tokens
- Protected routes via useAuth hook

## Performance

### Otimizações Implementadas

1. **Índices de Banco de Dados**
   - user_id em todas as tabelas
   - expense_date para queries temporais
   - Foreign keys indexadas

2. **React Optimizations**
   - useMemo para cálculos pesados
   - Lazy loading de componentes
   - Debounce em inputs (futuro)

3. **Caching**
   - Supabase client cache
   - React Query (futuro)

## Escalabilidade

### Horizontal
- Next.js serverless functions escalam automaticamente
- Supabase gerencia conexões de banco

### Vertical
- PostgreSQL suporta milhões de registros
- Índices otimizam queries
- Particionamento de tabelas (futuro)

## Padrões de Código

### Componentes
- Functional components com hooks
- Props tipadas com TypeScript
- Separação de lógica (hooks) e apresentação

### Hooks Customizados
- Encapsulam lógica de negócio
- Reutilizáveis entre componentes
- Gerenciam estado e side effects

### Tipagem
- Strict TypeScript
- Tipos gerados do schema do banco
- Interfaces para entidades de domínio

## Testes (Futuro)

### Estratégia Recomendada
- Unit tests: Hooks e utils (Jest)
- Integration tests: API routes (Supertest)
- E2E tests: Fluxos críticos (Playwright)

## Monitoramento (Futuro)

### Métricas Sugeridas
- Vercel Analytics: Performance
- Supabase Dashboard: Database metrics
- Sentry: Error tracking
- PostHog: User analytics

## CI/CD

### Pipeline Atual
```
Git Push → GitHub
         ↓
    Vercel Deploy
         ↓
    Build & Test
         ↓
    Production
```

### Melhorias Futuras
- Testes automatizados no CI
- Preview deployments
- Staging environment
- Database migrations automation
