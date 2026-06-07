$ErrorActionPreference = "Stop"
$checks = @(
  @{ Path = "service-international-trade.html"; Pattern = 'dgTradeGlobeV195Root'; Label = "HTML has v195 root" },
  @{ Path = "service-international-trade.html"; Pattern = 'dgTradeGlobeV195Canvas'; Label = "HTML has v195 canvas" },
  @{ Path = "service-international-trade.html"; Pattern = 'dg-trade-globe-v195.js'; Label = "HTML links v195 external JS" },
  @{ Path = "service-international-trade.html"; Pattern = '2147483647'; Label = "HTML has maximum z-index" },
  @{ Path = "service-international-trade.html"; Pattern = 'dg-trade-v195-critical-css'; Label = "HTML has critical CSS" },
  @{ Path = "assets/js/dg-trade-globe-v195.js"; Pattern = 'v195-final-force-visible-canvas-external-js'; Label = "JS has version marker" },
  @{ Path = "assets/js/dg-trade-globe-v195.js"; Pattern = 'requestAnimationFrame'; Label = "JS animates with requestAnimationFrame" },
  @{ Path = "assets/js/dg-trade-globe-v195.js"; Pattern = 'dgTradeGlobeV195Root'; Label = "JS controls v195 root" },
  @{ Path = "assets/js/dg-trade-globe-v195.js"; Pattern = 'getContext'; Label = "JS uses canvas context" },
  @{ Path = "assets/js/dg-trade-globe-v195.js"; Pattern = 'window.DG_TRADE_GLOBE_V195'; Label = "JS exposes debug state" }
)
$passed = 0
foreach ($check in $checks) {
  if (!(Test-Path $check.Path)) { Write-Host "FAIL: $($check.Label) — missing $($check.Path)" -ForegroundColor Red; continue }
  $content = Get-Content -Raw -Encoding UTF8 $check.Path
  if ($content -match [regex]::Escape($check.Pattern)) { Write-Host "PASS: $($check.Label)" -ForegroundColor Green; $passed++ }
  else { Write-Host "FAIL: $($check.Label) — pattern not found: $($check.Pattern)" -ForegroundColor Red }
}
Write-Host "RESULT: $passed / $($checks.Count) checks passed for v195 FINAL trade globe"
if ($passed -ne $checks.Count) { exit 1 }
