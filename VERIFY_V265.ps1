Write-Host "=== VERIFY V265 SERVICES CARDS STABLE ===" -ForegroundColor Cyan

$checks = @(
  "assets/css/v265-services-cards-stable.css",
  "services.html",
  "assets/js/app.js",
  "assets/css/styles.css",
  "assets/css/v264-deep-quality-fixes.css"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) Open services.html with hard refresh"
Write-Host "2) Cards should appear compact immediately, not stretch while images/layout load"
Write-Host "3) Filter click should not make cards vertically huge"
Write-Host "4) Desktop shows stable card heights; mobile stays compact"
