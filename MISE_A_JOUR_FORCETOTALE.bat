@echo off
title MISE A JOUR FORCEE ET TOTALE - BETA ERP
color 0B
echo =======================================================
echo     MISE A JOUR FORCEE ET COMPLETE - BETA ERP
echo =======================================================
echo.
echo 1. Arret complet des serveurs Node.js...
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo.
echo 2. Sync forcé avec le depot GitHub officiel...
cd /d "%~dp0"
git remote set-url origin https://github.com/othmane-tanji/CHIMI-OXY.git
git fetch origin main
git reset --hard origin/main

echo.
echo 3. Nettoyage complet des fichiers temporaires et du cache...
if exist "frontend\.next" rmdir /s /q "frontend\.next"
if exist "backend\dist" rmdir /s /q "backend\dist"

echo.
echo 4. Preparation du serveur Backend (Base de donnees et Prisma)...
cd /d "%~dp0backend"
call npm.cmd install
call npx.cmd prisma db push --skip-generate
call npx.cmd prisma generate
call npm.cmd run build

echo.
echo 5. Compilation du serveur Frontend (Interface Web)...
cd /d "%~dp0frontend"
call npm.cmd install
call npm.cmd run build

echo.
echo 6. Redemarrage de l'application ERP...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

powershell -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000/bons-de-livraison'"

echo.
echo =======================================================
echo [SUCCES] TOUTE L'APPLICATION A ETE RECONSTRUITE !
echo.
echo POUR VOIR LA NOUVELLE VERSION SUR LE NAVIGATEUR :
echo 1. Ouvrez http://localhost:3000/bons-de-livraison
echo 2. Faites IMPERATIVEMENT : Ctrl + F5
echo =======================================================
echo.
pause
