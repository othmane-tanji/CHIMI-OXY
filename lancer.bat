@echo off
title Demarrage Beta ERP - Oxyral & Chimiral
echo ==============================================
echo   Lancement de l'application (Backend + Frontend)
echo ==============================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

echo.
echo ==============================================
echo Application lancee avec succes !
echo - Le navigateur s'ouvre automatiquement sur : http://localhost:3000
echo - Identifiants de connexion : admin@oxyral.ma / Admin123!
echo ==============================================
echo.
pause
