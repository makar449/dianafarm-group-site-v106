$ErrorActionPreference = 'Stop'
$servicePages = @(
  'service-nostrification.html',
  'service-pharma-consulting.html',
  'service-cosmetics-registration.html',
  'service-supplements-registration.html',
  'service-banks-accounts.html',
  'service-company-registration.html',
  'service-residence-bulgaria.html'
)
$passed = 0
$total = 0
foreach ($file in $servicePages) {
  $html = Get-Content -Raw -Encoding UTF8 $file
  $checks = @(
    ($html -match 'dg-pro-scenes-v201-critical-css'),
    ($html -match 'dg-service-scenes-v201.js\?v=201'),
    ($html -match 'width:380px!important'),
    ($html -match 'container-type:inline-size'),
    ($html -match 'clamp\(11px,3.1cqw,16px\)')
  )
  $total++
  if (-not ($checks -contains $false)) { $passed++; Write-Host "OK service scale $file" -ForegroundColor Green }
  else { Write-Host "BAD service scale $file" -ForegroundColor Red; $checks }
}
$trade = Get-Content -Raw -Encoding UTF8 .\service-international-trade.html
$tradeChecks = @(
  ($trade -match 'dg-trade-v201-critical-css'),
  ($trade -match 'dg-trade-globe-v201.js\?v=201'),
  ($trade -match 'width:360px!important'),
  ($trade -match 'clamp\(11px,3.1cqw,16px\)')
)
$total++
if (-not ($tradeChecks -contains $false)) { $passed++; Write-Host 'OK trade scale service-international-trade.html' -ForegroundColor Green }
else { Write-Host 'BAD trade scale service-international-trade.html' -ForegroundColor Red; $tradeChecks }
$serviceJs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-service-scenes-v201.js
$tradeJs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-trade-globe-v201.js
$jsChecks = @(
  ($serviceJs -match 'v201-proportional-safe-scale-service-scenes'),
  ($serviceJs -match 'DG_PRO_SCENES_V201'),
  ($serviceJs -match 'desired = w >= 1680 \? 470'),
  ($serviceJs -match 'gapWidth - 22'),
  ($serviceJs -match 'availableH'),
  ($serviceJs -match 'Math.min\(2.5'),
  ($tradeJs -match 'v201-proportional-safe-scale-trade-globe'),
  ($tradeJs -match 'DG_TRADE_GLOBE_V201'),
  ($tradeJs -match 'desired = w >= 1680 \? 455'),
  ($tradeJs -match 'gapWidth - 22'),
  ($tradeJs -match 'availableH'),
  ($tradeJs -match 'Math.min\(2.5')
)
if (-not ($jsChecks -contains $false)) { Write-Host 'OK JS safe-scale engines' -ForegroundColor Green }
else { Write-Host 'BAD JS safe-scale engines' -ForegroundColor Red; $jsChecks }
Write-Host "RESULT: $passed / $total pages contain v201 proportional safe-scale scenes"
if (($passed -ne $total) -or ($jsChecks -contains $false)) { exit 1 }
