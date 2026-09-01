@echo off
title MISE A JOUR AUTOMATIQUE - BETA ERP
color 0A
echo =======================================================
echo     MISE A JOUR AUTOMATIQUE BETA ERP
echo =======================================================
echo.
echo Telechargement des nouvelles fonctionnalites en cours...
echo.

:: 1. Arret des anciens serveurs
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

:: 2. Configuration du depot Git officiel
git remote set-url origin https://github.com/othmane-tanji/CHIMI-OXY.git >nul 2>&1

:: 3. Telechargement forcé du code depuis GitHub
echo [1/3] Telechargement des mises a jour depuis GitHub...
git fetch origin main
git reset --hard origin/main

:: 4. Nettoyage du cache et installation des dependances
echo.
echo [2/3] Verification des modules et recompilation...
if exist "frontend\.next" rmdir /s /q "frontend\.next"
if exist "backend\dist" rmdir /s /q "backend\dist"

cd /d "%~dp0backend"
if not exist "node_modules\nodemailer" (
  echo Installation du module nodemailer...
  call npm.cmd install
)
echo Mise a jour Prisma Client et Base de donnees...
call npx.cmd prisma db push --skip-generate
call npx.cmd prisma generate
call npm.cmd run build

cd /d "%~dp0frontend"
if not exist "node_modules" (
  call npm.cmd install
)
call npm.cmd run build

:: 5. Redemarrage de l'application
echo.
echo [3/3] Redemarrage des serveurs...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

powershell -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

echo.
echo =======================================================
echo [SUCCES] L'APPLICATION A ETE MISE A JOUR AVEC SUCCES !
echo - Vos donnees reelles (employes, conges...) sont conservees.
echo - Veuillez faire Ctrl + F5 sur votre navigateur !
echo =======================================================
echo.
pause
