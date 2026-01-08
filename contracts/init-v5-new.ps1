# Initialize MoME Raffle Contract - New Account

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initialize MoME Raffle - New Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PROFILE = "mome-v5-new"
$CONTRACT_ADDRESS = "0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3"
$APTOS = ".\aptos.exe"

Write-Host "`nContract Address: $CONTRACT_ADDRESS" -ForegroundColor Yellow
Write-Host "Module: momeraffle" -ForegroundColor Yellow

Write-Host "`nInitializing contract..." -ForegroundColor Yellow
& $APTOS move run `
    --function-id "${CONTRACT_ADDRESS}::momeraffle::initialize" `
    --args 'hex:6d6f6d657261666c655f736565645f32303236' `
    --profile $PROFILE `
    --assume-yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  Initialization Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nContract Address: $CONTRACT_ADDRESS" -ForegroundColor Cyan
    Write-Host "Module: momeraffle" -ForegroundColor Cyan
    Write-Host "`nUpdate these files with new address:" -ForegroundColor Yellow
    Write-Host "  - src/lib/raffle-contract.ts" -ForegroundColor White
    Write-Host "  - src/lib/raffle-contract-v5.ts" -ForegroundColor White
    Write-Host "  - backend/src/services/raffleService.ts" -ForegroundColor White
    Write-Host "  - backend/.env" -ForegroundColor White
} else {
    Write-Host "`nInitialization failed!" -ForegroundColor Red
}
