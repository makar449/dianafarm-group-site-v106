Write-Host "=== VERIFY V267 SERVICES PHOTO + ROUTE ANIMATION ===" -ForegroundColor Cyan

$checks = @(
  "services.html",
  "assets/img/v267/services-hero-exact-upload.png",
  "assets/img/v267/vertical-route-reference.png",
  "assets/css/v267-services-route-final.css"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) Open services.html?v=267"
Write-Host "2) The top hero uses the uploaded premium image as full background"
Write-Host "3) Right vertical cards show a glowing moving route line through the icons"
Write-Host "4) Open other pages with vertical cards; the same route animation appears there too"
