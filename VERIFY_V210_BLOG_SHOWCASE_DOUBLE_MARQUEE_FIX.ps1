$ErrorActionPreference = 'Stop'
$css  = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$checks = @()
$checks += @{Name='v210 css marker'; Ok=($css -match 'v210 — blog showcase filled')}
$checks += @{Name='double marquee in html'; Ok=($blog -match 'wow-marquee__line--a' -and $blog -match 'wow-marquee__line--b')}
$checks += @{Name='marquee visible again'; Ok=($css -match 'body\[data-page="blog"\] \.wow-marquee--blog\{' -and $css -match 'display:block!important')}
$checks += @{Name='showcase text enlarged'; Ok=($css -match 'blog-hero-showcase__lead-copy strong\{' -and $css -match 'font-size:clamp\(52px,4.1vw,76px\)!important')}
$checks += @{Name='chips 3 columns'; Ok=($css -match 'blog-hero-showcase__chips\{' -and $css -match 'grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important')}
$checks += @{Name='cache bust 210'; Ok=($blog -match 'styles.css\?v=210' -and $blog -match 'dg-premium-interface-v202.js\?v=210' -and $blog -match 'v106-i18n.js\?v=210')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v210 checks passed" -ForegroundColor Green
