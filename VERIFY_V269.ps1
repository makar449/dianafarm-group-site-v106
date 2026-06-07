Write-Host "=== VERIFY V269 FORCED PHOTO LAYERS ===" -ForegroundColor Cyan

$checks = @(
  "services.html",
  "contacts.html",
  "assets/img/v269/services-hero-exact-visible.png",
  "assets/img/v269/contacts-hero-success-visible.png",
  "assets/css/v269-forced-photo-layers.css"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "HTML check:" -ForegroundColor Yellow
Select-String -Path .\services.html -Pattern "v269-hero-photo-img"
Select-String -Path .\contacts.html -Pattern "v269-hero-photo-img"

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "Open services.html?v=269 and contacts.html?v=269 with Ctrl+F5 / hard refresh."
