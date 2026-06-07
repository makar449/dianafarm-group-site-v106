$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$app = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'js/app.js')
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$contacts = Get-Content -Raw -Encoding UTF8 'contacts.html'
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$checks = @()
$checks += @{Name='v212 css marker'; Ok=($css -match 'v212 — restore old double blog marquee')}
$checks += @{Name='blog has two marquee lines'; Ok=($blog -match 'wow-marquee__line--a' -and $blog -match 'wow-marquee__line--b')}
$checks += @{Name='blog grey strip removed by CSS'; Ok=($css -match 'border:0!important' -and $css -match 'background:transparent!important' -and $css -match 'box-shadow:none!important')}
$checks += @{Name='blog double marquee visible'; Ok=($css -match 'wow-marquee--blog \.wow-marquee__line--b\{' -and $css -match 'animation:v178MarqueeB 26s linear infinite!important')}
$checks += @{Name='blog showcase filled'; Ok=($css -match 'blog-hero-showcase--textonly \.blog-hero-showcase__lead' -and $css -match 'min-height:clamp\(560px,48vw,760px\)!important')}
$checks += @{Name='contacts social details closed in JS'; Ok=($app -notmatch 'contact-socials-accordion__group--\$\{esc\(group.key\)\}" open')}
$checks += @{Name='home trust transparency restored'; Ok=($css -match 'body\[data-page="home"\] \.hero__trust-panel \.hero-feature\{' -and $css -match 'background:transparent!important' -and $css -match 'grid-template-columns:74px minmax\(0,1fr\)!important')}
$checks += @{Name='cache bust 212'; Ok=($blog -match 'styles.css\?v=212' -and $blog -match 'app.js\?v=212' -and $contacts -match 'app.js\?v=212' -and $index -match 'styles.css\?v=212')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v212 checks passed" -ForegroundColor Green
