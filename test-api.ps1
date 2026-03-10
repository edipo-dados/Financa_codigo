# Script de Teste das APIs
# Execute: .\test-api.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TESTE DAS APIs - Sistema Financeiro" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$BASE_URL = "http://localhost:3000/api"
$USER_ID = Read-Host "Digite seu USER_ID do Supabase"

if ([string]::IsNullOrWhiteSpace($USER_ID)) {
    Write-Host "❌ USER_ID é obrigatório!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Usando BASE_URL: $BASE_URL" -ForegroundColor Yellow
Write-Host "👤 USER_ID: $USER_ID" -ForegroundColor Yellow
Write-Host ""

# Função para exibir resposta
function Show-Response {
    param($title, $response)
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
}

# Teste 1: Listar Despesas
try {
    Write-Host "📋 Teste 1: Listando despesas..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$BASE_URL/expenses?user_id=$USER_ID" -Method Get
    Show-Response "Despesas Listadas" $response
    Write-Host "✅ Teste 1: PASSOU" -ForegroundColor Green
} catch {
    Write-Host "❌ Teste 1: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Criar Despesa
try {
    Write-Host "➕ Teste 2: Criando nova despesa..." -ForegroundColor Cyan
    $body = @{
        user_id = $USER_ID
        amount = 99.90
        description = "Teste API PowerShell - $(Get-Date -Format 'HH:mm:ss')"
        expense_date = (Get-Date -Format "yyyy-MM-dd")
        payment_method = "Teste"
        is_paid = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/expenses" -Method Post -Body $body -ContentType "application/json"
    Show-Response "Despesa Criada" $response
    $EXPENSE_ID = $response.data.id
    Write-Host "✅ Teste 2: PASSOU (ID: $EXPENSE_ID)" -ForegroundColor Green
} catch {
    Write-Host "❌ Teste 2: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
    $EXPENSE_ID = $null
}

# Teste 3: Buscar Despesa por ID
if ($EXPENSE_ID) {
    try {
        Write-Host "🔍 Teste 3: Buscando despesa por ID..." -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri "$BASE_URL/expenses/$EXPENSE_ID" -Method Get
        Show-Response "Despesa Encontrada" $response
        Write-Host "✅ Teste 3: PASSOU" -ForegroundColor Green
    } catch {
        Write-Host "❌ Teste 3: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 4: Atualizar Despesa
if ($EXPENSE_ID) {
    try {
        Write-Host "✏️ Teste 4: Atualizando despesa..." -ForegroundColor Cyan
        $body = @{
            amount = 150.00
            description = "Despesa Atualizada via API - $(Get-Date -Format 'HH:mm:ss')"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BASE_URL/expenses/$EXPENSE_ID" -Method Patch -Body $body -ContentType "application/json"
        Show-Response "Despesa Atualizada" $response
        Write-Host "✅ Teste 4: PASSOU" -ForegroundColor Green
    } catch {
        Write-Host "❌ Teste 4: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Listar Receitas
try {
    Write-Host "💰 Teste 5: Listando receitas..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$BASE_URL/incomes?user_id=$USER_ID" -Method Get
    Show-Response "Receitas Listadas" $response
    Write-Host "✅ Teste 5: PASSOU" -ForegroundColor Green
} catch {
    Write-Host "❌ Teste 5: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 6: Criar Receita
try {
    Write-Host "➕ Teste 6: Criando nova receita..." -ForegroundColor Cyan
    $body = @{
        user_id = $USER_ID
        amount = 1000.00
        description = "Teste API Receita - $(Get-Date -Format 'HH:mm:ss')"
        income_date = (Get-Date -Format "yyyy-MM-dd")
        source = "Teste PowerShell"
        is_paid = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/incomes" -Method Post -Body $body -ContentType "application/json"
    Show-Response "Receita Criada" $response
    $INCOME_ID = $response.data.id
    Write-Host "✅ Teste 6: PASSOU (ID: $INCOME_ID)" -ForegroundColor Green
} catch {
    Write-Host "❌ Teste 6: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
    $INCOME_ID = $null
}

# Teste 7: Resumo Financeiro
try {
    Write-Host "📊 Teste 7: Buscando resumo financeiro..." -ForegroundColor Cyan
    $startDate = (Get-Date).ToString("yyyy-MM-01")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$BASE_URL/summary?user_id=$USER_ID&start_date=$startDate&end_date=$endDate" -Method Get
    Show-Response "Resumo Financeiro" $response
    Write-Host "✅ Teste 7: PASSOU" -ForegroundColor Green
} catch {
    Write-Host "❌ Teste 7: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 8: Excluir Despesa
if ($EXPENSE_ID) {
    $confirm = Read-Host "Deseja excluir a despesa de teste criada? (S/N)"
    if ($confirm -eq "S" -or $confirm -eq "s") {
        try {
            Write-Host "🗑️ Teste 8: Excluindo despesa..." -ForegroundColor Cyan
            $response = Invoke-RestMethod -Uri "$BASE_URL/expenses/$EXPENSE_ID" -Method Delete
            Show-Response "Despesa Excluída" $response
            Write-Host "✅ Teste 8: PASSOU" -ForegroundColor Green
        } catch {
            Write-Host "❌ Teste 8: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Teste 9: Excluir Receita
if ($INCOME_ID) {
    $confirm = Read-Host "Deseja excluir a receita de teste criada? (S/N)"
    if ($confirm -eq "S" -or $confirm -eq "s") {
        try {
            Write-Host "🗑️ Teste 9: Excluindo receita..." -ForegroundColor Cyan
            $response = Invoke-RestMethod -Uri "$BASE_URL/incomes/$INCOME_ID" -Method Delete
            Show-Response "Receita Excluída" $response
            Write-Host "✅ Teste 9: PASSOU" -ForegroundColor Green
        } catch {
            Write-Host "❌ Teste 9: FALHOU - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TESTES CONCLUÍDOS!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Dica: Para testar em produção, altere a variável BASE_URL no script" -ForegroundColor Yellow
Write-Host "📚 Consulte TESTAR_APIS.md para mais exemplos" -ForegroundColor Yellow
