$ErrorActionPreference = 'Stop'
$checks = @()
function Add-Check($name, $ok) {
  $script:checks += [pscustomobject]@{Name=$name; Ok=[bool]$ok}
  if ($ok) { Write-Host "OK  $name" -ForegroundColor Green } else { Write-Host "BAD $name" -ForegroundColor Red }
}

$css = Get-Content -Raw -Encoding UTF8 .\assets\css\styles.css
$services = Get-Content -Raw -Encoding UTF8 .\services.html
$asia = Get-Content -Raw -Encoding UTF8 .\asia.html
$real = Get-Content -Raw -Encoding UTF8 .\real-estate.html
$blog = Get-Content -Raw -Encoding UTF8 .\blog.html
$trade = Get-Content -Raw -Encoding UTF8 .\service-international-trade.html
$svcjs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-service-scenes-v200.js
$tradejs = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-trade-globe-v200.js

Add-Check 'CSS cache v200 linked in services' ($services -match 'styles\.css\?v=200')
Add-Check 'Services title has nonbreaking phrase' ($services -match 'Международные&nbsp;услуги&nbsp;под&nbsp;ключ')
Add-Check 'Asia title uses v200 exact spans' ($asia -match 'asia-title-v200' -and $asia -match '<span>Бизнес-</span>' -and $asia -match '<span>Коммуникация</span>' -and $asia -match '<span>С Узбекистаном</span>' -and $asia -match '<span>И Азией</span>')
Add-Check 'Real estate title uses v200 exact spans' ($real -match 'realestate-title-v200' -and $real -match '<span>Недвижимость</span>' -and $real -match '<span>В Болгарии</span>' -and $real -match '<span>У моря</span>')
Add-Check 'Trade uses v200 JS' ($trade -match 'dg-trade-globe-v200\.js\?v=200')
Add-Check 'Service scene JS exists' (Test-Path .\assets\js\dg-service-scenes-v200.js)
Add-Check 'Trade scene JS exists' (Test-Path .\assets\js\dg-trade-globe-v200.js)
Add-Check 'Service scene JS is document-bound' ($svcjs -match 'v200-document-bound-service-scenes' -and $svcjs -match 'no scroll listener')
Add-Check 'Trade scene JS is document-bound' ($tradejs -match 'v200-trade-document-bound-canvas-external-js' -and $tradejs -match 'no scroll listener')
Add-Check 'No scroll listener in v200 service JS' (-not ($svcjs -match "addEventListener\('scroll'"))
Add-Check 'No scroll listener in v200 trade JS' (-not ($tradejs -match "addEventListener\('scroll'"))
Add-Check 'CSS has v200 marker' ($css -match 'v200 FINAL')
Add-Check 'CSS locks exact service phrase' ($css -match 'services-title-v199__phrase' -and $css -match 'word-break:keep-all')
Add-Check 'CSS fixes process cards' ($css -match 'v8-process' -and $css -match 'process-flow-arrow\{display:none')
Add-Check 'CSS moves real estate proof right' ($css -match 'real-estate' -and $css -match 'justify-content:flex-end')
Add-Check 'CSS constrains blog marquee' ($css -match 'wow-marquee--blog' -and $css -match 'width:100%')

$bad = $checks | Where-Object { -not $_.Ok }
Write-Host "RESULT: $($checks.Count - $bad.Count) / $($checks.Count) v200 checks passed"
if ($bad.Count -gt 0) { exit 1 }
