# 🌐 Como Testar APIs no Vercel

## 📍 Passo 1: Descobrir a URL do Vercel

### Opção A: Pelo Dashboard do Vercel
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto
3. Copie a URL que aparece no topo (ex: `https://seu-projeto.vercel.app`)

### Opção B: Pelo Git
Se você configurou o Vercel para fazer deploy automático:
1. Vá no seu repositório GitHub: https://github.com/edipo-dados/Financa_codigo
2. Procure pelo badge do Vercel ou link de deploy
3. Ou verifique na aba "Environments" do GitHub

### Opção C: Verificar Último Deploy
```powershell
# Se você tem o Vercel CLI instalado
vercel ls
```

---

## 🧪 Passo 2: Testar as APIs

### Teste Rápido no Navegador

Substitua `SEU_DOMINIO` pela URL do seu Vercel:

```
https://SEU_DOMINIO.vercel.app/api/expenses?user_id=af87db96-1891-4ddb-9630-7c9e16761d15
```

Se retornar JSON com suas despesas, está funcionando! ✅

---

## 🔧 Teste Completo com PowerShell

Salve este script como `test-vercel.ps1`:

```powershell
# Configure sua URL do Vercel aqui
$VERCEL_URL = "https://SEU_DOMINIO.vercel.app"
$USER_ID = "af87db96-1891-4ddb-9630-7c9e16761d15"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TESTE DAS APIs - VERCEL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host "👤 User ID: $USER_ID" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Listar Despesas
Write-Host "📋 Teste 1: Listando despesas..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses?user_id=$USER_ID" -Method Get
    Write-Host "✅ Sucesso! Total: $($response.count) despesas" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "Primeira despesa: $($response.data[0].description) - R$ $($response.data[0].amount)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se a URL está correta e se o deploy foi concluído" -ForegroundColor Yellow
}

# Teste 2: Criar Despesa
Write-Host "`n➕ Teste 2: Criando nova despesa..." -ForegroundColor Cyan
try {
    $body = @{
        user_id = $USER_ID
        amount = 99.90
        description = "Teste API Vercel - $(Get-Date -Format 'HH:mm:ss')"
        expense_date = (Get-Date -Format "yyyy-MM-dd")
        payment_method = "Teste Vercel"
        is_paid = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses" -Method Post -Body $body -ContentType "application/json"
    $expenseId = $response.data.id
    Write-Host "✅ Despesa criada! ID: $expenseId" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $expenseId = $null
}

# Teste 3: Buscar por ID
if ($expenseId) {
    Write-Host "`n🔍 Teste 3: Buscando despesa por ID..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Get
        Write-Host "✅ Despesa encontrada! Valor: R$ $($response.data.amount)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 4: Atualizar
if ($expenseId) {
    Write-Host "`n✏️ Teste 4: Atualizando despesa..." -ForegroundColor Cyan
    try {
        $body = @{
            amount = 150.00
            description = "Atualizada via Vercel"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Patch -Body $body -ContentType "application/json"
        Write-Host "✅ Atualizada! Novo valor: R$ $($response.data.amount)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Resumo
Write-Host "`n📊 Teste 5: Resumo financeiro..." -ForegroundColor Cyan
try {
    $startDate = (Get-Date).ToString("yyyy-MM-01")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/summary?user_id=$USER_ID&start_date=$startDate&end_date=$endDate" -Method Get
    Write-Host "✅ Resumo obtido!" -ForegroundColor Green
    Write-Host "Receitas: R$ $($response.incomes.total)" -ForegroundColor Yellow
    Write-Host "Despesas: R$ $($response.expenses.total)" -ForegroundColor Yellow
    Write-Host "Saldo: R$ $($response.balance.total)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 6: Excluir
if ($expenseId) {
    $confirm = Read-Host "`nExcluir despesa de teste? (S/N)"
    if ($confirm -eq "S" -or $confirm -eq "s") {
        try {
            $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Delete
            Write-Host "✅ Despesa excluída!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  TESTES CONCLUÍDOS!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
```

Execute:
```powershell
.\test-vercel.ps1
```

---

## 🌐 Teste com cURL (Git Bash)

```bash
# Configure sua URL
VERCEL_URL="https://SEU_DOMINIO.vercel.app"
USER_ID="af87db96-1891-4ddb-9630-7c9e16761d15"

# Listar despesas
curl "$VERCEL_URL/api/expenses?user_id=$USER_ID"

# Criar despesa
curl -X POST "$VERCEL_URL/api/expenses" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"amount\": 99.90,
    \"description\": \"Teste Vercel\",
    \"expense_date\": \"2026-03-09\",
    \"is_paid\": true
  }"

# Resumo financeiro
curl "$VERCEL_URL/api/summary?user_id=$USER_ID&start_date=2026-03-01&end_date=2026-03-31"
```

---

## 🐍 Teste com Python

```python
import requests

# Configure sua URL
VERCEL_URL = "https://SEU_DOMINIO.vercel.app"
USER_ID = "af87db96-1891-4ddb-9630-7c9e16761d15"

# Teste 1: Listar despesas
print("=== Listando Despesas ===")
response = requests.get(
    f"{VERCEL_URL}/api/expenses",
    params={"user_id": USER_ID}
)
print(f"Status: {response.status_code}")
print(response.json())

# Teste 2: Criar despesa
print("\n=== Criando Despesa ===")
response = requests.post(
    f"{VERCEL_URL}/api/expenses",
    json={
        "user_id": USER_ID,
        "amount": 99.90,
        "description": "Teste Python Vercel",
        "expense_date": "2026-03-09",
        "is_paid": True
    }
)
print(f"Status: {response.status_code}")
print(response.json())

# Teste 3: Resumo
print("\n=== Resumo Financeiro ===")
response = requests.get(
    f"{VERCEL_URL}/api/summary",
    params={
        "user_id": USER_ID,
        "start_date": "2026-03-01",
        "end_date": "2026-03-31"
    }
)
print(f"Status: {response.status_code}")
print(response.json())
```

---

## 🔍 Verificar Status do Deploy

### Pelo Vercel Dashboard
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto
3. Vá em "Deployments"
4. Verifique se o último deploy está com status "Ready" ✅

### Verificar Logs de Erro
Se a API não funcionar:
1. No Vercel Dashboard, clique no deployment
2. Vá em "Functions"
3. Clique em uma das funções de API
4. Veja os logs de erro

---

## ⚠️ Troubleshooting

### Erro: "supabaseKey is required"
**Solução:** Configure as variáveis de ambiente no Vercel:
1. Vá em Settings → Environment Variables
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Faça redeploy

### Erro 404: "Not Found"
**Possíveis causas:**
- URL incorreta
- Deploy ainda não concluído
- Rota não existe

**Solução:**
- Verifique a URL no dashboard do Vercel
- Aguarde o deploy completar
- Teste a rota raiz primeiro: `https://seu-dominio.vercel.app`

### Erro 500: "Internal Server Error"
**Solução:**
- Verifique os logs no Vercel Dashboard
- Confirme que as variáveis de ambiente estão configuradas
- Verifique se o Supabase está acessível

### Erro de CORS
**Solução:**
- As APIs Next.js não têm problema de CORS por padrão
- Se necessário, adicione headers CORS nas rotas

---

## 📊 Comparação: Local vs Vercel

| Aspecto | Local | Vercel |
|---------|-------|--------|
| URL | `http://localhost:3000` | `https://seu-dominio.vercel.app` |
| Velocidade | Mais rápido | Depende da região |
| Variáveis | `.env.local` | Dashboard do Vercel |
| Logs | Terminal | Dashboard do Vercel |
| Cache | Sem cache | CDN + Edge Cache |

---

## 🎯 Checklist de Teste no Vercel

- [ ] Descobrir URL do Vercel
- [ ] Verificar se deploy está "Ready"
- [ ] Configurar variáveis de ambiente
- [ ] Testar GET /api/expenses
- [ ] Testar POST /api/expenses
- [ ] Testar GET /api/expenses/[id]
- [ ] Testar PATCH /api/expenses/[id]
- [ ] Testar DELETE /api/expenses/[id]
- [ ] Testar GET /api/incomes
- [ ] Testar POST /api/incomes
- [ ] Testar GET /api/summary
- [ ] Verificar performance
- [ ] Verificar logs de erro

---

## 💡 Dicas

1. **Use o navegador primeiro** - É a forma mais rápida de testar GET
2. **Salve a URL** - Adicione como variável de ambiente
3. **Monitore os logs** - Sempre verifique logs após testes
4. **Teste gradualmente** - Comece com GET, depois POST, etc.
5. **Use Postman** - Salve uma collection para testes recorrentes

---

## 📝 Próximos Passos

Após confirmar que as APIs funcionam no Vercel:
1. ✅ Documente a URL de produção
2. ✅ Configure rate limiting (se necessário)
3. ✅ Implemente monitoramento
4. ✅ Integre com sua aplicação de IA
5. ✅ Configure alertas de erro

---

## 🔗 Links Úteis

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs
- **API Documentation:** `API_DOCUMENTATION.md`
- **Resultado Testes Local:** `RESULTADO_TESTES_API.md`
