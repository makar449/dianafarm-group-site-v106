
$ErrorActionPreference = "Stop"
$page = ".\service-international-trade.html"
$js = ".\assets\js\dg-trade-globe-v192.js"
$ok = 0
$checks = @(
  @{Name="HTML page exists"; Pass=(Test-Path $page)},
  @{Name="External JS exists"; Pass=(Test-Path $js)},
  @{Name="HTML has v192 root"; Pass=((Select-String -Path $page -Pattern 'id="dgTradeV192Root"' -Quiet))},
  @{Name="HTML has canvas"; Pass=((Select-String -Path $page -Pattern 'dgTradeGlobeCanvasV192' -Quiet))},
  @{Name="HTML has critical inline CSS"; Pass=((Select-String -Path $page -Pattern 'dg-trade-v192-critical-css' -Quiet))},
  @{Name="HTML loads external v192 JS"; Pass=((Select-String -Path $page -Pattern 'dg-trade-globe-v192.js\?v=192' -Quiet))},
  @{Name="JS is self-mounting"; Pass=((Select-String -Path $js -Pattern 'ensureScene' -Quiet))},
  @{Name="JS sets inline styles"; Pass=((Select-String -Path $js -Pattern 'setImportant' -Quiet))},
  @{Name="JS exposes runtime debug object"; Pass=((Select-String -Path $js -Pattern 'DG_TRADE_GLOBE_V192' -Quiet))},
  @{Name="No old v191 trade script reference"; Pass=(!(Select-String -Path $page -Pattern 'dg-trade-globe-v191.js' -Quiet))}
)
foreach($c in $checks){ if($c.Pass){ Write-Host "OK  - $($c.Name)"; $ok++ } else { Write-Host "FAIL- $($c.Name)" } }
Write-Host "RESULT: $ok / $($checks.Count) checks passed for v192 trade canvas external JS globe"
if($ok -ne $checks.Count){ exit 1 }
