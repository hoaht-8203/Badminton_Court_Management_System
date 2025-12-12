# PowerShell script to run tests and display pass/fail summary

Write-Host "Running tests..." -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Run tests and capture output
$testOutput = dotnet test Tests/Tests.csproj --verbosity normal 2>&1 | Out-String

# Extract summary using regex
$totalMatch = [regex]::Match($testOutput, "Total tests:\s+(\d+)")
$passedMatch = [regex]::Match($testOutput, "Passed:\s+(\d+)")
$failedMatch = [regex]::Match($testOutput, "Failed:\s+(\d+)")

$total = if ($totalMatch.Success) { $totalMatch.Groups[1].Value } else { "0" }
$passed = if ($passedMatch.Success) { $passedMatch.Groups[1].Value } else { "0" }
$failed = if ($failedMatch.Success) { $failedMatch.Groups[1].Value } else { "0" }

# Display results
Write-Host ""
Write-Host "====================" -ForegroundColor Green
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "Total tests:  $total" -ForegroundColor White
Write-Host "Passed:       $passed" -ForegroundColor Green
Write-Host "Failed:       $failed" -ForegroundColor $(if ([int]$failed -gt 0) { "Red" } else { "Green" })
Write-Host "====================" -ForegroundColor Green

# Calculate percentage
if ([int]$total -gt 0) {
    $percentage = [math]::Round([int]$passed * 100.0 / [int]$total, 2)
    Write-Host "Pass rate:    ${percentage}%" -ForegroundColor $(if ($percentage -ge 90) { "Green" } elseif ($percentage -ge 70) { "Yellow" } else { "Red" })
    Write-Host "====================" -ForegroundColor Green
}

# Show failed tests
if ([int]$failed -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $failedTests = $testOutput | Select-String "Failed FUNC" | ForEach-Object { $_.Line }
    $failedTests | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}

