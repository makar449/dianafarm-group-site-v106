$ErrorActionPreference = "Stop"
$pages = @(
  @{File="service-nostrification.html"; Scene="nostrification"; Kind="mobius"},
  @{File="service-pharma-consulting.html"; Scene="pharma"; Kind="lattice"},
  @{File="service-cosmetics-registration.html"; Scene="cosmetics"; Kind="metaball"},
  @{File="service-supplements-registration.html"; Scene="supplements"; Kind="particles"},
  @{File="service-banks-accounts.html"; Scene="banks"; Kind="wave"},
  @{File="service-company-registration.html"; Scene="company"; Kind="cubes"},
  @{File="service-residence-bulgaria.html"; Scene="residence"; Kind="topo"}
)
$passed = 0
$total = 0
foreach ($p in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $p.File
  $checks = @(
    ($html -match 'dgProSceneV196Root'),
    ($html -match 'dgProSceneV196Canvas'),
    ($html -match 'dg-service-scenes-v196.js\?v=196'),
    ($html -match 'dg-pro-scenes-v196-critical-css'),
    ($html -match ('data-dg-v196="' + $p.Scene + '"')),
    ($html -match ('data-dg-kind="' + $p.Kind + '"'))
  )
  $ok = -not ($checks -contains $false)
  $total++
  if ($ok) { $passed++; Write-Host "OK  $($p.File) -> $($p.Kind)" -ForegroundColor Green }
  else { Write-Host "BAD $($p.File)" -ForegroundColor Red; $checks }
}
$jsExists = Test-Path .\assets\js\dg-service-scenes-v196.js
$jsText = if ($jsExists) { Get-Content -Raw -Encoding UTF8 .\assets\js\dg-service-scenes-v196.js } else { '' }
$jsChecks = @(
  $jsExists,
  ($jsText -match 'v196-all-other-tabs-pro-canvas-external-js'),
  ($jsText -match 'DG_PRO_SCENES_V196'),
  ($jsText -match 'drawMobius'),
  ($jsText -match 'drawLattice'),
  ($jsText -match 'drawMetaball'),
  ($jsText -match 'drawParticles'),
  ($jsText -match 'drawWave'),
  ($jsText -match 'drawCubes'),
  ($jsText -match 'drawTopo')
)
if (-not ($jsChecks -contains $false)) { Write-Host "OK  JS scene engine" -ForegroundColor Green } else { Write-Host "BAD JS scene engine" -ForegroundColor Red; $jsChecks }
Write-Host "RESULT: $passed / $total service pages contain v196 PRO visible canvas scenes"
if (($passed -ne $total) -or ($jsChecks -contains $false)) { exit 1 }