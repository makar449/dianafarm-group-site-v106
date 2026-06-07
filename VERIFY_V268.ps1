Write-Host "=== VERIFY V268 REAL PHOTO BACKGROUNDS ===" -ForegroundColor Cyan

$checks = @(
  "services.html",
  "contacts.html",
  "assets/img/v268/services-hero-real-photo.png",
  "assets/img/v268/contacts-hero-consultation-photo.png",
  "assets/css/v268-real-photo-backgrounds.css"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) Open services.html?v=268 — the premium globe image must be visible behind the hero text"
Write-Host "2) Open contacts.html?v=268 — the consultation/success-deal image must be visible behind the hero text"
Write-Host "3) Right vertical cards keep glowing route animation"
