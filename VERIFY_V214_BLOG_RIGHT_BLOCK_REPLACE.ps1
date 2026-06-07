$ErrorActionPreference = 'Stop'
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$checks = @()
$checks += @{Name='old showcase removed from html'; Ok=($blog -notmatch 'blog-hero-showcase blog-hero-showcase--textonly')}
$checks += @{Name='new guide block exists'; Ok=($blog -match 'blog-guide-card-v214' -and $blog -match 'Короткий маршрут по темам')}
$checks += @{Name='old showcase hidden by css'; Ok=($css -match 'blog-hero-showcase--textonly\{' -and $css -match 'display:none!important')}
$checks += @{Name='new guide css exists'; Ok=($css -match 'v214 — replace overflowing blog right panel' -and $css -match 'blog-guide-card-v214__grid')}
$checks += @{Name='cache bust 214'; Ok=($blog -match 'styles.css\?v=214' -and $blog -match 'v106-i18n.js\?v=214' -and $blog -match 'dg-premium-interface-v202.js\?v=214')}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v214 checks passed" -ForegroundColor Green
