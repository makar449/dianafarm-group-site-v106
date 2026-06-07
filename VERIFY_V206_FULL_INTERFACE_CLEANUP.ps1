$ErrorActionPreference = 'Stop'
$css = Get-Content -Raw -Encoding UTF8 .\assets\css\styles.css
$index = Get-Content -Raw -Encoding UTF8 .\index.html
$services = Get-Content -Raw -Encoding UTF8 .\services.html
$i18n = Get-Content -Raw -Encoding UTF8 .\assets\js\v106-i18n.js
$servicePages = @(
  'service-residence-bulgaria.html','service-company-registration.html','service-banks-accounts.html','service-supplements-registration.html',
  'service-cosmetics-registration.html','service-pharma-consulting.html','service-nostrification.html','service-international-trade.html'
)
$serviceOk = $true
foreach($p in $servicePages){
  $html = Get-Content -Raw -Encoding UTF8 .\$p
  if($html -match 'dg-service-scenes-v201\.js|dg-trade-globe-v201\.js|id="dgProSceneV196Root"|id="dgTradeGlobeV195Root"'){$serviceOk = $false}
}
$checks = @(
  @{Name='cache css v206'; Ok=($index -match 'styles\.css\?v=206' -and $services -match 'styles\.css\?v=206')},
  @{Name='cache i18n v206'; Ok=($index -match 'v106-i18n\.js\?v=206' -and $services -match 'v106-i18n\.js\?v=206')},
  @{Name='header button nowrap'; Ok=($css -match 'white-space:nowrap!important' -and $css -match 'min-width:max-content!important')},
  @{Name='home services compact label'; Ok=($css -match 'section--v9-home-services' -and $css -match 'letter-spacing:\.29em!important')},
  @{Name='services compact label'; Ok=($css -match 'section--v9-services' -and $css -match 'word-break:keep-all!important')},
  @{Name='home process centered arrows'; Ok=($css -match 'v9-home-process article:not\(:last-child\)::after' -and $css -match 'content:"›"')},
  @{Name='home process wave animation'; Ok=($css -match 'dgV206CardSheen' -and $css -match 'dgV206ArrowGlow')},
  @{Name='global hero lifted'; Ok=($css -match 'padding-top:clamp\(54px,6vw,78px\)!important' -and $css -match 'align-items:start!important')},
  @{Name='service animations removed from html'; Ok=$serviceOk},
  @{Name='service animation fallback hidden css'; Ok=($css -match 'data-page\^="service-"' -and $css -match 'display:none!important')},
  @{Name='i18n keeps global services title'; Ok=($i18n -match 'Глобальные услуги под ключ' -and $i18n -match 'Глобальные&nbsp;услуги')},
  @{Name='i18n keeps asia contacts title'; Ok=($i18n -match 'Бизнес-контакты с Узбекистаном и Азией')}
)
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v206 checks passed" -ForegroundColor Green
