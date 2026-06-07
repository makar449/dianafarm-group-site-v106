$ErrorActionPreference = 'Stop'
$checks = @()
function Add-Check($Name, $Ok) {
  $script:checks += [pscustomobject]@{ Name = $Name; Ok = [bool]$Ok }
  if ($Ok) { Write-Host "OK  $Name" -ForegroundColor Green } else { Write-Host "BAD $Name" -ForegroundColor Red }
}

$services = Get-Content -Raw .\services.html
$uae = Get-Content -Raw .\uae.html
$asia = Get-Content -Raw .\asia.html
$css = Get-Content -Raw .\assets\css\styles.css
$serviceJs = Get-Content -Raw .\assets\js\dg-service-scenes-v198.js
$tradeJs = Get-Content -Raw .\assets\js\dg-trade-globe-v198.js

Add-Check 'CSS cache version v199 on services' ($services -match 'styles\.css\?v=199')
Add-Check 'CSS cache version v199 on UAE' ($uae -match 'styles\.css\?v=199')
Add-Check 'CSS cache version v199 on Asia' ($asia -match 'styles\.css\?v=199')
Add-Check 'Services title wrapper exists' ($services -match 'services-title-v199')
Add-Check 'Services title forced phrase span exists' ($services -match 'services-title-v199__phrase')
Add-Check 'Asia title wrapper exists' ($asia -match 'asia-title-v199')
Add-Check 'Asia title has 3 spans' (($asia -split '<span>').Count -ge 4)
Add-Check 'v199 CSS patch exists' ($css -match 'v199 PART 2')
Add-Check 'Gold palette is present' ($css -match '#D4AF37')
Add-Check 'Sun palette is present' ($css -match '#FFD700')
Add-Check 'Services orbit premium keyframes' ($css -match 'v199PremiumOrbit')
Add-Check 'UAE sphere bigger rule' ($css -match 'body\[data-page="uae"\] \.wow-sphere')
Add-Check 'Asia globe bigger rule' ($css -match 'body\[data-page="asia"\] \.wow-globe')
Add-Check 'Touch-safe media exists' (($css -match '@media \(hover:hover\)') -and ($css -match '@media \(max-width:640px\)'))
Add-Check 'Service scenes are document-bound absolute' (($serviceJs -match "position:'absolute'") -and ($serviceJs -notmatch "position:'fixed'"))
Add-Check 'Trade globe is document-bound absolute' (($tradeJs -match "position:'absolute'") -and ($tradeJs -notmatch "position:'fixed'"))

$bad = $checks | Where-Object { -not $_.Ok }
Write-Host "RESULT: $($checks.Count - $bad.Count) / $($checks.Count) v199 checks passed"
if ($bad.Count -gt 0) { exit 1 }
