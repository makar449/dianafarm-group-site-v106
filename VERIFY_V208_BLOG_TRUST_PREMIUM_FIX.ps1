$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$checks = @()
$checks += @{Name='v208 css marker'; Ok=($css -match 'v208 — blog showcase expansion')}
$checks += @{Name='blog marquee hidden'; Ok=($css -match 'body\[data-page="blog"\] \.wow-marquee--blog\{' -and $css -match 'display:none!important')}
$checks += @{Name='blog showcase expanded'; Ok=($css -match 'blog-hero-showcase--textonly \.blog-hero-showcase__lead' -and $css -match 'padding:clamp\(28px,3vw,40px\)' -and $css -match 'max-width:min\(100%,820px\)')}
$checks += @{Name='blog text typo fixed'; Ok=($blog -match 'банках, контактах')}
$checks += @{Name='home trust premium spacing'; Ok=($css -match 'body\[data-page="home"\] \.hero__trust-panel \.hero-feature\{' -and $css -match 'grid-template-columns:86px minmax\(0,1fr\)' -and $css -match 'padding:24px 28px')}
$checks += @{Name='cache bust 208'; Ok=($index -match 'styles.css\?v=208' -and $index -match 'v106-i18n.js\?v=208' -and $index -match 'dg-premium-interface-v202.js\?v=208')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v208 checks passed" -ForegroundColor Green
