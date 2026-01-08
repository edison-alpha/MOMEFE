# Test Movement Indexer (Hasura)
# Endpoint: https://hasura.testnet.movementnetwork.xyz/v1/graphql

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Movement Indexer (Hasura)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$INDEXER_URL = "https://hasura.testnet.movementnetwork.xyz/v1/graphql"
$CONTRACT_ADDRESS = "0x01217f04807991f49109ef548639275de9462bc565895a115f0968edbda74db3"

# Helper function
function Invoke-GraphQL {
    param([string]$Query, [string]$Name)
    
    Write-Host "`n[$Name]" -ForegroundColor Yellow
    try {
        $body = @{ query = $Query } | ConvertTo-Json -Compress
        $result = Invoke-RestMethod -Uri $INDEXER_URL -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
        return $result
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Check indexer connectivity
Write-Host "`n[1/6] Testing Indexer Connectivity..." -ForegroundColor Yellow
$query1 = 'query { __typename }'
$result1 = Invoke-GraphQL -Query $query1 -Name "Connectivity"
if ($result1) {
    Write-Host "  ✅ Indexer is reachable" -ForegroundColor Green
} else {
    Write-Host "  ❌ Indexer not reachable" -ForegroundColor Red
}

# Test 2: Get latest events (any)
Write-Host "`n[2/6] Getting Latest Events..." -ForegroundColor Yellow
$query2 = 'query { events(order_by: { transaction_version: desc }, limit: 5) { type transaction_version account_address } }'
$result2 = Invoke-GraphQL -Query $query2 -Name "Latest Events"
if ($result2 -and $result2.data.events) {
    Write-Host "  ✅ Found $($result2.data.events.Count) events" -ForegroundColor Green
    $result2.data.events | ForEach-Object {
        Write-Host "     v$($_.transaction_version) | $($_.type)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ No events found" -ForegroundColor Red
}

# Test 3: Get events from contract address
Write-Host "`n[3/6] Getting Events from Contract Address..." -ForegroundColor Yellow
$query3 = "query { events(where: { account_address: { _eq: `"$CONTRACT_ADDRESS`" } }, order_by: { transaction_version: desc }, limit: 10) { type transaction_version data } }"
$result3 = Invoke-GraphQL -Query $query3 -Name "Contract Events"
if ($result3 -and $result3.data.events) {
    Write-Host "  ✅ Found $($result3.data.events.Count) events from contract" -ForegroundColor Green
    $result3.data.events | ForEach-Object {
        Write-Host "     v$($_.transaction_version) | $($_.type)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️ No events from contract (indexer may be behind)" -ForegroundColor Yellow
}

# Test 4: Get momeraffle events specifically
Write-Host "`n[4/6] Getting momeraffle Events..." -ForegroundColor Yellow
$query4 = 'query { events(where: { type: { _like: "%momeraffle%" } }, order_by: { transaction_version: desc }, limit: 10) { type transaction_version account_address data } }'
$result4 = Invoke-GraphQL -Query $query4 -Name "momeraffle Events"
if ($result4 -and $result4.data.events -and $result4.data.events.Count -gt 0) {
    Write-Host "  ✅ Found $($result4.data.events.Count) momeraffle events" -ForegroundColor Green
    $result4.data.events | ForEach-Object {
        Write-Host "     v$($_.transaction_version) | $($_.type)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️ No momeraffle events found (indexer may be behind or down)" -ForegroundColor Yellow
}

# Test 5: Get fungible asset balances
Write-Host "`n[5/6] Testing Fungible Asset Balances Query..." -ForegroundColor Yellow
$query5 = "query { current_fungible_asset_balances(where: { owner_address: { _eq: `"$CONTRACT_ADDRESS`" } }, limit: 5) { amount asset_type owner_address } }"
$result5 = Invoke-GraphQL -Query $query5 -Name "FA Balances"
if ($result5 -and $result5.data.current_fungible_asset_balances) {
    Write-Host "  ✅ Query successful, found $($result5.data.current_fungible_asset_balances.Count) balances" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ No balances found or query failed" -ForegroundColor Yellow
}

# Test 6: Compare with blockchain data
Write-Host "`n[6/6] Comparing with Blockchain (RPC)..." -ForegroundColor Yellow
try {
    $rpcUrl = "https://testnet.movementnetwork.xyz/v1/accounts/$CONTRACT_ADDRESS/transactions?limit=5"
    $txs = Invoke-RestMethod -Uri $rpcUrl -TimeoutSec 30
    Write-Host "  Blockchain transactions:" -ForegroundColor Cyan
    $txs | ForEach-Object {
        $func = if ($_.payload.function) { $_.payload.function } else { "N/A" }
        Write-Host "     v$($_.version) | $func" -ForegroundColor Gray
    }
    
    if ($txs.Count -gt 0) {
        $latestVersion = $txs[0].version
        Write-Host "`n  Latest contract tx version: $latestVersion" -ForegroundColor Cyan
        
        # Check if indexer has this version
        $checkQuery = "query { events(where: { transaction_version: { _eq: `"$latestVersion`" } }, limit: 1) { type transaction_version } }"
        $checkResult = Invoke-GraphQL -Query $checkQuery -Name "Version Check"
        if ($checkResult -and $checkResult.data.events -and $checkResult.data.events.Count -gt 0) {
            Write-Host "  ✅ Indexer has latest transaction" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Indexer does NOT have latest transaction (behind or down)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nIndexer URL: $INDEXER_URL" -ForegroundColor White
Write-Host "Contract: $CONTRACT_ADDRESS" -ForegroundColor White
