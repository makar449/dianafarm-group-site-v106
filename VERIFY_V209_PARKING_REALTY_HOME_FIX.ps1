$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$parking = Get-Content -Raw -Encoding UTF8 'parking.html'
$realestate = Get-Content -Raw -Encoding UTF8 'real-estate.html'
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$checks = @()
$checks += @{Name='v209 css marker'; Ok=($css -match 'v209 — parking card alignment')}
$checks += @{Name='parking aligned grid'; Ok=($css -match 'body\[data-page="parking"\] \.object-grid--v9\{' -and $css -match 'grid-auto-rows:1fr!important' -and $css -match 'grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important')}
$checks += @{Name='real-estate premium proof'; Ok=($css -match 'body\[data-page="real-estate"\] \.v10-page-proof__grid\{' -and $css -match 'border-radius:34px!important' -and $css -match 'body\[data-page="real-estate"\] \.v10-page-proof__icon\{')}
$checks += @{Name='home step 04 enlarged'; Ok=($css -match 'body\[data-page="home"\] \.v9-home-process article:nth-child\(4\)' -and $css -match 'min-height:192px!important')}
$checks += @{Name='cache bust 209'; Ok=($index -match 'styles.css\?v=209' -and $parking -match 'styles.css\?v=209' -and $realestate -match 'styles.css\?v=209')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v209 checks passed" -ForegroundColor Green
