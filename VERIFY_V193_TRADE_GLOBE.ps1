$ErrorActionPreference = "Stop"

$checks = @(
  @{Path='service-international-trade.html'; Pattern='dg-trade-globe-v193.js'},
  @{Path='service-international-trade.html'; Pattern='dg-trade-globe" content="v193-fixed-body-overlay-canvas-js-pro'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='v193-trade-fixed-body-overlay-canvas-js-pro'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='dgTradeGlobeV193Root'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='dgTradeGlobeCanvasV193'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='position:fixed'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='z-index:150'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='window.DG_TRADE_GLOBE_V193'},
  @{Path='assets/js/dg-trade-globe-v193.js'; Pattern='max-width:640px'}
)

$passed = 0
foreach ($c in $checks) {
  if (!(Test-Path $c.Path)) {
    Write-Host "FAIL missing $($c.Path)" -ForegroundColor Red
    continue
  }

  $txt = Get-Content $c.Path -Raw
  if ($txt.Contains($c.Pattern)) {
    Write-Host "OK $($c.Path) :: $($c.Pattern)" -ForegroundColor Green
    $passed++
  } else {
    Write-Host "FAIL $($c.Path) :: $($c.Pattern)" -ForegroundColor Red
  }
}

Write-Host "RESULT: $passed / $($checks.Count) checks passed for v193 fixed overlay canvas globe"
if ($passed -ne $checks.Count) { exit 1 }
