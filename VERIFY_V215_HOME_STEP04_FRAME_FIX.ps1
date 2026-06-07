$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$checks = @()
$checks += @{Name='v215 marker'; Ok=($css -match 'v215 — urgent home process step 04 frame fix')}
$checks += @{Name='step 04 larger column'; Ok=($css -match 'minmax\(330px,1.55fr\)')}
$checks += @{Name='step 04 min width'; Ok=($css -match 'article:nth-child\(4\)\{' -and $css -match 'min-width:330px!important')}
$checks += @{Name='step 04 title nowrap'; Ok=($css -match 'white-space:nowrap!important')}
$checks += @{Name='cache bust 215'; Ok=($index -match 'styles.css\?v=215' -and $index -match 'dg-premium-interface-v202.js\?v=215' -and $index -match 'v106-i18n.js\?v=215')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v215 checks passed" -ForegroundColor Green
