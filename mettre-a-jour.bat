@echo off
title MISE A JOUR AUTOMATIQUE - BETA ERP
color 0A
echo =======================================================
echo     MISE A JOUR AUTOMATIQUE BETA ERP
echo =======================================================
echo.
echo Telechargement des nouvelles fonctionnalites en cours...
echo.

:: 1. Arret discret des serveurs en arriere-plan
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

:: 2. Configuration automatique du depot Git officiel
git remote set-url origin https://github.com/othmane-tanji/CHIMI-OXY.git >nul 2>&1

:: 3. Telechargement du code depuis GitHub
echo [1/3] Telechargement des mises a jour depuis GitHub...
git fetch origin
git reset --mixed origin/main
git pull origin main

:: 4. Recompilation automatique du code
echo.
echo [2/3] Application et compilation des nouvelles fonctionnalites...
cd /d "%~dp0backend"
call npm.cmd run build

cd /d "%~dp0frontend"
call npm.cmd run build

:: 5. Redemarrage propre de l'application
echo.
echo [3/3] Redemarrage de l'application...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

powershell -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

echo.
echo =======================================================
echo [SUCCES] L'APPLICATION A ETE MISE A JOUR AVEC SUCCES !
echo - Vos donnees reelles (employes, conges...) sont conservees.
echo - L'application est ouverte sur : http://localhost:3000
echo =======================================================
echo.
pause
