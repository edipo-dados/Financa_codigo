# Como Adicionar Despesa com Categoria via API

## 📋 Passo a Passo

### 1. Buscar Categorias Disponíveis

Primeiro, liste as categorias para pegar o `category_id`:

```bash
GET https://financa-codigo.vercel.app/api/expenses?user_id=SEU_USER_ID
```

Ou consulte diretamente no Supabase:
```bash
curl "https://vpjaheorjvviysznxtpv.supabase.co/rest/v1/expense_categories?select=id,name" \
  -H "apikey: SUA_KEY"
```

### 2. Criar Despesa com Categoria

**Endpoint:** `POST /api/expenses`

**Body JSON:**
```json
{
  "user_id": "fcb0a317-8b99-45e0-8b91-fc3e08730c97",
  "amount": 150.50,
  "description": "Consulta médica",
  "expense_date": "2026-03-13",
  "category_id": "32cd4109-c335-44b9-ba51-cc7ef70d5f0c",
  "payment_method": "Cartão de Débito",
  "is_paid": true
}
```

**Campos:**
- `user_id` (obrigatório) - ID do usuário
- `amount` (obrigatório) - Valor da despesa
- `description` (obrigatório) - Descrição
- `expense_date` (obrigatório) - Data (YYYY-MM-DD)
- `category_id` (opcional) - ID da categoria
- `member_id` (opcional) - ID do membro da família
- `payment_method` (opcional) - Forma de pagamento
- `is_paid` (opcional) - Se já foi paga (default: false)

### 3. Exemplo Completo com PowerShell

```powershell
$body = @{
    user_id = "fcb0a317-8b99-45e0-8b91-fc3e08730c97"
    amount = 150.50
    description = "Consulta médica"
    expense_date = "2026-03-13"
    category_id = "32cd4109-c335-44b9-ba51-cc7ef70d5f0c"
    payment_method = "Cartão de Débito"
    is_paid = $true
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "https://financa-codigo.vercel.app/api/expenses" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Despesa criada com sucesso!" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5
```

### 4. Exemplo com cURL

```bash
curl -X POST "https://financa-codigo.vercel.app/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fcb0a317-8b99-45e0-8b91-fc3e08730c97",
    "amount": 150.50,
    "description": "Consulta médica",
    "expense_date": "2026-03-13",
    "category_id": "32cd4109-c335-44b9-ba51-cc7ef70d5f0c",
    "payment_method": "Cartão de Débito",
    "is_paid": true
  }'
```

## 📊 Categorias Disponíveis (Exemplo)

| ID | Nome |
|----|------|
| 32cd4109-c335-44b9-ba51-cc7ef70d5f0c | Saúde |
| d5067f26-e4ec-44ce-9526-92f9b5774941 | Presente |
| 77f68a64-42fa-40c9-92f5-c9797b0d3286 | Pets |
| a54d4d68-51d2-482f-b693-4f1dd68952fd | Moto |
| ccd53438-bf6c-4fc6-ba0e-8ffcd1983c45 | Lazer e Hobbies |
| 49554cb8-8822-4981-904d-20b636aed5a1 | Estética |
| 10648186-b13d-4457-90cf-2a8e99938e8e | Educação |
| 5a814ba9-7ec3-4f83-ab34-823dd73fc6ea | Casa |
| 735df890-beeb-459a-b42c-79dd7a582888 | Carro |
| f9ceaf48-91ce-445b-a72a-64cd972aa2e4 | Assinaturas |

## ✅ Response Esperado

```json
{
  "success": true,
  "data": {
    "id": "uuid-da-despesa",
    "user_id": "fcb0a317-8b99-45e0-8b91-fc3e08730c97",
    "amount": 150.50,
    "description": "Consulta médica",
    "expense_date": "2026-03-13",
    "category_id": "32cd4109-c335-44b9-ba51-cc7ef70d5f0c",
    "payment_method": "Cartão de Débito",
    "is_paid": true,
    "created_at": "2026-03-13T10:00:00Z"
  }
}
```

## 💡 Dicas para IA

Quando a IA for criar uma despesa:

1. **Identificar a categoria** baseada na descrição:
   - "Consulta médica" → Saúde
   - "Ração do cachorro" → Pets
   - "Netflix" → Assinaturas
   - "Gasolina" → Carro

2. **Buscar o category_id** correspondente

3. **Criar a despesa** incluindo o `category_id` no body

4. **Exemplo de prompt para IA:**
   > "Cadastre uma despesa de R$ 150,50 para consulta médica no dia 13/03/2026, categoria Saúde, já paga com cartão de débito"

   A IA deve:
   - Identificar categoria: Saúde
   - Buscar category_id da categoria Saúde
   - Criar despesa com todos os campos
