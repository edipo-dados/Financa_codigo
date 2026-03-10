# 🔐 Autenticação das APIs

## 📋 Visão Geral

As APIs do sistema financeiro usam autenticação via **Bearer Token (JWT)** do Supabase para garantir que apenas usuários autenticados possam acessar seus próprios dados.

## 🔑 Como Funciona

1. Usuário faz login no sistema (via Supabase Auth)
2. Supabase retorna um token JWT
3. Cliente envia o token no header `Authorization` em cada requisição
4. API valida o token e verifica permissões
5. API retorna os dados ou erro de autenticação

---

## 🚀 Como Obter o Token

### Opção 1: Login via Supabase (Recomendado)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vpjaheorjvviysznxtpv.supabase.co',
  'sua-anon-key'
)

// Fazer login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123'
})

if (data.session) {
  const token = data.session.access_token
  console.log('Token:', token)
  // Use este token nas requisições
}
```

### Opção 2: Obter Token do LocalStorage (Frontend)

```javascript
// No navegador, após login
const session = JSON.parse(
  localStorage.getItem('sb-vpjaheorjvviysznxtpv-auth-token')
)
const token = session.access_token
```

### Opção 3: Obter Token Atual (se já logado)

```javascript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## 📡 Como Usar o Token nas Requisições

### JavaScript/TypeScript

```javascript
const token = 'seu-token-jwt-aqui'
const userId = 'seu-user-id'

// GET - Listar despesas
const response = await fetch(
  `https://financa-codigo.vercel.app/api/expenses?user_id=${userId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)

const data = await response.json()
console.log(data)
```

### Python

```python
import requests

token = "seu-token-jwt-aqui"
user_id = "seu-user-id"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# GET - Listar despesas
response = requests.get(
    f"https://financa-codigo.vercel.app/api/expenses?user_id={user_id}",
    headers=headers
)

print(response.json())
```

### cURL

```bash
TOKEN="seu-token-jwt-aqui"
USER_ID="seu-user-id"

curl "https://financa-codigo.vercel.app/api/expenses?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### PowerShell

```powershell
$token = "seu-token-jwt-aqui"
$userId = "seu-user-id"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod `
  -Uri "https://financa-codigo.vercel.app/api/expenses?user_id=$userId" `
  -Headers $headers `
  -Method Get
