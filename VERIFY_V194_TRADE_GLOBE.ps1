$ErrorActionPreference = 'Stop'
$checks = @(
  @{Path='service-international-trade.html'; Pattern='dgTradeGlobeV194Root'},
  @{Path='service-international-trade.html'; Pattern='dgTradeGlobeCanvasV194'},
  @{Path='service-international-trade.html'; Pattern='dg-trade-globe-v194.js'},
  @{Path='service-international-trade.html'; Pattern='v194-inline-root-canvas-external-js-visible'},
  @{Path='service-international-trade.html'; Pattern='z-index:999999'},
  @{Path='assets/js/dg-trade-globe-v194.js'; Pattern='v194-trade-inline-root-canvas-external-js-visible'},
  @{Path='assets/js/dg-trade-globe-v194.js'; Pattern='window.DG_TRADE_GLOBE_V194'},
  @{Path='assets/js/dg-trade-globe-v194.js'; Pattern='dgTradeGlobeCanvasV194'},
  @{Path='assets/js/dg-trade-globe-v194.js'; Pattern='requestAnimationFrame'},
  @{Path='assets/js/dg-trade-globe-v194.js'; Pattern='max-width:640px'}
)
$passed = 0
foreach ($c in $checks) {
  if (!(Test-Path $c.Path)) { Write-Host "FAIL missing $($c.Path)" -ForegroundColor Red; continue }
  $txt = Get-Content $c.Path -Raw
  if ($txt.Contains($c.Pattern)) { Write-Host "OK $($c.Path) :: $($c.Pattern)" -ForegroundColor Green; $passed++ }
  else { Write-Host "FAIL $($c.Path) :: $($c.Pattern)" -ForegroundColor Red }
}
Write-Host "RESULT: $passed / $($checks.Count) checks passed for v194 trade inline-root canvas external JS globe"
if ($passed -ne $checks.Count) { exit 1 }
