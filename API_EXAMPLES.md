# Exemplos de Uso da API

Este documento contém exemplos de como usar as funcionalidades da aplicação.

## Autenticação

### Criar Conta
```typescript
const { signUp } = useAuth()

await signUp(
  'usuario@email.com',
  'senha123',
  'Nome Completo'
)
```

### Login
```typescript
const { signIn } = useAuth()

await signIn('usuario@email.com', 'senha123')
```

### Logout
```typescript
const { signOut } = useAuth()

await signOut()
```

## Despesas

### Listar Despesas
```typescript
const { expenses, loading } = useExpenses(userId)

// expenses contém todas as despesas do usuário
// ordenadas por data (mais recente primeiro)
```

### Adicionar Despesa Avulsa
```typescript
const { addExpense } = useExpenses(userId)

await addExpense({
  user_id: userId,
  amount: 150.50,
  description: 'Compras no supermercado',
  expense_date: '2024-01-15',
  category_id: 'uuid-da-categoria',
  payment_method: 'Cartão de crédito',
  is_recurring: false,
  recurrence_frequency: null,
  recurrence_start_date: null,
  recurrence_end_date: null,
  parent_expense_id: null,
})
```

### Adicionar Despesa Recorrente
```typescript
const { addExpense } = useExpenses(userId)

await addExpense({
  user_id: userId,
  amount: 1200.00,
  description: 'Aluguel',
  expense_date: '2024-01-01',
  category_id: 'uuid-da-categoria-moradia',
  payment_method: 'Transferência',
  is_recurring: true,
  recurrence_frequency: 'monthly',
  recurrence_start_date: '2024-01-01',
  recurrence_end_date: null, // null = sem data de término
  parent_expense_id: null,
})
```

### Atualizar Despesa
```typescript
const { updateExpense } = useExpenses(userId)

await updateExpense('uuid-da-despesa', {
  amount: 175.00,
  description: 'Compras no supermercado - atualizado',
})
```

### Excluir Despesa
```typescript
const { deleteExpense } = useExpenses(userId)

await deleteExpense('uuid-da-despesa')
```

## Categorias de Despesas

### Criar Categoria
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('expense_categories')
  .insert({
    user_id: userId,
    name: 'Nova Categoria',
    color: '#FF5733',
  })
  .select()
  .single()
```

### Listar Categorias
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('expense_categories')
  .select('*')
  .eq('user_id', userId)
```

## Investimentos

### Listar Investimentos
```typescript
const { investments, loading } = useInvestments(userId)

// investments contém todos os investimentos com:
// - Dados do investimento
// - Tipo de investimento (investment_type)
// - Transações (transactions)
```

### Adicionar Investimento
```typescript
const { addInvestment } = useInvestments(userId)

await addInvestment({
  user_id: userId,
  name: 'Tesouro Selic 2027',
  investment_type_id: 'uuid-do-tipo',
  institution: 'Tesouro Direto',
  initial_amount: 5000.00,
  current_amount: 5000.00, // Inicialmente igual ao valor investido
  investment_date: '2024-01-15',
  expected_return: 13.65, // Percentual anual
})
```

### Atualizar Investimento
```typescript
const { updateInvestment } = useInvestments(userId)

await updateInvestment('uuid-do-investimento', {
  current_amount: 5250.00, // Valor atualizado
})
```

### Excluir Investimento
```typescript
const { deleteInvestment } = useInvestments(userId)

await deleteInvestment('uuid-do-investimento')
```

### Adicionar Transação (Aporte/Resgate)
```typescript
const { addTransaction } = useInvestments(userId)

// Aporte adicional
await addTransaction({
  investment_id: 'uuid-do-investimento',
  transaction_type: 'deposit',
  amount: 1000.00,
  transaction_date: '2024-02-01',
  description: 'Aporte mensal',
})

// Resgate parcial
await addTransaction({
  investment_id: 'uuid-do-investimento',
  transaction_type: 'withdrawal',
  amount: 500.00,
  transaction_date: '2024-02-15',
  description: 'Resgate para emergência',
})

// Rendimento
await addTransaction({
  investment_id: 'uuid-do-investimento',
  transaction_type: 'return',
  amount: 125.50,
  transaction_date: '2024-02-28',
  description: 'Rendimento do mês',
})
```

## Tipos de Investimento

### Criar Tipo
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('investment_types')
  .insert({
    user_id: userId,
    name: 'ETFs',
  })
  .select()
  .single()
```

### Listar Tipos
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('investment_types')
  .select('*')
  .eq('user_id', userId)
```

## Queries Avançadas

### Despesas do Mês Atual
```typescript
import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/utils'

const { start, end } = getCurrentMonthRange()

const { data, error } = await supabase
  .from('expenses')
  .select('*, category:expense_categories(*)')
  .eq('user_id', userId)
  .gte('expense_date', start)
  .lte('expense_date', end)
  .order('expense_date', { ascending: false })
```

### Despesas por Categoria
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('expenses')
  .select('amount, category:expense_categories(name, color)')
  .eq('user_id', userId)
  .eq('category_id', 'uuid-da-categoria')
```

### Total Investido por Tipo
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('investments')
  .select('current_amount, investment_type:investment_types(name)')
  .eq('user_id', userId)

// Agrupar no frontend
const totalByType = data?.reduce((acc, inv) => {
  const typeName = inv.investment_type?.name || 'Sem tipo'
  if (!acc[typeName]) acc[typeName] = 0
  acc[typeName] += Number(inv.current_amount)
  return acc
}, {} as Record<string, number>)
```

### Histórico de Transações de um Investimento
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('investment_transactions')
  .select('*')
  .eq('investment_id', 'uuid-do-investimento')
  .order('transaction_date', { ascending: false })
```

## Utilitários

### Formatação de Moeda
```typescript
import { formatCurrency } from '@/lib/utils'

const formatted = formatCurrency(1234.56)
// Resultado: "R$ 1.234,56"
```

### Formatação de Data
```typescript
import { formatDate, formatMonth } from '@/lib/utils'

const date = formatDate('2024-01-15')
// Resultado: "15/01/2024"

const month = formatMonth('2024-01-15')
// Resultado: "jan/2024"
```

### Cálculo de Variação Percentual
```typescript
import { calculatePercentageChange } from '@/lib/utils'

const change = calculatePercentageChange(5250, 5000)
// Resultado: 5 (5% de aumento)
```

## Tratamento de Erros

Todas as operações retornam um objeto com `error`:

```typescript
const { data, error } = await addExpense(...)

if (error) {
  console.error('Erro ao adicionar despesa:', error.message)
  // Mostrar mensagem para o usuário
} else {
  console.log('Despesa adicionada com sucesso:', data)
}
```

## Realtime (Futuro)

O Supabase suporta subscriptions em tempo real:

```typescript
const subscription = supabase
  .channel('expenses-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Mudança detectada:', payload)
      // Atualizar UI
    }
  )
  .subscribe()

// Cleanup
return () => {
  subscription.unsubscribe()
}
```
