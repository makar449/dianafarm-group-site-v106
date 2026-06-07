$ErrorActionPreference = "Stop"
$root = Get-Location
$page = Join-Path $root "service-international-trade.html"
$css = Join-Path $root "assets\css\styles.css"
$js = Join-Path $root "assets\js\dg-trade-globe-v191.js"

$checks = @(
  @{Name="trade page exists"; Ok=(Test-Path $page)},
  @{Name="stage in trade HTML"; Ok=((Get-Content $page -Raw) -match "data-dg-trade-globe-stage")},
  @{Name="canvas in trade HTML"; Ok=((Get-Content $page -Raw) -match "data-dg-trade-globe-canvas")},
  @{Name="external JS connected"; Ok=((Get-Content $page -Raw) -match "dg-trade-globe-v191\.js\?v=191")},
  @{Name="old hero canvas removed from trade"; Ok=(-not ((Get-Content $page -Raw) -match "hero-3d-canvas"))},
  @{Name="CSS stage rules exist"; Ok=((Get-Content $css -Raw) -match "dg-trade-globe-stage")},
  @{Name="JS file exists"; Ok=(Test-Path $js)},
  @{Name="JS uses canvas 2d"; Ok=((Get-Content $js -Raw) -match "getContext\('2d'")},
  @{Name="JS uses requestAnimationFrame"; Ok=((Get-Content $js -Raw) -match "requestAnimationFrame")},
  @{Name="JS exposes debug object"; Ok=((Get-Content $js -Raw) -match "DG_TRADE_GLOBE_V191")}
)

$passed = 0
foreach($c in $checks){
  if($c.Ok){ Write-Host "OK  - $($c.Name)"; $passed++ }
  else { Write-Host "FAIL- $($c.Name)" }
}
Write-Host "RESULT: $passed / $($checks.Count) checks passed for v191 trade canvas globe"
if($passed -ne $checks.Count){ exit 1 }
