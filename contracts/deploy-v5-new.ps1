# Deploy MoME Raffle - Fresh Deployment to New Account
# Account: 0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy MoME Raffle - New Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# New account address
$NEW_ACCOUNT = "0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3"
$PROFILE = "mome-v5-new"
$REST_URL = "https://testnet.movementnetwork.xyz/v1"
$FAUCET_URL = "https://faucet.testnet.movementnetwork.xyz/"
$APTOS = ".\aptos.exe"

Write-Host "`nTarget Account: $NEW_ACCOUNT" -ForegroundColor Yellow

# Step 1: Initialize profile - will prompt for private key
Write-Host "`n[1/5] Setting up wallet profile..." -ForegroundColor Yellow
Write-Host "Please enter the private key for account: $NEW_ACCOUNT" -ForegroundColor Magenta

# Initialize with prompts
& $APTOS init --profile $PROFILE --network custom --rest-url $REST_URL --faucet-url $FAUCET_URL

if ($LASTEXITCODE -ne 0) {
    Write-Host "Profile initialization failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Verify account
Write-Host "`n[2/5] Verifying account..." -ForegroundColor Yellow
& $APTOS account lookup-address --profile $PROFILE

# Step 3: Check balance and fund if needed
Write-Host "`n[3/5] Checking balance..." -ForegroundColor Yellow
& $APTOS account balance --profile $PROFILE

Write-Host "`nDo you want to request faucet funds? (y/n)" -ForegroundColor Yellow
$fundChoice = Read-Host
if ($fundChoice -eq "y") {
    Write-Host "Requesting faucet funds..." -ForegroundColor Yellow
    & $APTOS account fund-with-faucet --profile $PROFILE --amount 100000000
}

# Step 4: Compile
Write-Host "`n[4/5] Compiling contract..." -ForegroundColor Yellow
& $APTOS move compile --named-addresses drawraffle=$PROFILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Publish
Write-Host "`n[5/5] Publishing contract..." -ForegroundColor Yellow
& $APTOS move publish --named-addresses drawraffle=$PROFILE --profile $PROFILE --assume-yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "Publishing failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Raffle Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nContract Address: $NEW_ACCOUNT" -ForegroundColor Cyan
Write-Host "Module: momeraffle" -ForegroundColor Cyan
Write-Host "`nNext step: Run init-v5-new.ps1 to initialize the contract" -ForegroundColor Yellow
