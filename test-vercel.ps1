# Script de Teste das APIs no Vercel
# Execute: .\test-vercel.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TESTE DAS APIs - VERCEL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# CONFIGURE AQUI A URL DO SEU VERCEL
$VERCEL_URL = Read-Host "Digite a URL do seu Vercel (ex: https://seu-projeto.vercel.app)"
$USER_ID = "af87db96-1891-4ddb-9630-7c9e16761d15"

if ([string]::IsNullOrWhiteSpace($VERCEL_URL)) {
    Write-Host "❌ URL do Vercel é obrigatória!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Como encontrar sua URL:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Clique no seu projeto" -ForegroundColor White
    Write-Host "3. Copie a URL que aparece no topo" -ForegroundColor White
    exit
}

# Remove trailing slash se houver
$VERCEL_URL = $VERCEL_URL.TrimEnd('/')

Write-Host ""
Write-Host "🌐 URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host "👤 User ID: $USER_ID" -ForegroundColor Yellow
Write-Host ""
Write-Host "Iniciando testes..." -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Teste 1: Verificar se o site está online
Write-Host "🌐 Teste 0: Verificando se o site está online..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $VERCEL_URL -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Site está online! Status: $($response.StatusCode)" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "❌ Site não está acessível: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se a URL está correta e se o deploy foi concluído" -ForegroundColor Yellow
    $testsFailed++
    exit
}

# Teste 1: Listar Despesas
Write-Host "`n📋 Teste 1: Listando despesas..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses?user_id=$USER_ID" -Method Get -ErrorAction Stop
    Write-Host "✅ Sucesso! Total: $($response.count) despesas" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Primeira despesa: $($response.data[0].description) - R$ $($response.data[0].amount)" -ForegroundColor Yellow
    }
    $testsPassed++
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*supabaseKey*") {
        Write-Host "   💡 Configure as variáveis de ambiente no Vercel!" -ForegroundColor Yellow
        Write-Host "   Consulte: CONFIGURAR_VARIAVEIS_VERCEL.md" -ForegroundColor Yellow
    }
    $testsFailed++
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

    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    $expenseId = $response.data.id
    Write-Host "✅ Despesa criada! ID: $expenseId" -ForegroundColor Green
    Write-Host "   Descrição: $($response.data.description)" -ForegroundColor Yellow
    $testsPassed++
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $expenseId = $null
    $testsFailed++
}

# Teste 3: Buscar Despesa por ID
if ($expenseId) {
    Write-Host "`n🔍 Teste 3: Buscando despesa por ID..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Get -ErrorAction Stop
        Write-Host "✅ Despesa encontrada!" -ForegroundColor Green
        Write-Host "   Valor: R$ $($response.data.amount)" -ForegroundColor Yellow
        $testsPassed++
    } catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# Teste 4: Atualizar Despesa
if ($expenseId) {
    Write-Host "`n✏️ Teste 4: Atualizando despesa..." -ForegroundColor Cyan
    try {
        $body = @{
            amount = 150.00
            description = "Despesa Atualizada via Vercel - $(Get-Date -Format 'HH:mm:ss')"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Patch -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "✅ Despesa atualizada!" -ForegroundColor Green
        Write-Host "   Nova descrição: $($response.data.description)" -ForegroundColor Yellow
        Write-Host "   Novo valor: R$ $($response.data.amount)" -ForegroundColor Yellow
        $testsPassed++
    } catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# Teste 5: Listar Receitas
Write-Host "`n💰 Teste 5: Listando receitas..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/incomes?user_id=$USER_ID" -Method Get -ErrorAction Stop
    Write-Host "✅ Sucesso! Total: $($response.count) receitas" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Primeira receita: $($response.data[0].description) - R$ $($response.data[0].amount)" -ForegroundColor Yellow
    }
    $testsPassed++
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Teste 6: Resumo Financeiro
Write-Host "`n📊 Teste 6: Buscando resumo financeiro..." -ForegroundColor Cyan
try {
    $startDate = (Get-Date).ToString("yyyy-MM-01")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/summary?user_id=$USER_ID&start_date=$startDate&end_date=$endDate" -Method Get -ErrorAction Stop
    Write-Host "✅ Resumo obtido!" -ForegroundColor Green
    Write-Host "   Total Receitas: R$ $($response.incomes.total)" -ForegroundColor Yellow
    Write-Host "   Total Despesas: R$ $($response.expenses.total)" -ForegroundColor Yellow
    Write-Host "   Saldo Total: R$ $($response.balance.total)" -ForegroundColor Yellow
    $testsPassed++
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Teste 7: Excluir Despesa
if ($expenseId) {
    Write-Host "`n🗑️ Teste 7: Excluir despesa de teste..." -ForegroundColor Cyan
    $confirm = Read-Host "Deseja excluir a despesa de teste criada? (S/N)"
    if ($confirm -eq "S" -or $confirm -eq "s") {
        try {
            $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/expenses/$expenseId" -Method Delete -ErrorAction Stop
            Write-Host "✅ Despesa excluída com sucesso!" -ForegroundColor Green
            $testsPassed++
        } catch {
            Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "⏭️ Teste pulado pelo usuário" -ForegroundColor Yellow
    }
}

# Resumo
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Testes Passaram: $testsPassed" -ForegroundColor Green
Write-Host "❌ Testes Falharam: $testsFailed" -ForegroundColor Red
$total = $testsPassed + $testsFailed
if ($total -gt 0) {
    $percentage = [math]::Round(($testsPassed / $total) * 100, 2)
    Write-Host "📊 Taxa de Sucesso: $percentage%" -ForegroundColor Yellow
}
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 TODAS AS APIs ESTÃO FUNCIONANDO NO VERCEL!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Alguns testes falharam. Verifique:" -ForegroundColor Yellow
    Write-Host "   1. Variáveis de ambiente configuradas no Vercel" -ForegroundColor White
    Write-Host "   2. Deploy concluído com sucesso" -ForegroundColor White
    Write-Host "   3. Logs de erro no Vercel Dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Consulte: TESTAR_API_VERCEL.md para mais detalhes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
