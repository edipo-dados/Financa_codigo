# 🧪 Guia de Testes das APIs

## 📋 Pré-requisitos

1. Aplicação rodando localmente (`npm run dev`) ou deploy no Vercel concluído
2. Seu `user_id` do Supabase (veja como obter abaixo)

## 🔑 Como Obter seu User ID

### Opção 1: Pelo Console do Navegador
1. Abra sua aplicação no navegador
2. Abra o DevTools (F12)
3. Vá na aba Console
4. Digite e execute:
```javascript
localStorage.getItem('sb-vpjaheorjvviysznxtpv-auth-token')
```
5. Procure pelo campo `user.id` no JSON retornado

### Opção 2: Pelo Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Vá no seu projeto
3. Clique em "Authentication" → "Users"
4. Copie o UUID do seu usuário

---

## 🧪 Testes Locais (http://localhost:3000)

### 1. Testar API de Despesas - Listar

**PowerShell:**
```powershell
$userId = "SEU_USER_ID_AQUI"
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses?user_id=$userId" -Method Get | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl "http://localhost:3000/api/expenses?user_id=SEU_USER_ID_AQUI"
```

**Navegador:**
```
http://localhost:3000/api/expenses?user_id=SEU_USER_ID_AQUI
```

---

### 2. Testar API de Despesas - Criar

**PowerShell:**
```powershell
$body = @{
    user_id = "SEU_USER_ID_AQUI"
    amount = 150.50
    description = "Teste de API - Supermercado"
    expense_date = "2026-03-09"
    payment_method = "Dinheiro"
    is_paid = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/expenses" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl -X POST "http://localhost:3000/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "SEU_USER_ID_AQUI",
    "amount": 150.50,
    "description": "Teste de API - Supermercado",
    "expense_date": "2026-03-09",
    "payment_method": "Dinheiro",
    "is_paid": true
  }'
```

---

### 3. Testar API de Receitas - Listar

**PowerShell:**
```powershell
$userId = "SEU_USER_ID_AQUI"
Invoke-RestMethod -Uri "http://localhost:3000/api/incomes?user_id=$userId" -Method Get | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl "http://localhost:3000/api/incomes?user_id=SEU_USER_ID_AQUI"
```

---

### 4. Testar API de Receitas - Criar

**PowerShell:**
```powershell
$body = @{
    user_id = "SEU_USER_ID_AQUI"
    amount = 5000.00
    description = "Teste de API - Salário"
    income_date = "2026-03-05"
    source = "Empresa Teste"
    is_paid = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/incomes" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl -X POST "http://localhost:3000/api/incomes" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "SEU_USER_ID_AQUI",
    "amount": 5000.00,
    "description": "Teste de API - Salário",
    "income_date": "2026-03-05",
    "source": "Empresa Teste",
    "is_paid": true
  }'
```

---

### 5. Testar API de Resumo

**PowerShell:**
```powershell
$userId = "SEU_USER_ID_AQUI"
Invoke-RestMethod -Uri "http://localhost:3000/api/summary?user_id=$userId&start_date=2026-03-01&end_date=2026-03-31" -Method Get | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl "http://localhost:3000/api/summary?user_id=SEU_USER_ID_AQUI&start_date=2026-03-01&end_date=2026-03-31"
```

---

### 6. Testar API - Buscar Despesa por ID

Primeiro, pegue um ID de despesa da listagem, depois:

**PowerShell:**
```powershell
$expenseId = "UUID_DA_DESPESA"
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId" -Method Get | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl "http://localhost:3000/api/expenses/UUID_DA_DESPESA"
```

---

### 7. Testar API - Atualizar Despesa

**PowerShell:**
```powershell
$expenseId = "UUID_DA_DESPESA"
$body = @{
    amount = 200.00
    description = "Despesa Atualizada via API"
    is_paid = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId" -Method Patch -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl -X PATCH "http://localhost:3000/api/expenses/UUID_DA_DESPESA" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200.00,
    "description": "Despesa Atualizada via API",
    "is_paid": true
  }'
```

---

### 8. Testar API - Excluir Despesa

**PowerShell:**
```powershell
$expenseId = "UUID_DA_DESPESA"
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId" -Method Delete | ConvertTo-Json -Depth 10
```

**Bash/Git Bash:**
```bash
curl -X DELETE "http://localhost:3000/api/expenses/UUID_DA_DESPESA"
```

---

## 🌐 Testes em Produção (Vercel)

Substitua `http://localhost:3000` pela URL do seu deploy no Vercel.

Exemplo:
```powershell
$userId = "SEU_USER_ID_AQUI"
Invoke-RestMethod -Uri "https://seu-app.vercel.app/api/expenses?user_id=$userId" -Method Get | ConvertTo-Json -Depth 10
```

---

## 🔧 Usando Postman ou Insomnia

### Importar Collection

