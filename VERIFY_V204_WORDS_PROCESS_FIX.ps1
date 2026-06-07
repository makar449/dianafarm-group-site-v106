$ErrorActionPreference = 'Stop'
$services = Get-Content -Raw -Encoding UTF8 .\services.html
$asia = Get-Content -Raw -Encoding UTF8 .\asia.html
$css = Get-Content -Raw -Encoding UTF8 .\assets\css\styles.css
$checks = @(
  @{Name='services title global'; Ok=($services -match 'Глобальные&nbsp;услуги&nbsp;под&nbsp;ключ')},
  @{Name='services title no international phrase'; Ok=($services -notmatch 'Международные&nbsp;услуги&nbsp;под&nbsp;ключ')},
  @{Name='asia title business contacts'; Ok=($asia -match 'Бизнес-контакты')},
  @{Name='asia no business communication title'; Ok=($asia -notmatch 'Бизнес-коммуникация')},
  @{Name='services process block removed from html'; Ok=($services -notmatch 'class="v8-process reveal-group"')},
  @{Name='services process hidden fallback css'; Ok=($css -match 'body\[data-page="services"\] \.v8-process')},
  @{Name='cache css v204'; Ok=($services -match 'styles.css\?v=204')},
  @{Name='cache js v204'; Ok=($services -match 'dg-premium-interface-v202.js\?v=204')}
)
$bad = @($checks | Where-Object { -not $_.Ok })
foreach($c in $checks){ if($c.Ok){ Write-Host "OK  $($c.Name)" -ForegroundColor Green } else { Write-Host "BAD $($c.Name)" -ForegroundColor Red } }
if($bad.Count -gt 0){ exit 1 }
Write-Host "RESULT: $($checks.Count) / $($checks.Count) v204 checks passed" -ForegroundColor Green
