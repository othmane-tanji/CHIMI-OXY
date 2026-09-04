@echo off
title MISE A JOUR AUTOMATIQUE - BETA ERP
color 0A
echo =======================================================
echo     MISE A JOUR AUTOMATIQUE BETA ERP
echo =======================================================
echo.

:: 1. Arret des serveurs Node pour liberer la base de donnees
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

:: Recupere la date et l'heure pour la sauvegarde de securite
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: 2. Sauvegarde de securite locale automatique avant toute action
if exist "%~dp0backend\prisma\dev.db" (
    copy /Y "%~dp0backend\prisma\dev.db" "%BACKUP_DIR%\dev_secu_avant_maj_%timestamp%.db" >nul
)

:: 3. Verification et envoi des modifications locales s'il y en a
cd /d "%~dp0"
git remote set-url origin https://github.com/othmane-tanji/CHIMI-OXY.git >nul 2>&1

git status --porcelain backend/prisma/dev.db | findstr "dev.db" >nul
if %errorlevel% equ 0 (
    echo [INFO] Nouveautes detectees sur ce PC. Envoi automatique vers GitHub...
    git add backend/prisma/dev.db
    git commit -m "Sauvegarde automatique des donnees locales avant mise a jour"
    git push origin main
)

:: 4. Telechargement de la derniere version depuis GitHub
echo.
echo [1/3] Telechargement des dernieres donnees depuis GitHub...
git fetch origin main
git reset --hard origin/main

:: 5. Verification du fichier .env et compilation
echo.
echo [2/3] Verification de la base de donnees et compilation...
cd /d "%~dp0backend"
if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
  ) else (
    echo DATABASE_URL="file:./dev.db"> ".env"
    echo JWT_SECRET="beta-erp-secret-local-dev">> ".env"
    echo JWT_EXPIRES_IN="24h">> ".env"
    echo PORT=3001>> ".env"
    echo SMTP_HOST="smtp.gmail.com">> ".env"
    echo SMTP_PORT=465>> ".env"
    echo SMTP_USER="tangi.fat@gmail.com">> ".env"
    echo SMTP_PASS="tryydiddanrsyuej">> ".env"
  )
)
if not exist "node_modules\nodemailer" (
  call npm.cmd install
)
call npx.cmd prisma db push --skip-generate
call npx.cmd prisma generate
call npm.cmd run build

cd /d "%~dp0frontend"
if not exist "node_modules" (
  call npm.cmd install
)
call npm.cmd run build

:: 6. Redemarrage de l'application
echo.
echo [3/3] Redemarrage des serveurs...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "Start-Process node -ArgumentList 'dist/main.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"
powershell -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden"

powershell -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

echo.
echo =======================================================
echo [SUCCES] VOS DONNEES ET L'APPLICATION SONT A JOUR !
echo - Toutes vos factures, clients et employes sont conserves.
echo - Veuillez faire Ctrl + F5 sur votre navigateur !
echo =======================================================
echo.
pause
