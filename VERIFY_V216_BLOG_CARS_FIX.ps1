$ErrorActionPreference = "Stop"
Write-Host "VERIFY V216"
$files = @("blog.html","cars.html","assets/css/styles.css","assets/js/dg-premium-interface-v202.js")
foreach($f in $files){ if(!(Test-Path $f)){ throw "Missing $f" } }
Select-String -Path "blog.html" -Pattern "styles.css\?v=216|dg-premium-interface-v202.js\?v=216" | Out-Null
Select-String -Path "cars.html" -Pattern "styles.css\?v=216|dg-premium-interface-v202.js\?v=216" | Out-Null
Select-String -Path "assets/css/styles.css" -Pattern "v216 — blog marquee safe zone" | Out-Null
Select-String -Path "assets/js/dg-premium-interface-v202.js" -Pattern "function drawCars\(w, h, t\)" | Out-Null
Write-Host "OK V216"
