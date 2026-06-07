$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$real = Get-Content -Raw -Encoding UTF8 'real-estate.html'
$checks = @()
$checks += @{Name='v213 css marker'; Ok=($css -match 'v213 — compact premium real-estate proof panel')}
$checks += @{Name='compact real estate proof grid'; Ok=($css -match 'max-width:1120px!important' -and $css -match 'min-height:0!important' -and $css -match 'min-height:96px!important')}
$checks += @{Name='no huge empty row style active in final override'; Ok=($css -match 'grid-auto-rows:auto!important')}
$checks += @{Name='cache bust 213'; Ok=($real -match 'styles.css\?v=213')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v213 checks passed" -ForegroundColor Green