Crie uma nova collection com as seguintes requisições:

#### 1. GET - Listar Despesas
- **Method:** GET
- **URL:** `http://localhost:3000/api/expenses?user_id={{user_id}}`
- **Headers:** Nenhum necessário

#### 2. POST - Criar Despesa
- **Method:** POST
- **URL:** `http://localhost:3000/api/expenses`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "user_id": "{{user_id}}",
  "amount": 150.50,
  "description": "Teste Postman",
  "expense_date": "2026-03-09",
  "is_paid": true
}
```

#### 3. GET - Resumo Financeiro
- **Method:** GET
- **URL:** `http://localhost:3000/api/summary?user_id={{user_id}}&start_date=2026-03-01&end_date=2026-03-31`

---

## 🐍 Teste com Python

Crie um arquivo `test_api.py`:

```python
import requests
import json

# Configurações
BASE_URL = "http://localhost:3000/api"
USER_ID = "SEU_USER_ID_AQUI"

# 1. Listar despesas
print("=== Listando Despesas ===")
response = requests.get(f"{BASE_URL}/expenses", params={"user_id": USER_ID})
print(json.dumps(response.json(), indent=2))

# 2. Criar despesa
print("\n=== Criando Despesa ===")
nova_despesa = {
    "user_id": USER_ID,
    "amount": 99.90,
    "description": "Teste Python API",
    "expense_date": "2026-03-09",
    "is_paid": True
}
response = requests.post(f"{BASE_URL}/expenses", json=nova_despesa)
print(json.dumps(response.json(), indent=2))
despesa_id = response.json()["data"]["id"]

# 3. Buscar despesa criada
print("\n=== Buscando Despesa ===")
response = requests.get(f"{BASE_URL}/expenses/{despesa_id}")
print(json.dumps(response.json(), indent=2))

# 4. Atualizar despesa
print("\n=== Atualizando Despesa ===")
response = requests.patch(
    f"{BASE_URL}/expenses/{despesa_id}",
    json={"amount": 150.00, "description": "Atualizado via Python"}
)
print(json.dumps(response.json(), indent=2))

# 5. Resumo financeiro
print("\n=== Resumo Financeiro ===")
response = requests.get(
    f"{BASE_URL}/summary",
    params={
        "user_id": USER_ID,
        "start_date": "2026-03-01",
        "end_date": "2026-03-31"
    }
)
print(json.dumps(response.json(), indent=2))

# 6. Excluir despesa
print("\n=== Excluindo Despesa ===")
response = requests.delete(f"{BASE_URL}/expenses/{despesa_id}")
print(json.dumps(response.json(), indent=2))
```

Execute:
```bash
python test_api.py
```

---

## 📊 Respostas Esperadas

### Sucesso - Listar Despesas
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "amount": 150.50,
      "description": "Supermercado",
      "expense_date": "2026-03-09",
      "is_paid": true,
      "category": { "name": "Alimentação" },
      "member": { "name": "João" }
    }
  ]
}
```

### Sucesso - Criar Despesa
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "amount": 150.50,
    "description": "Teste de API",
    "created_at": "2026-03-09T..."
  }
}
```

### Erro - Parâmetro Faltando
```json
{
  "error": "user_id é obrigatório"
}
```

---

## 🎯 Checklist de Testes

- [ ] GET /api/expenses - Listar despesas
- [ ] POST /api/expenses - Criar despesa
- [ ] GET /api/expenses/[id] - Buscar despesa por ID
- [ ] PATCH /api/expenses/[id] - Atualizar despesa
- [ ] DELETE /api/expenses/[id] - Excluir despesa
- [ ] GET /api/incomes - Listar receitas
- [ ] POST /api/incomes - Criar receita
- [ ] GET /api/incomes/[id] - Buscar receita por ID
- [ ] PATCH /api/incomes/[id] - Atualizar receita
- [ ] DELETE /api/incomes/[id] - Excluir receita
- [ ] GET /api/summary - Resumo financeiro

---

## 🚨 Troubleshooting

### Erro: "user_id é obrigatório"
- Certifique-se de passar o parâmetro `user_id` na query string

### Erro: "supabaseKey is required"
- A variável `SUPABASE_SERVICE_ROLE_KEY` não está configurada
- Verifique o arquivo `.env.local`

### Erro 404: "Not Found"
- Verifique se o ID da despesa/receita existe
- Confirme que o UUID está correto

### Erro 500: "Internal Server Error"
- Verifique os logs do servidor
- Confirme que o Supabase está acessível
- Verifique se as tabelas existem no banco

---

## 📝 Dicas

1. Use variáveis de ambiente para o `user_id` nos testes
2. Salve os IDs retornados para testes subsequentes
3. Teste primeiro localmente antes de testar em produção
4. Use ferramentas como Postman para salvar suas requisições
5. Consulte `API_DOCUMENTATION.md` para mais detalhes

