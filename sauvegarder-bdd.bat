@echo off
title ENVOYER & SAUVEGARDER LA BASE DE DONNEES SUR GITHUB - BETA ERP
color 0A
echo =======================================================
echo     ENVOI DE LA BASE DE DONNEES SUR GITHUB
echo =======================================================
echo.
echo 1. Arret temporaire des serveurs pour debloquer la base de donnees...
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo.
echo 2. Envoi de la base de donnees (factures, clients, employes...) sur GitHub...
cd /d "%~dp0"
git remote set-url origin https://github.com/othmane-tanji/CHIMI-OXY.git >nul 2>&1
git add backend/prisma/dev.db
git commit -m "Mise a jour automatique de la base de donnees"
git push origin main

echo.
echo 3. Redemarrage des serveurs...
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

echo.
echo =======================================================
echo [SUCCES] LA BASE DE DONNEES A ETE ENVOYEE SUR GITHUB !
echo.
echo POUR L'AUTRE PC :
echo Sur l'autre PC, cliquez simplement sur 'mettre-a-jour.bat'
echo pour recevoir automatiquement toutes vos nouvelles donnees !
echo =======================================================
echo.
pause
