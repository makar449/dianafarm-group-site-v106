Write-Host "=== VERIFY V263 CLEAN STABLE FIX ===" -ForegroundColor Cyan

$checks = @(
  "assets/css/v263-clean-final.css",
  "assets/js/v238-quality.js",
  "assets/js/v254-loader-guard.js",
  "index.html",
  "reviews.html",
  "blog.html",
  "real-estate.html"
)

foreach($f in $checks){
  if(Test-Path $f){ Write-Host "OK   $f" -ForegroundColor Green }
  else{ Write-Host "MISS $f" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Manual check:" -ForegroundColor Yellow
Write-Host "1) Loader D and line are centered"
Write-Host "2) Reviews have one clean frame, not nested overlapping frames"
Write-Host "3) Animation objects do not sit on final title panel"
Write-Host "4) No gold line crosses text"
Write-Host "5) Blocks are transparent without blur"
