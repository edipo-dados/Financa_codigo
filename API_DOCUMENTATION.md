# 📚 Documentação da API - Sistema Financeiro

API REST para integração com aplicações de IA e outros sistemas externos.

## 🔐 Autenticação

As APIs usam o `SUPABASE_SERVICE_ROLE_KEY` para autenticação. Configure a variável de ambiente:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## 🌐 Base URL

```
https://seu-dominio.vercel.app/api
```

---

## 💸 Despesas (Expenses)

### 1. Listar Despesas

**Endpoint:** `GET /api/expenses`

**Query Parameters:**
- `user_id` (obrigatório) - ID do usuário
- `start_date` (opcional) - Data inicial (YYYY-MM-DD)
- `end_date` (opcional) - Data final (YYYY-MM-DD)
- `is_paid` (opcional) - Filtrar por status (true/false)

**Exemplo de Request:**
```bash
curl "https://seu-dominio.vercel.app/api/expenses?user_id=123&start_date=2026-01-01&end_date=2026-12-31"
```

**Exemplo de Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 150.50,
      "description": "Supermercado",
      "expense_date": "2026-03-08",
      "payment_method": "Cartão de Débito",
      "is_paid": true,
      "is_recurring": false,
      "category": {
        "id": "uuid",
        "name": "Alimentação",
        "color": "#ff6b6b"
      },
      "member": {
        "id": "uuid",
        "name": "João",
        "relationship": "Pai"
      },
      "created_at": "2026-03-08T10:00:00Z",
      "updated_at": "2026-03-08T10:00:00Z"
    }
  ]
}
```

---

### 2. Buscar Despesa por ID

**Endpoint:** `GET /api/expenses/[id]`

**Exemplo de Request:**
```bash
curl "https://seu-dominio.vercel.app/api/expenses/uuid-da-despesa"
```

**Exemplo de Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 150.50,
    "description": "Supermercado",
    "expense_date": "2026-03-08",
    "is_paid": true
  }
}
```

---

### 3. Criar Despesa

**Endpoint:** `POST /api/expenses`

**Body (JSON):**
```json
{
  "user_id": "uuid",
  "amount": 150.50,
  "description": "Supermercado",
  "expense_date": "2026-03-08",
  "category_id": "uuid",
  "member_id": "uuid",
  "payment_method": "Cartão de Débito",
  "is_paid": true,
  "is_recurring": false
}
```

**Campos Obrigatórios:**
- `user_id`
- `amount`
- `description`
- `expense_date`

**Campos Opcionais:**
- `category_id`
- `member_id`
- `payment_method`
- `is_paid` (default: false)
- `is_recurring` (default: false)
- `recurrence_frequency` ('daily', 'weekly', 'monthly', 'yearly')
- `recurrence_start_date`
- `recurrence_end_type` ('never', 'after_occurrences', 'on_date')
- `recurrence_count`
- `recurrence_end_date`

**Exemplo de Request:**
```bash
curl -X POST "https://seu-dominio.vercel.app/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid",
    "amount": 150.50,
    "description": "Supermercado",
    "expense_date": "2026-03-08",
    "is_paid": true
  }'
```

**Exemplo de Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 150.50,
    "description": "Supermercado",
    "expense_date": "2026-03-08",
    "is_paid": true,
    "created_at": "2026-03-08T10:00:00Z"
  }
}
```

---

### 4. Atualizar Despesa

**Endpoint:** `PATCH /api/expenses/[id]`

**Body (JSON):**
```json
{
  "amount": 200.00,
  "description": "Supermercado - Atualizado",
  "is_paid": true
}
```

**Exemplo de Request:**
```bash
curl -X PATCH "https://seu-dominio.vercel.app/api/expenses/uuid" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200.00, "is_paid": true}'
```

---

### 5. Excluir Despesa

**Endpoint:** `DELETE /api/expenses/[id]`

**Exemplo de Request:**
```bash
curl -X DELETE "https://seu-dominio.vercel.app/api/expenses/uuid"
```

**Exemplo de Response:**
```json
{
  "success": true,
  "message": "Despesa excluída com sucesso"
}
```

---

## 💰 Receitas (Incomes)

### 1. Listar Receitas

**Endpoint:** `GET /api/incomes`

**Query Parameters:**
- `user_id` (obrigatório) - ID do usuário
- `start_date` (opcional) - Data inicial (YYYY-MM-DD)
- `end_date` (opcional) - Data final (YYYY-MM-DD)
- `is_paid` (opcional) - Filtrar por status (true/false)

**Exemplo de Request:**
```bash
curl "https://seu-dominio.vercel.app/api/incomes?user_id=123&start_date=2026-01-01"
```

**Exemplo de Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 5000.00,
      "description": "Salário",
      "income_date": "2026-03-05",
      "source": "Empresa XYZ",
      "is_paid": true,
      "is_recurring": true,
      "recurrence_frequency": "monthly",
      "category": {
        "id": "uuid",
        "name": "Salário",
        "color": "#34c759"
      },
      "member": {
        "id": "uuid",
        "name": "João",
        "relationship": "Pai"
      }
    }
  ]
}
```

---

### 2. Buscar Receita por ID

**Endpoint:** `GET /api/incomes/[id]`

