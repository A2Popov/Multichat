# Скрипт для проверки работы Arena на production
# После перезапуска туннеля Cloudepub

Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ПРОВЕРКА ARENA НА PRODUCTION" -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

$productionUrl = "https://wrongfully-suited-jaybird.cloudpub.ru"

Write-Host "`n1. Проверка доступности сайта..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$productionUrl/api/health" -TimeoutSec 10
    Write-Host "   ✓ Сайт доступен" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Сайт недоступен: $_" -ForegroundColor Red
    Write-Host "`n   Проверьте, что туннель Cloudepub запущен!" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Авторизация..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json
    
    $token = (Invoke-RestMethod -Uri "$productionUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10).access_token
    Write-Host "   ✓ Авторизация успешна" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Ошибка авторизации: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Тестирование Arena Battle (3 модели)..." -ForegroundColor Yellow
try {
    $arenaBody = @{
        prompt = "Привет! Скажи привет одним словом."
        models = @("gpt-5.2", "claude-opus-4.5", "gemini-3-pro")
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$productionUrl/api/arena/compare" -Method POST -Headers @{Authorization="Bearer $token"} -Body $arenaBody -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "`n   Результаты:" -ForegroundColor Cyan
    $hasErrors = $false
    
    foreach ($response in $result.responses) {
        if ($response.error) {
            Write-Host "   ✗ $($response.model): ОШИБКА" -ForegroundColor Red
            Write-Host "     $($response.error)" -ForegroundColor Yellow
            $hasErrors = $true
        } else {
            $shortResponse = if ($response.response.Length -gt 50) { 
                $response.response.Substring(0, 50) + "..." 
            } else { 
                $response.response 
            }
            Write-Host "   ✓ $($response.model): $shortResponse" -ForegroundColor Green
        }
    }
    
    Write-Host "`n   Стоимость: `$$([math]::Round($result.total_cost, 6))" -ForegroundColor Cyan
    
    if (-not $hasErrors) {
        Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✓✓✓ ВСЕ РАБОТАЕТ! ✓✓✓" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "  Arena Battle на production без ошибок!" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "════════════════════════════════════════════════" -ForegroundColor Green
    } else {
        Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "  ⚠ ЕСТЬ ОШИБКИ" -ForegroundColor White -BackgroundColor DarkRed
        Write-Host "  Некоторые модели вернули ошибки" -ForegroundColor White -BackgroundColor DarkRed
        Write-Host "════════════════════════════════════════════════" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Ошибка тестирования Arena: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Детали: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "`n✓ Проверка завершена!" -ForegroundColor Green
Write-Host "Сайт: $productionUrl" -ForegroundColor Cyan
