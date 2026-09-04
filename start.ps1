# Beta ERP - Windows startup script
$ErrorActionPreference = "Stop"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue

if (Test-Path "C:\Program Files\nodejs") {
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
}

# Close any running node processes to release file locks on Windows
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "=== Beta ERP - Oxyral & Chimiral ===" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/3] Configuration du backend..." -ForegroundColor Yellow
Set-Location $backendPath
if (-not (Test-Path "$backendPath\.env")) {
    if (Test-Path "$backendPath\.env.example") {
        Copy-Item "$backendPath\.env.example" "$backendPath\.env"
    }
}
if (-not (Test-Path "$backendPath\node_modules")) {
    npm.cmd install
}

$ErrorActionPreference = "SilentlyContinue"
npx.cmd prisma generate
$ErrorActionPreference = "Stop"

npx.cmd prisma migrate deploy

node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>process.exit(n>0?0:1)).catch(()=>process.exit(1)).finally(()=>p.`$disconnect())"
if ($LASTEXITCODE -ne 0) {
    npx.cmd prisma db seed
}

if (Test-Path "$backendPath\dist") {
    Remove-Item -Recurse -Force "$backendPath\dist" -ErrorAction SilentlyContinue
}
npm.cmd run build

Write-Host "`n[2/3] Configuration du frontend..." -ForegroundColor Yellow
Set-Location $frontendPath
if (-not (Test-Path "$frontendPath\node_modules")) {
    npm.cmd install
}

Write-Host "`n[3/3] Démarrage des services..." -ForegroundColor Yellow
# Démarrer le Backend API directement avec node.exe (instantané et sans blocage)
Start-Process node -ArgumentList "dist/main.js" -WorkingDirectory $backendPath -WindowStyle Hidden

# Démarrer le Frontend Next.js
Start-Process cmd -ArgumentList "/c npm run dev" -WorkingDirectory $frontendPath -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "`nOuverture du navigateur sur http://localhost:3000..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "`n=== Application lancée avec succès ===" -ForegroundColor Green
Write-Host "Frontend : http://localhost:3000"
Write-Host "API      : http://localhost:3001/api"
Write-Host "Compte   : admin@oxyral.ma / Admin123!"
