# 📖 Documentação Técnica - EAS Controle Financeiro

## 🎯 Índice

1. [Arquitetura](#arquitetura)
2. [Banco de Dados](#banco-de-dados)
3. [APIs](#apis)
4. [Componentes](#componentes)
5. [Hooks](#hooks)
6. [Utilitários](#utilitários)
7. [Deploy](#deploy)

## 🏗️ Arquitetura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalhes completos da arquitetura.

### Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Vercel (Deploy)

## 🗄️ Banco de Dados

### Tabelas Principais

#### expenses
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- amount: DECIMAL(10,2)
- description: TEXT
- expense_date: DATE
- category_id: UUID (FK -> expense_categories)
- member_id: UUID (FK -> family_members)
- payment_method: TEXT
- is_paid: BOOLEAN
- is_recurring: BOOLEAN
- is_credit_card: BOOLEAN
- is_installment: BOOLEAN
- credit_card_id: UUID (FK -> credit_cards)
- parent_expense_id: UUID (FK -> expenses)
- installment_number: INTEGER
- installments: INTEGER
- total_amount: DECIMAL(10,2)
- recurrence_*: campos de recorrência
```

#### incomes
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- amount: DECIMAL(10,2)
- description: TEXT
- income_date: DATE
- category_id: UUID (FK -> income_categories)
- member_id: UUID (FK -> family_members)
- source: TEXT
- is_paid: BOOLEAN
- is_recurring: BOOLEAN
- parent_income_id: UUID (FK -> incomes)
- recurrence_*: campos de recorrência
```

#### credit_cards
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- name: TEXT
- closing_day: INTEGER (1-31)
- due_day: INTEGER (1-31)
- credit_limit: DECIMAL(10,2)
- color: TEXT
```

### Migrações

Arquivos em `supabase/migrations/`:
1. `001_initial_schema.sql` - Schema inicial
2. `002_add_is_paid.sql` - Campo is_paid
3. `003_add_recurrence.sql` - Recorrências
4. `004_add_credit_card.sql` - Cartões de crédito
5. `005_add_parent_ids.sql` - Parent IDs
6. `006_add_family_members.sql` - Membros da família
7. `007_add_investment_recurrence.sql` - Recorrência de investimentos

## 🔌 APIs

### Autenticação

Todas as APIs usam `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Endpoints

#### Despesas
- `GET /api/expenses` - Listar
- `POST /api/expenses` - Criar
- `GET /api/expenses/[id]` - Buscar
- `PATCH /api/expenses/[id]` - Atualizar
- `DELETE /api/expenses/[id]` - Excluir

#### Receitas
- `GET /api/incomes` - Listar
- `POST /api/incomes` - Criar
- `GET /api/incomes/[id]` - Buscar
- `PATCH /api/incomes/[id]` - Atualizar
- `DELETE /api/incomes/[id]` - Excluir

#### Cartões
- `GET /api/credit-cards` - Listar com faturas
- `POST /api/credit-cards` - Criar
- `GET /api/credit-cards/[id]` - Buscar com detalhes
- `PATCH /api/credit-cards/[id]` - Atualizar
- `DELETE /api/credit-cards/[id]` - Excluir

#### Compras de Cartão
- `GET /api/credit-card-purchases` - Listar
- `POST /api/credit-card-purchases` - Criar (gera parcelas)
- `GET /api/credit-card-purchases/[id]` - Buscar
- `DELETE /api/credit-card-purchases/[id]` - Excluir (remove parcelas)

#### Categorias
- `GET /api/categories` - Listar
- `POST /api/categories` - Criar
- `GET /api/categories/[id]` - Buscar
- `PATCH /api/categories/[id]` - Atualizar
- `DELETE /api/categories/[id]` - Excluir

#### Resumo
- `GET /api/summary` - Resumo financeiro do período

Ver [API_DOCUMENTATION.md](API_DOCUMENTATION.md) para exemplos completos.

## 🧩 Componentes

### Estrutura

```
components/
├── widgets/              # Widgets do dashboard
│   ├── BalanceWidget.tsx
│   ├── ExpensesByCategoryPieChart.tsx
│   └── ...
├── *Form.tsx            # Formulários de criação
├── *List.tsx            # Listas com filtros
├── *Modal.tsx           # Modais de edição
├── *Manager.tsx         # Gerenciadores
└── Navigation.tsx       # Navegação principal
```

### Componentes Principais

#### ExpensesList
Lista de despesas com:
- Filtros por período
- Filtros por membro
- Geração de despesas recorrentes virtuais
- Edição e exclusão

```typescript
<ExpensesList
  expenses={expenses}
  startDate="2026-03-01"
  endDate="2026-03-31"
  onRefresh={refetchExpenses}
/>
```

#### CreditCardPurchasesList
Lista de compras de cartão com:
- Agrupamento por compra parent
- Visualização de parcelas
- Edição e exclusão

#### DraggableDashboard
Dashboard configurável com:
- Drag & drop de widgets
- Salvamento de layout
- Widgets personalizáveis

## 🪝 Hooks

### useAuth
```typescript
const { user, loading, signIn, signOut } = useAuth()
```

### useExpenses
```typescript
const { expenses, loading, refetch } = useExpenses(userId)
```

### useIncomes
```typescript
const { incomes, loading, refetch } = useIncomes(userId)
```

### useInvestments
```typescript
const { investments, loading, refetch } = useInvestments(userId)
```

### useFamilyMembers
```typescript
const { members, loading, refetch } = useFamilyMembers(userId)
```

## 🛠️ Utilitários

### creditCard.ts

Funções para cálculo de parcelas:

```typescript
// Calcular data da primeira fatura
calculateFirstInvoiceDate(
  purchaseDate: string,
  closingDay: number,
  dueDay?: number
): Date

// Criar dados das parcelas
createInstallmentsData(
  totalAmount: number,
  installments: number,
  purchaseDate: string,
  closingDay: number,
  description: string,
  dueDay: number
): InstallmentData[]

// Calcular total do cartão
calculateCreditCardTotal(
  expenses: Expense[],
  creditCardId: string,
  month?: string
): number
```

### pdfGenerator.ts

Geração de relatórios em PDF:

```typescript
generateIncomeReport(
  incomes: Income[],
  period: { start: string; end: string }
): void
```

### utils.ts

Funções utilitárias:

```typescript
formatCurrency(value: number): string
formatDate(date: string): string
calculateRecurrenceOccurrences(config: RecurrenceConfig): Date[]
```

## 🚀 Deploy

### Vercel

1. **Conectar Repositório**
   - Conecte o GitHub ao Vercel
   - Selecione o repositório

2. **Configurar Variáveis**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy**
   - Push para `main` → deploy automático
   - Preview em PRs

### Supabase

1. **Criar Projeto**
   - Acesse supabase.com
   - Crie novo projeto

2. **Executar Migrações**
   - SQL Editor
   - Execute arquivos em ordem

3. **Configurar RLS**
   - Habilite Row Level Security
   - Políticas já definidas nas migrações

## 🐛 Debugging

### Frontend
```typescript
// Console do navegador
console.log('Debug:', data)
```

### APIs
```typescript
// Logs no Vercel
console.error('API Error:', error)
```

### Banco
```sql
-- Supabase Dashboard > SQL Editor
SELECT * FROM expenses WHERE user_id = 'UUID';
```

## 📊 Performance

### Otimizações
- Lazy loading de componentes
- Memoização com `useMemo`
- Debounce em filtros
- Índices no banco de dados

### Monitoramento
- Vercel Analytics
- Supabase Dashboard
- Console do navegador

## 🔒 Segurança

### Row Level Security (RLS)
```sql
-- Exemplo de política
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);
```

### Validações
- Frontend: Validação de formulários
- Backend: Validação nas APIs
- Banco: Constraints e triggers

## 📝 Convenções

### Código
- TypeScript strict mode
- ESLint + Prettier
- Nomenclatura em inglês
- Comentários em português

### Git
- Commits semânticos
- Branch `main` protegida
- PRs obrigatórios

### Versionamento
- Semantic Versioning (SemVer)
- Changelog atualizado

---

Para mais informações, consulte:
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [MANUAL_DO_USUARIO.md](MANUAL_DO_USUARIO.md)
