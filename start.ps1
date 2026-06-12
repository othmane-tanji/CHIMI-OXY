# Beta ERP - Windows startup script
$ErrorActionPreference = "Stop"

Write-Host "=== Beta ERP - Oxyral & Chimiral ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Installing and configuring backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm install
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "Prisma client generation failed." }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>process.exit(n>0?0:1)).catch(()=>process.exit(1)).finally(()=>p.`$disconnect())"
if ($LASTEXITCODE -ne 0) {
    npx prisma db seed
    if ($LASTEXITCODE -ne 0) { throw "Database seed failed." }
}

Write-Host "`n[2/4] Installing frontend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm install
if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }

Write-Host "`n[3/4] Starting backend API on port 3001..." -ForegroundColor Yellow
Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", "cd '$PSScriptRoot\backend'; npm run start:dev"
Start-Sleep -Seconds 5

Write-Host "`n[4/4] Starting frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`n=== Application launched ===" -ForegroundColor Green
Write-Host "Frontend : http://localhost:3000"
Write-Host "API      : http://localhost:3001/api"
Write-Host "Account  : admin@oxyral.ma / Admin123!"
