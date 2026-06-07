Write-Host "=== VERIFY V264 DEEP QUALITY FIX ===" -ForegroundColor Cyan
$checks = @(
  "assets/css/v264-deep-quality-fixes.css",
  "assets/img/v264/contacts-premium-scene.png",
  "contacts.html",
  "reviews.html",
  "blog.html",
  "real-estate.html",
  "service-company-registration.html",
  "service-international-trade.html",
  "service-banks-accounts.html",
  "service-residence-bulgaria.html"
)
foreach($f in $checks){ if(Test-Path $f){Write-Host "OK   $f" -ForegroundColor Green}else{Write-Host "MISS $f" -ForegroundColor Red} }
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) contacts section has new premium photo card"
Write-Host "2) no blur / glass on complained cards"
Write-Host "3) reviews cards do not overlap and titles fit"
Write-Host "4) blog/service hero copy is lifted"
Write-Host "5) filter dropdown arrow looks premium"
