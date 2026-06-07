$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$real = Get-Content -Raw -Encoding UTF8 'real-estate.html'
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$checks = @()
$checks += @{Name='v211 css marker'; Ok=($css -match 'v211 — lift every hero')}
$checks += @{Name='heroes lifted globally'; Ok=($css -match 'padding-top:clamp\(34px,3.2vw,48px\)!important' -and $css -match 'min-height:auto!important')}
$checks += @{Name='sections lifted globally'; Ok=($css -match 'html body \.section,' -and $css -match 'padding-top:clamp\(34px,3.6vw,56px\)!important')}
$checks += @{Name='realty proof fills width'; Ok=($css -match 'body\[data-page="real-estate"\] \.v10-page-proof__grid\{' -and $css -match 'grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important' -and $css -match 'width:100%!important')}
$checks += @{Name='realty proof overlap protection'; Ok=($css -match 'v10-page-proof__item span:not\(\.v10-page-proof__icon\)' -and $css -match 'hyphens:none!important')}
$checks += @{Name='double blog marquee still present'; Ok=($blog -match 'wow-marquee__line--a' -and $blog -match 'wow-marquee__line--b')}
$checks += @{Name='cache bust 211 main pages'; Ok=($real -match 'styles.css\?v=211' -and $index -match 'styles.css\?v=211' -and $blog -match 'styles.css\?v=211')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v211 checks passed" -ForegroundColor Green