```

---

## 🔒 Segurança

### O que a API Valida

1. ✅ **Token Presente:** Verifica se o header Authorization existe
2. ✅ **Token Válido:** Valida o JWT com o Supabase
3. ✅ **Token Não Expirado:** Verifica se o token ainda é válido
4. ✅ **Autorização:** Garante que o usuário só acessa seus próprios dados

### Proteções Implementadas

- **401 Unauthorized:** Token ausente, inválido ou expirado
- **403 Forbidden:** Usuário tentando acessar dados de outro usuário
- **Validação de Propriedade:** user_id da requisição deve ser do usuário autenticado

---

## 📝 Exemplos Completos

### Exemplo 1: Listar Despesas com Autenticação

```javascript
async function listarDespesas() {
  // 1. Fazer login
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: 'usuario@email.com',
    password: 'senha123'
  })

  if (!session) {
    console.error('Erro ao fazer login')
    return
  }

  const token = session.access_token
  const userId = session.user.id

  // 2. Fazer requisição autenticada
  const response = await fetch(
    `https://financa-codigo.vercel.app/api/expenses?user_id=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  const data = await response.json()
  console.log('Despesas:', data)
}
```

### Exemplo 2: Criar Despesa com Autenticação

```javascript
async function criarDespesa() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('Usuário não autenticado')
    return
  }

  const response = await fetch(
    'https://financa-codigo.vercel.app/api/expenses',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: session.user.id,
        amount: 150.50,
        description: 'Supermercado',
        expense_date: '2026-03-09',
        is_paid: true
      })
    }
  )

  const data = await response.json()
  console.log('Despesa criada:', data)
}
```

### Exemplo 3: Python com Autenticação

```python
import requests
from supabase import create_client, Client

# Configurar Supabase
supabase: Client = create_client(
    "https://vpjaheorjvviysznxtpv.supabase.co",
    "sua-anon-key"
)

# Fazer login
auth_response = supabase.auth.sign_in_with_password({
    "email": "usuario@email.com",
    "password": "senha123"
})

token = auth_response.session.access_token
user_id = auth_response.user.id

# Fazer requisição autenticada
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Listar despesas
response = requests.get(
    f"https://financa-codigo.vercel.app/api/expenses?user_id={user_id}",
    headers=headers
)

print(response.json())

# Criar despesa
nova_despesa = {
    "user_id": user_id,
    "amount": 99.90,
    "description": "Teste Python",
    "expense_date": "2026-03-09",
    "is_paid": True
}

response = requests.post(
    "https://financa-codigo.vercel.app/api/expenses",
    headers=headers,
    json=nova_despesa
)

print(response.json())
```

---

## 🚨 Códigos de Erro

### 401 Unauthorized

**Causa:** Token ausente, inválido ou expirado

**Resposta:**
```json
{
  "error": "Token de autenticação não fornecido"
}
```
ou
```json
{
  "error": "Token inválido ou expirado"
}
```

**Solução:**
- Verifique se está enviando o header `Authorization: Bearer <token>`
- Faça login novamente para obter um novo token
- Verifique se o token não expirou

### 403 Forbidden

**Causa:** Usuário tentando acessar dados de outro usuário

**Resposta:**
```json
{
  "error": "Você não tem permissão para acessar estes dados"
}
```

**Solução:**
- Certifique-se de que o `user_id` na requisição é o mesmo do usuário autenticado
- Não tente acessar dados de outros usuários

---

## 🔄 Renovação de Token

Tokens JWT expiram após um período. Para renovar:

```javascript
// Verificar e renovar sessão
const { data: { session }, error } = await supabase.auth.refreshSession()

if (session) {
  const novoToken = session.access_token
  // Use o novo token nas próximas requisições
}
```

---

## 🧪 Testando com Autenticação

### Script de Teste PowerShell

```powershell
# 1. Obter token (substitua com suas credenciais)
$loginBody = @{
    email = "usuario@email.com"
    password = "senha123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod `
  -Uri "https://vpjaheorjvviysznxtpv.supabase.co/auth/v1/token?grant_type=password" `
  -Method Post `
  -Body $loginBody `
  -ContentType "application/json" `
  -Headers @{ "apikey" = "sua-anon-key" }

$token = $loginResponse.access_token
$userId = $loginResponse.user.id

# 2. Testar API com token
$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-RestMethod `
  -Uri "https://financa-codigo.vercel.app/api/expenses?user_id=$userId" `
  -Headers $headers

$response | ConvertTo-Json -Depth 5
```

---

## 💡 Boas Práticas

1. **Nunca exponha o token:** Não commite tokens no Git ou compartilhe publicamente
2. **Use HTTPS:** Sempre use conexões seguras em produção
3. **Armazene com segurança:** Use variáveis de ambiente ou armazenamento seguro
4. **Renove tokens:** Implemente renovação automática de tokens
5. **Trate erros:** Sempre verifique se o token é válido antes de fazer requisições
6. **Logout:** Limpe tokens ao fazer logout

---

## 🔧 Configuração para Desenvolvimento

### Desabilitar Autenticação (Apenas Dev)

Se precisar testar sem autenticação durante desenvolvimento, você pode criar uma variável de ambiente:

```env
# .env.local
DISABLE_API_AUTH=true  # NUNCA use em produção!
```

E modificar o middleware:

```typescript
// src/lib/apiAuth.ts
export async function authenticateRequest(request: NextRequest) {
  // Apenas para desenvolvimento
  if (process.env.DISABLE_API_AUTH === 'true') {
    return { authenticated: true, userId: 'dev-user-id' }
  }
  
  // Código normal de autenticação...
}
```

⚠️ **ATENÇÃO:** Nunca use isso em produção!

---

## 📚 Recursos Adicionais

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **JWT.io:** https://jwt.io/ (para debugar tokens)
- **API Documentation:** `API_DOCUMENTATION.md`

---

## ✅ Checklist de Implementação

- [x] Middleware de autenticação criado
- [x] Validação de token JWT
- [x] Verificação de autorização (user_id)
- [x] Tratamento de erros 401/403
- [ ] Aplicar em todas as rotas de API
- [ ] Documentar para equipe
- [ ] Testar com aplicação de IA
- [ ] Implementar rate limiting (opcional)
- [ ] Adicionar logs de auditoria (opcional)
