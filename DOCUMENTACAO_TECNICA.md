# 🔧 Documentação Técnica - Controle Financeiro Pessoal

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tecnologias](#tecnologias)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Componentes](#componentes)
6. [Hooks Personalizados](#hooks-personalizados)
7. [Banco de Dados](#banco-de-dados)
8. [Funcionalidades](#funcionalidades)
9. [Deploy e Configuração](#deploy-e-configuração)
10. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

### Descrição
Sistema web de controle financeiro pessoal desenvolvido com Next.js 14, TypeScript e Supabase. Oferece gestão completa de receitas, despesas, investimentos e cartões de crédito com interface responsiva e atualizações em tempo real.

### Características Técnicas
- **Framework**: Next.js 14 com App Router
- **Linguagem**: TypeScript para type safety
- **Styling**: Tailwind CSS com design system personalizado
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deploy**: Vercel (otimizado para Next.js)
- **PWA**: Progressive Web App capabilities

---

## 🏗️ Arquitetura

### Padrão de Arquitetura
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client-Side   │    │   API Layer     │    │   Database      │
│                 │    │                 │    │                 │
│ • React Hooks   │◄──►│ • Supabase      │◄──►│ • PostgreSQL    │
│ • Context API   │    │ • Real-time     │    │ • RLS           │
│ • Local Storage │    │ • Auth          │    │ • Triggers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Fluxo de Dados
1. **UI Components** → Interação do usuário
2. **Custom Hooks** → Lógica de negócio e estado
3. **Supabase Client** → Comunicação com API
4. **PostgreSQL** → Persistência de dados
5. **Real-time Subscriptions** → Atualizações automáticas

### Padrões Utilizados
- **Component Composition**: Componentes reutilizáveis e compostos
- **Custom Hooks**: Lógica de estado isolada e reutilizável
- **Context Pattern**: Gerenciamento de estado global (tema, auth)
- **Render Props**: Componentes flexíveis e configuráveis

---

## 💻 Tecnologias

### Frontend Stack
```typescript
{
  "framework": "Next.js 14.1.0",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.x",
  "charts": "Recharts 2.x",
  "dates": "date-fns 3.x",
  "drag-drop": "@dnd-kit/core",
  "icons": "Lucide React"
}
```

### Backend & Database
```typescript
{
  "backend": "Supabase",
  "database": "PostgreSQL 15",
  "auth": "Supabase Auth",
  "realtime": "Supabase Realtime",
  "storage": "Supabase Storage",
  "security": "Row Level Security (RLS)"
}
```

### Development Tools
```typescript
{
  "bundler": "Webpack 5 (Next.js)",
  "linter": "ESLint",
  "formatter": "Prettier",
  "types": "@types/node, @types/react",
  "deployment": "Vercel"
}
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── dashboard/         # Página principal
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx          # Página inicial
├── components/            # Componentes React
│   ├── widgets/          # Widgets do dashboard
│   ├── AuthForm.tsx      # Formulário de autenticação
│   ├── Navigation.tsx    # Navegação principal
│   └── ...              # Outros componentes
├── contexts/             # Context API
│   └── ThemeContext.tsx  # Contexto de tema
├── hooks/               # Custom Hooks
│   ├── useAuth.ts       # Hook de autenticação
│   ├── useExpenses.ts   # Hook de despesas
│   └── ...             # Outros hooks
├── lib/                # Utilitários e configurações
│   ├── supabase.ts     # Cliente Supabase
│   ├── utils.ts        # Funções utilitárias
│   └── ...            # Outras libs
└── types/             # Definições TypeScript
    ├── database.ts    # Tipos do banco
    └── index.ts      # Tipos gerais
```

### Convenções de Nomenclatura
- **Componentes**: PascalCase (ex: `ExpenseForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useExpenses.ts`)
- **Utilitários**: camelCase (ex: `formatCurrency`)
- **Tipos**: PascalCase (ex: `Expense`, `User`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_URL`)

---

## 🧩 Componentes

### Componentes Principais

#### Dashboard Components
```typescript
// DraggableDashboard.tsx
interface DashboardProps {
  userId: string
  expenses: Expense[]
  incomes: Income[]
  investments: Investment[]
  currentPeriod: DateRange
}

// Funcionalidades:
// - Drag & drop de widgets
// - Redimensionamento
// - Persistência no localStorage
// - 4 tamanhos de widgets
```

#### Form Components
```typescript
// ExpenseForm.tsx
interface ExpenseFormProps {
  userId: string
  onSuccess: () => void
  onRefresh?: () => void
}

// Funcionalidades:
// - Validação em tempo real
// - Suporte a recorrência
// - Integração com cartões
// - Cálculo de parcelas
```

#### List Components
```typescript
// ExpensesList.tsx
interface ExpensesListProps {
  userId: string
}

// Funcionalidades:
// - Paginação automática
// - Filtros por categoria
// - Ações em lote
// - Status de pagamento
```

### Widget System

#### Widget Base
```typescript
interface WidgetConfig {
  id: string
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  position: { x: number; y: number }
  visible: boolean
}

// Tamanhos disponíveis:
// small: 1x1 (300x200px)
// medium: 2x1 (620x200px) 
// large: 2x2 (620x420px)
// xlarge: 3x2 (940x420px)
```

#### Widgets Disponíveis
1. **StatsCardsWidget** - Cards de estatísticas
2. **ExpenseChartWidget** - Gráfico de despesas
3. **IncomeChartWidget** - Gráfico de receitas
4. **KPIWidget** - Indicadores configuráveis
5. **FinancialInsightsWidget** - Análises inteligentes
6. **CreditCardWidget** - Resumo de cartões
7. **CurrentBalanceWidget** - Saldo atual
8. **FutureProjectionsWidget** - Projeções futuras
9. **PaymentStatusWidget** - Status de pagamentos
10. **ProjectionChartWidget** - Gráfico de projeções

---

## 🎣 Hooks Personalizados

### useAuth
```typescript
interface AuthHook {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
}

// Funcionalidades:
// - Autenticação com Supabase
// - Modo demo integrado
// - Persistência de sessão
// - Redirecionamento automático
```

### useExpenses
```typescript
interface ExpensesHook {
  expenses: Expense[]
  loading: boolean
  addExpense: (expense: CreateExpense) => Promise<Response>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Response>
  deleteExpense: (id: string) => Promise<Response>
  refetch: () => Promise<void>
}

// Funcionalidades:
// - CRUD completo
// - Filtros automáticos por usuário
// - Relacionamentos (categorias, cartões)
// - Cache local otimizado
```

### useIncomes & useInvestments
Similar ao `useExpenses`, com funcionalidades específicas para receitas e investimentos.

---

## 🗄️ Banco de Dados

### Schema Principal

#### Tabelas Core
```sql
-- Usuários (gerenciado pelo Supabase Auth)
auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  created_at TIMESTAMP
)

-- Categorias de Despesas
expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  color VARCHAR DEFAULT '#007aff',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Despesas
expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  payment_method VARCHAR,
  is_recurring BOOLEAN DEFAULT FALSE,
  -- Campos de recorrência
  recurrence_frequency VARCHAR,
  recurrence_start_date DATE,
  recurrence_end_type VARCHAR,
  recurrence_end_date DATE,
  recurrence_count INTEGER,
  -- Campos de cartão de crédito
  is_credit_card BOOLEAN DEFAULT FALSE,
  credit_card_id UUID REFERENCES credit_cards(id),
  total_amount DECIMAL(10,2),
  installments INTEGER,
  installment_number INTEGER,
  purchase_date DATE,
  parent_expense_id UUID REFERENCES expenses(id),
  is_installment BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Relacionamentos
```sql
-- Receitas
incomes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  income_date DATE NOT NULL,
  category_id UUID REFERENCES income_categories(id),
  source VARCHAR,
  is_recurring BOOLEAN DEFAULT FALSE,
  -- Campos de recorrência similares às despesas
  is_paid BOOLEAN DEFAULT FALSE
)

-- Investimentos
investments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  investment_type_id UUID REFERENCES investment_types(id),
  institution VARCHAR,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL,
  investment_date DATE NOT NULL,
  expected_return DECIMAL(5,2)
)

-- Cartões de Crédito
credit_cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  credit_limit DECIMAL(10,2),
  color VARCHAR DEFAULT '#007aff'
)
```

### Row Level Security (RLS)

#### Políticas de Segurança
```sql
-- Exemplo para tabela expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);
```

### Triggers e Funções

#### Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## ⚙️ Funcionalidades

### Sistema de Recorrência

#### Implementação
```typescript
interface RecurrenceConfig {
  startDate: Date
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  endType: 'never' | 'after_occurrences' | 'on_date'
  endDate?: Date
  occurrences?: number
}

// Geração de ocorrências futuras
function generateRecurrenceOccurrences(
  config: RecurrenceConfig, 
  maxOccurrences: number = 12
): RecurrenceOccurrence[]
```

#### Algoritmo de Cálculo
1. **Validação** da configuração de recorrência
2. **Cálculo** das datas baseado na frequência
3. **Aplicação** dos critérios de término
4. **Limitação** do número máximo de ocorrências
5. **Retorno** da lista de ocorrências futuras

### Sistema de Cartão de Crédito

#### Cálculo de Parcelas
```typescript
interface CreditCardPurchase {
  totalAmount: number
  installments: number
  purchaseDate: string
  closingDay: number
}

// Algoritmo de cálculo:
// 1. Determinar primeira fatura baseada na data de compra
// 2. Distribuir parcelas pelos próximos meses
// 3. Calcular datas de vencimento
// 4. Criar registros individuais para cada parcela
```

### Dashboard Configurável

#### Sistema de Layout
```typescript
interface LayoutConfig {
  [widgetId: string]: {
    x: number
    y: number
    w: number
    h: number
    visible: boolean
  }
}

// Persistência no localStorage
const STORAGE_KEY = 'dashboard-layout-v2'
localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
```

#### Drag & Drop Implementation
- **Biblioteca**: @dnd-kit/core
- **Grid System**: CSS Grid com breakpoints responsivos
- **Constraints**: Limites de área e colisão entre widgets
- **Persistence**: Salvamento automático no localStorage

### Real-time Updates

#### Implementação
```typescript
// Hook pattern para atualizações automáticas
const { data, loading, refetch } = useExpenses(userId)

// Após operações CRUD
const addExpense = async (expense) => {
  const { error } = await supabase.from('expenses').insert(expense)
  if (!error) {
    await refetch() // Atualização automática
    if (onRefresh) onRefresh() // Callback para componentes pai
  }
}
```

---

## 🚀 Deploy e Configuração

### Variáveis de Ambiente

#### Desenvolvimento (.env.local)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Produção (Vercel)
```bash
# Mesmas variáveis com valores de produção
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Configuração do Supabase

#### 1. Criação do Projeto
```bash
# Instalar CLI do Supabase
npm install -g @supabase/cli

# Inicializar projeto
supabase init

# Executar migrações
supabase db push
```

#### 2. Configuração de Auth
```sql
-- Configurar políticas RLS
-- Habilitar Row Level Security em todas as tabelas
-- Configurar providers de autenticação (email/password)
```

#### 3. Configuração de Real-time
```sql
-- Habilitar real-time para tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE investments;
```

### Deploy na Vercel

#### 1. Configuração do Projeto
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

#### 2. Build Settings
```bash
# Build Command
npm run build

# Output Directory
.next

# Install Command
npm install

# Development Command
npm run dev
```

#### 3. Environment Variables
- Configurar todas as variáveis de ambiente na dashboard da Vercel
- Usar valores de produção do Supabase
- Configurar domínio personalizado se necessário

---

## 🔧 Manutenção

### Monitoramento

#### Métricas Importantes
1. **Performance**: Core Web Vitals, tempo de carregamento
2. **Erros**: Rate de erro, stack traces
3. **Uso**: Páginas mais acessadas, funcionalidades utilizadas
4. **Database**: Queries lentas, uso de storage

#### Ferramentas
- **Vercel Analytics**: Métricas de performance e uso
- **Supabase Dashboard**: Monitoramento de database e auth
- **Browser DevTools**: Debugging local e performance

### Backup e Segurança

#### Backup de Dados
```bash
# Backup automático do Supabase (configurado no dashboard)
# Backup manual via CLI
supabase db dump --file backup.sql
```

#### Segurança
1. **RLS**: Todas as tabelas protegidas por Row Level Security
2. **Auth**: Autenticação obrigatória para todas as operações
3. **Validation**: Validação client-side e server-side
4. **HTTPS**: Comunicação criptografada (Vercel + Supabase)

### Atualizações

#### Dependências
```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Atualizar Next.js
npm install next@latest react@latest react-dom@latest
```

#### Migrações de Database
```sql
-- Criar nova migração
supabase migration new add_new_feature

-- Aplicar migração
supabase db push
```

### Performance Optimization

#### Frontend
1. **Code Splitting**: Componentes carregados sob demanda
2. **Image Optimization**: Next.js Image component
3. **Caching**: Estratégias de cache para dados estáticos
4. **Bundle Analysis**: Análise regular do tamanho do bundle

#### Backend
1. **Query Optimization**: Índices apropriados no PostgreSQL
2. **Connection Pooling**: Configuração otimizada no Supabase
3. **Real-time Subscriptions**: Uso eficiente de subscriptions
4. **Storage**: Otimização de assets e uploads

---

## 📚 Recursos Adicionais

### Documentação de Referência
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Ferramentas de Desenvolvimento
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Next.js DevTools](https://nextjs.org/docs/advanced-features/debugging)

### Comunidade e Suporte
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

---

## 🎯 Conclusão

Esta documentação técnica fornece uma visão abrangente da arquitetura, implementação e manutenção do sistema de Controle Financeiro Pessoal. O projeto utiliza tecnologias modernas e padrões de desenvolvimento para oferecer uma experiência robusta, escalável e maintível.

Para dúvidas específicas ou contribuições, consulte o código-fonte e a documentação das tecnologias utilizadas.