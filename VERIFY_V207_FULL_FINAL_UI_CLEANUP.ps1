$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'css/styles.css')
$blog = Get-Content -Raw -Encoding UTF8 'blog.html'
$index = Get-Content -Raw -Encoding UTF8 'index.html'
$services = Get-Content -Raw -Encoding UTF8 'services.html'
$cars = Get-Content -Raw -Encoding UTF8 (Join-Path 'assets' 'js/dg-premium-interface-v202.js')
$servicePages = @(
  'service-residence-bulgaria.html',
  'service-company-registration.html',
  'service-banks-accounts.html',
  'service-supplements-registration.html',
  'service-cosmetics-registration.html',
  'service-pharma-consulting.html',
  'service-nostrification.html',
  'service-international-trade.html'
)
$checks = @()
$checks += @{Name='v207 css marker'; Ok=($css -match 'v207')}
$checks += @{Name='compact labels'; Ok=($css -match 'letter-spacing:\.30em' -and $css -match 'font-size:clamp\(11px')}
$checks += @{Name='home process wave'; Ok=($css -match 'dgV207CardWave' -and $css -match 'dgV207ArrowWave')}
$checks += @{Name='blog second marquee removed'; Ok=($blog -notmatch 'wow-marquee__line--b')}
$checks += @{Name='blog css fallback'; Ok=($css -match 'wow-marquee__line--b' -and $css -match 'display:none!important')}
$checks += @{Name='header cta nowrap'; Ok=($css -match 'min-width:max-content' -and $css -match 'padding:10px 24px')}
$checks += @{Name='service cards equal height'; Ok=($css -match 'grid-auto-rows:1fr' -and $css -match 'min-height:clamp\(410px')}
$checks += @{Name='whatsapp smoother'; Ok=($css -match 'wa-country' -and $css -match 'opacity \.46s')}
$checks += @{Name='cars supercar js updated'; Ok=($cars -match 'drawCars' -and $cars -match 'var contour = \[' -and $cars -match 'rx = base \* 0\.54')}
$checks += @{Name='index cache v207'; Ok=($index -match 'styles.css\?v=207' -and $index -match 'v106-i18n.js\?v=207')}
$checks += @{Name='services cache v207'; Ok=($services -match 'styles.css\?v=207' -and $services -match 'v106-i18n.js\?v=207')}
foreach($p in $servicePages){
  $html = Get-Content -Raw -Encoding UTF8 $p
  $checks += @{Name="no old anim script $p"; Ok=($html -notmatch 'dg-service-scenes' -and $html -notmatch 'dg-trade-globe-v')}
}
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v207 checks passed" -ForegroundColor Green
