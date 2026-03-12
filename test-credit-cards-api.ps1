# Script de teste para API de Cartões de Crédito
# Testa os endpoints: GET /api/credit-cards e GET /api/credit-cards/[id]

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE DA API DE CARTÕES DE CRÉDITO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$BASE_URL = "https://financa-codigo.vercel.app"
$USER_ID = "ef006685-c5ce-4d42-aa4c-559e82171cc5"

Write-Host "Base URL: $BASE_URL" -ForegroundColor Yellow
Write-Host "User ID: $USER_ID" -ForegroundColor Yellow
Write-Host ""

# Função para fazer requisições
function Invoke-ApiTest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Description
    )
    
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Teste: $Description" -ForegroundColor Green
    Write-Host "Endpoint: $Method $Endpoint" -ForegroundColor White
    Write-Host ""
    
    try {
        $url = "$BASE_URL$Endpoint"
        $response = Invoke-RestMethod -Uri $url -Method $Method -ContentType "application/json"
        Write-Host "Sucesso!" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    }
    catch {
        Write-Host "Erro!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# TESTE 1: Listar todos os cartões
Invoke-ApiTest -Endpoint "/api/credit-cards?user_id=$USER_ID" -Description "Listar todos os cartões com faturas"

# TESTE 2: Listar cartões com fatura de março/2026
$endpoint2 = "/api/credit-cards?user_id=$USER_ID" + "&month=2026-03"
Invoke-ApiTest -Endpoint $endpoint2 -Description "Listar cartões com fatura de março/2026"

# TESTE 3: Listar apenas cartões que têm fatura em março/2026
$endpoint3 = "/api/credit-cards?user_id=$USER_ID" + "&month=2026-03&only_with_invoice=true"
Invoke-ApiTest -Endpoint $endpoint3 -Description "Listar APENAS cartões com fatura em março/2026"

# TESTE 4: Listar cartões sem informações de fatura
$endpoint4 = "/api/credit-cards?user_id=$USER_ID" + "&include_invoice=false"
Invoke-ApiTest -Endpoint $endpoint4 -Description "Listar cartões sem calcular faturas"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTES CONCLUÍDOS!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
