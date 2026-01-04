# Deploy MoME V5 - Secure Multi-Asset Raffle Contract
# Security fixes: Access control, pause mechanism, ticket limits, optimized loops

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy MoME V5 - Security Enhanced" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Wallet private key (use same as v4 or generate new)
$PRIVATE_KEY = "0x7af67a7e6d652ca0d82718c526af2d9d20e9ec7dae520db6811a639ac5f95dba"
$PROFILE = "mome-v5"
$REST_URL = "https://testnet.movementnetwork.xyz/v1"
$FAUCET_URL = "https://faucet.testnet.movementnetwork.xyz/"
$APTOS = ".\aptos-7.4.0\aptos.exe"

# Step 1: Initialize new profile with the private key
Write-Host "`n[1/4] Setting up new wallet profile..." -ForegroundColor Yellow
& $APTOS init --profile $PROFILE --private-key $PRIVATE_KEY --network custom --rest-url $REST_URL --faucet-url $FAUCET_URL --assume-yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "Profile initialization failed!" -ForegroundColor Red
    exit 1
}

# Get account address
Write-Host "`n[2/4] Getting account address..." -ForegroundColor Yellow
& $APTOS account lookup-address --profile $PROFILE

Write-Host "`n[3/4] Compiling contract..." -ForegroundColor Yellow
& $APTOS move compile --named-addresses drawraffle=$PROFILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] Publishing contract..." -ForegroundColor Yellow
& $APTOS move publish --named-addresses drawraffle=$PROFILE --profile $PROFILE --assume-yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "Publishing failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  V5 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nSecurity Fixes Applied:" -ForegroundColor White
Write-Host "  - Access control on finalize_raffle" -ForegroundColor Green
Write-Host "  - Pause mechanism for emergencies" -ForegroundColor Green
Write-Host "  - Max tickets per user limit" -ForegroundColor Green
Write-Host "  - Optimized winner selection loop" -ForegroundColor Green
Write-Host "  - Fixed double fee calculation" -ForegroundColor Green
Write-Host "  - Auto coin registration for claims" -ForegroundColor Green
Write-Host "  - String length validation" -ForegroundColor Green
Write-Host "`nNext: Run init-v5.ps1 to initialize" -ForegroundColor White
