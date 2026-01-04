# Initialize MoME V5 Contract

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initialize MoME V5 Contract" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PROFILE = "mome-v5"
# Contract address - same as v4 (same wallet)
$CONTRACT_ADDRESS = "0x139b57d91686291b2b07d827a84fdc6cf81a80d29a8228a941c3b11fc66c59cf"
$APTOS = ".\aptos-7.4.0\aptos.exe"

Write-Host "`nInitializing contract..." -ForegroundColor Yellow
& $APTOS move run `
    --function-id "${CONTRACT_ADDRESS}::draw_v5::initialize" `
    --args 'hex:6d6f6d655f76355f73656564' `
    --profile $PROFILE `
    --assume-yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Initialization Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nContract Address: $CONTRACT_ADDRESS" -ForegroundColor White
    Write-Host "Module: draw_v5" -ForegroundColor White
    Write-Host "`nNew Features:" -ForegroundColor Yellow
    Write-Host "  - pause_contract(admin, store_address)" -ForegroundColor White
    Write-Host "  - unpause_contract(admin, store_address)" -ForegroundColor White
    Write-Host "  - max_tickets_per_user parameter in create_raffle" -ForegroundColor White
    Write-Host "  - get_user_remaining_tickets(store, raffle_id, user)" -ForegroundColor White
    Write-Host "  - is_paused(store_address)" -ForegroundColor White
} else {
    Write-Host "`nInitialization failed!" -ForegroundColor Red
}