**Exemplo de Request:**
```bash
curl "https://seu-dominio.vercel.app/api/incomes/uuid-da-receita"
```

---

### 3. Criar Receita

**Endpoint:** `POST /api/incomes`

**Body (JSON):**
```json
{
  "user_id": "uuid",
  "amount": 5000.00,
  "description": "Salário",
  "income_date": "2026-03-05",
  "source": "Empresa XYZ",
  "category_id": "uuid",
  "member_id": "uuid",
  "is_paid": true,
  "is_recurring": true,
  "recurrence_frequency": "monthly",
  "recurrence_start_date": "2026-03-05",
  "recurrence_end_type": "never"
}
```

**Campos Obrigatórios:**
- `user_id`
- `amount`
- `description`
- `income_date`

**Campos Opcionais:**
- `category_id`
- `member_id`
- `source`
- `is_paid` (default: false)
- `is_recurring` (default: false)
- `recurrence_frequency` ('daily', 'weekly', 'monthly', 'yearly')
- `recurrence_start_date`
- `recurrence_end_type` ('never', 'after_occurrences', 'on_date')
- `recurrence_count`
- `recurrence_end_date`

---

### 4. Atualizar Receita

**Endpoint:** `PATCH /api/incomes/[id]`

**Body (JSON):**
```json
{
  "amount": 5500.00,
  "is_paid": true
}
```

---

### 5. Excluir Receita

**Endpoint:** `DELETE /api/incomes/[id]`

---

## 📊 Resumo Financeiro

### Buscar Resumo

**Endpoint:** `GET /api/summary`

**Query Parameters:**
- `user_id` (obrigatório) - ID do usuário
- `start_date` (opcional) - Data inicial (YYYY-MM-DD)
- `end_date` (opcional) - Data final (YYYY-MM-DD)

**Exemplo de Request:**
```bash
curl "https://seu-dominio.vercel.app/api/summary?user_id=123&start_date=2026-03-01&end_date=2026-03-31"
```

**Exemplo de Response:**
```json
{
  "success": true,
  "period": {
    "start_date": "2026-03-01",
    "end_date": "2026-03-31"
  },
  "incomes": {
    "total": 5000.00,
    "paid": 5000.00,
    "unpaid": 0.00,
    "count": 1
  },
  "expenses": {
    "total": 2500.00,
    "paid": 2000.00,
    "unpaid": 500.00,
    "count": 15
  },
  "balance": {
    "total": 2500.00,
    "real": 3000.00,
    "projected": -500.00
  }
}
```

**Campos do Response:**
- `incomes.total` - Total de receitas (pagas + a receber)
- `incomes.paid` - Receitas já recebidas
- `incomes.unpaid` - Receitas a receber
- `expenses.total` - Total de despesas (pagas + a pagar)
- `expenses.paid` - Despesas já pagas
- `expenses.unpaid` - Despesas a pagar
- `balance.total` - Saldo total (receitas - despesas)
- `balance.real` - Saldo real (recebidas - pagas)
- `balance.projected` - Saldo projetado (a receber - a pagar)

---

## 🚨 Códigos de Erro

- `400` - Bad Request (parâmetros inválidos)
- `404` - Not Found (recurso não encontrado)
- `500` - Internal Server Error (erro no servidor)

**Exemplo de Response de Erro:**
```json
{
  "error": "user_id é obrigatório"
}
```

---

## 💡 Exemplos de Uso com IA

### Exemplo 1: Análise de Gastos Mensais

```python
import requests

# Buscar despesas do mês
response = requests.get(
    "https://seu-dominio.vercel.app/api/expenses",
    params={
        "user_id": "uuid-do-usuario",
        "start_date": "2026-03-01",
        "end_date": "2026-03-31"
    }
)

expenses = response.json()["data"]

# Analisar com IA
for expense in expenses:
    print(f"Despesa: {expense['description']} - R$ {expense['amount']}")
```

### Exemplo 2: Criar Despesa via IA

```python
import requests

# IA detectou uma despesa e cria automaticamente
response = requests.post(
    "https://seu-dominio.vercel.app/api/expenses",
    json={
        "user_id": "uuid-do-usuario",
        "amount": 150.50,
        "description": "Supermercado detectado via IA",
        "expense_date": "2026-03-08",
        "is_paid": True
    }
)

print(response.json())
```

### Exemplo 3: Análise de Saldo

```python
import requests

# Buscar resumo financeiro
response = requests.get(
    "https://seu-dominio.vercel.app/api/summary",
    params={
        "user_id": "uuid-do-usuario",
        "start_date": "2026-03-01",
        "end_date": "2026-03-31"
    }
)

summary = response.json()
print(f"Saldo Real: R$ {summary['balance']['real']}")
print(f"Saldo Projetado: R$ {summary['balance']['projected']}")
```

---

## 🔒 Segurança

1. **Nunca exponha** o `SUPABASE_SERVICE_ROLE_KEY` no frontend
2. Use HTTPS em produção
3. Implemente rate limiting se necessário
4. Valide sempre o `user_id` para garantir que a IA acesse apenas dados autorizados

---

## 📝 Notas

- Todas as datas devem estar no formato `YYYY-MM-DD`
- Valores monetários são em formato decimal (ex: 150.50)
- IDs são UUIDs v4
- Timestamps são em formato ISO 8601 (UTC)
