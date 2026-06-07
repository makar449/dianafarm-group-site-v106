Write-Host "=== VERIFY V260 REAL FIXES ===" -ForegroundColor Cyan

$checks = @(
  "assets/css/v260-real-fixes-stable.css",
  "assets/js/v254-loader-guard.js",
  "reviews.html",
  "real-estate.html",
  "blog.html",
  "index.html"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) Reviews card text does not touch frame"
Write-Host "2) Cards are transparent, not blurry/milky"
Write-Host "3) Международный контур fits"
Write-Host "4) Blog hero title/buttons moved upward"
Write-Host "5) Animation is smoother and not laggy"
Write-Host "6) Loader appears, then disappears safely"
Write-Host "7) Real-estate stat table is ~50% desktop width"
Write-Host "8) Real-estate section title/link are centered"
Write-Host "9) Result card matches other frames"
