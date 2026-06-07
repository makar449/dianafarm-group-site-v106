Write-Host "=== VERIFY V266 SERVICES HERO PHOTO ===" -ForegroundColor Cyan

$checks = @(
  "services.html",
  "assets/img/v266/services-hero-global-bg.png",
  "assets/css/v266-services-hero-photo.css",
  "assets/css/v265-services-cards-stable.css"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "Open services.html?v=266"
Write-Host "The top hero must use the premium globe photo as full background"
Write-Host "Headings/buttons/right cards must be real page elements on top of the photo"
