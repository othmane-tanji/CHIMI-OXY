@echo off
title Demarrage Mode Production - Beta ERP
echo ==============================================
echo   Lancement en mode Production (Ultra-Rapide)
echo ==============================================
echo.

powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo [1/2] Verification des compilations...
cd /d "%~dp0backend"
if not exist "dist\main.js" (
    echo Compilation backend en cours...
    call npm.cmd run build
)

cd /d "%~dp0frontend"
if not exist ".next" (
    echo Compilation frontend en cours...
    call npm.cmd run build
)

echo.
echo [2/2] Demarrage des serveurs...
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

powershell -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

echo.
echo ==============================================
echo Application lancee avec succes !
echo - Interface web : http://localhost:3000
echo - Identifiants   : admin@oxyral.ma / Admin123!
echo ==============================================
echo.
pause
