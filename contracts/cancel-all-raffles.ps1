# Cancel All Active Raffles Script
# Uses admin_force_cancel to cancel all raffles with STATUS_LISTED (1)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cancel All Active Raffles" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PROFILE = "mome-v5-new"
$APTOS = ".\aptos.exe"
$REST_URL = "https://testnet.movementnetwork.xyz/v1"

# Contract address (admin/store address)
$STORE_ADDRESS = "0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3"
$MODULE = "momeraffle"

# Status constants
$STATUS_LISTED = 1

Write-Host "`n[1/3] Getting total raffle count..." -ForegroundColor Yellow

# Get raffle count using view function
$viewPayload = @{
    function = "$STORE_ADDRESS::${MODULE}::get_raffle_count"
    type_arguments = @()
    arguments = @($STORE_ADDRESS)
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "$REST_URL/view" -Method Post -Body $viewPayload -ContentType "application/json"
$raffleCount = [int]$response[0]

Write-Host "   Total raffles: $raffleCount" -ForegroundColor White

if ($raffleCount -eq 0) {
    Write-Host "`nNo raffles found. Nothing to cancel." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[2/3] Checking raffle statuses..." -ForegroundColor Yellow

$activeraffles = @()

for ($i = 0; $i -lt $raffleCount; $i++) {
    # Get raffle info
    $viewPayload = @{
        function = "$STORE_ADDRESS::${MODULE}::get_raffle"
        type_arguments = @()
        arguments = @($STORE_ADDRESS, $i.ToString())
    } | ConvertTo-Json -Depth 10

    try {
        $raffleInfo = Invoke-RestMethod -Uri "$REST_URL/view" -Method Post -Body $viewPayload -ContentType "application/json"
        
        # Index 11 is status based on the view function return order
        $status = [int]$raffleInfo[11]
        $title = $raffleInfo[2]
        $ticketsSold = [int]$raffleInfo[7]
        
        $statusName = switch ($status) {
            1 { "LISTED" }
            2 { "RAFFLING" }
            3 { "ITEM_RAFFLED" }
            4 { "FUND_RAFFLED" }
            5 { "CANCELLED" }
            default { "UNKNOWN" }
        }
        
        Write-Host "   Raffle #$i : $title - Status: $statusName, Tickets Sold: $ticketsSold" -ForegroundColor Gray
        
        if ($status -eq $STATUS_LISTED) {
            $activeraffles += @{
                id = $i
                title = $title
                ticketsSold = $ticketsSold
            }
        }
    } catch {
        Write-Host "   Raffle #$i : Error fetching info" -ForegroundColor Red
    }
}

Write-Host "`nFound $($activeraffles.Count) active raffle(s) to cancel" -ForegroundColor White

if ($activeraffles.Count -eq 0) {
    Write-Host "`nNo active raffles to cancel." -ForegroundColor Green
    exit 0
}

Write-Host "`n[3/3] Cancelling active raffles..." -ForegroundColor Yellow

$cancelled = 0
$failed = 0

foreach ($raffle in $activeraffles) {
    $raffleId = $raffle.id
    $title = $raffle.title
    
    Write-Host "`n   Cancelling Raffle #$raffleId : $title..." -ForegroundColor White
    
    # Use admin_force_cancel
    $result = & $APTOS move run `
        --function-id "${STORE_ADDRESS}::${MODULE}::admin_force_cancel" `
        --args "address:$STORE_ADDRESS" "u64:$raffleId" "string:Admin bulk cancel" `
        --profile $PROFILE `
        --assume-yes 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Raffle #$raffleId cancelled successfully" -ForegroundColor Green
        $cancelled++
    } else {
        Write-Host "   ❌ Failed to cancel Raffle #$raffleId" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        $failed++
    }
    
    # Small delay between transactions
    Start-Sleep -Milliseconds 500
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Cancelled: $cancelled" -ForegroundColor Green
Write-Host "   Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "`nDone!" -ForegroundColor Green
