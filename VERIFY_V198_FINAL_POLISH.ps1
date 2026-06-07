$ErrorActionPreference = 'Stop'
$pages = @(
  @{File='service-international-trade.html'; Js='dg-trade-globe-v198.js?v=198'; Marker='dg-trade-v198-critical-css'},
  @{File='service-nostrification.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-pharma-consulting.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-cosmetics-registration.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-supplements-registration.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-banks-accounts.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-company-registration.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'},
  @{File='service-residence-bulgaria.html'; Js='dg-service-scenes-v198.js?v=198'; Marker='dg-pro-scenes-v198-critical-css'}
)
$passed = 0
foreach ($p in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $p.File
  $checks = @(
    ($html -match [regex]::Escape($p.Js)),
    ($html -match $p.Marker),
    ($html -match 'styles.css\?v=198')
  )
  if (-not ($checks -contains $false)) { $passed++; Write-Host "OK  $($p.File)" -ForegroundColor Green }
  else { Write-Host "BAD $($p.File)" -ForegroundColor Red; $checks }
}
$serviceJs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-service-scenes-v198.js
$tradeJs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-trade-globe-v198.js
$css = Get-Content -Raw -Encoding UTF8 .\assets\css\styles.css
$extra = @(
  ($serviceJs -match 'v198-premium-fixed-in-hero-interactive-scenes'),
  ($serviceJs -match "position:'absolute'"),
  ($serviceJs -match 'revealRoot'),
  ($tradeJs -match 'v198-trade-premium-fixed-in-hero-canvas-external-js'),
  ($tradeJs -match "position:'absolute'"),
  ($tradeJs -match 'revealRoot'),
  ($css -match '--dg-gold-v198:#D4AF37'),
  ($css -match '--dg-sun-v198:#FFD700'),
  ((Get-Content -Raw -Encoding UTF8 .\blog.html) -match 'wow-marquee__word')
)
if (-not ($extra -contains $false)) { Write-Host 'OK  v198 JS/CSS UI polish' -ForegroundColor Green } else { Write-Host 'BAD v198 JS/CSS UI polish' -ForegroundColor Red; $extra }
Write-Host "RESULT: $passed / 8 animated service pages contain v198 final polish"
if (($passed -ne 8) -or ($extra -contains $false)) { exit 1 }
