$ErrorActionPreference = 'Stop'
$real = Get-Content -Raw -Encoding UTF8 .\real-estate.html
$cars = Get-Content -Raw -Encoding UTF8 .\cars.html
$parking = Get-Content -Raw -Encoding UTF8 .\parking.html
$css = Get-Content -Raw -Encoding UTF8 .\assets\css\styles.css
$js = Get-Content -Raw -Encoding UTF8 .\assets\js\dg-premium-interface-v202.js
$i18n = Get-Content -Raw -Encoding UTF8 .\assets\js\v106-i18n.js
$checks = @(
  @{Name='no blueprint label in real-estate html'; Ok=($real -notmatch 'v202-hero-stage__label')},
  @{Name='no aerodynamics label in cars html'; Ok=($cars -notmatch 'v202-hero-stage__label')},
  @{Name='no smart radar label in parking html'; Ok=($parking -notmatch 'v202-hero-stage__label')},
  @{Name='css hides hero labels'; Ok=($css -match 'display:none!important;')},
  @{Name='css has larger real-estate and cars hero stage'; Ok=($css -match 'body\[data-page="real-estate"\] \.v202-hero-stage' -and $css -match 'min-height:clamp\(520px, 55vw, 690px\)!important;')},
  @{Name='js contains upgraded real-estate cuboid scene'; Ok=($js -match 'function cuboid\(' -and $js -match 'var deck = cuboid')},
  @{Name='js contains upgraded ferrari-like supercar contour'; Ok=($js -match 'var contour = \[' -and $js -match 'var rx = Math.min\(w, h\) \* 0\.48')},
  @{Name='services hero wording fixed in i18n'; Ok=($i18n -match "Глобальные услуги под ключ")},
  @{Name='asia hero wording fixed in i18n'; Ok=($i18n -match "Бизнес-контакты с Узбекистаном и Азией")},
  @{Name='cache css v205'; Ok=($real -match 'styles.css\?v=205' -and $cars -match 'styles.css\?v=205' -and $parking -match 'styles.css\?v=205')},
  @{Name='cache js v205'; Ok=($real -match 'dg-premium-interface-v202.js\?v=205' -and $cars -match 'dg-premium-interface-v202.js\?v=205' -and $parking -match 'dg-premium-interface-v202.js\?v=205')}
)
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v205 checks passed" -ForegroundColor Green
