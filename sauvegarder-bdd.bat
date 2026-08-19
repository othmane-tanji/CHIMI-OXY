@echo off
title Sauvegarde Automatique de la Base de Donnees - Beta ERP
color 0B
echo =======================================================
echo     SAUVEGARDE DE LA BASE DE DONNEES (BETA ERP)
echo =======================================================
echo.

:: Recupere la date et l'heure pour le nom du fichier
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

set SOURCE_DB=%~dp0backend\prisma\dev.db
set TARGET_DB=%BACKUP_DIR%\beta_erp_backup_%timestamp%.db

if exist "%SOURCE_DB%" (
    copy /Y "%SOURCE_DB%" "%TARGET_DB%" >nul
    echo [SUCCESS] Sauvegarde creee avec succes !
    echo Fichier : %TARGET_DB%
) else (
    echo [ERREUR] Impossible de trouver la base de donnees dev.db dans backend/prisma.
)

echo.
echo =======================================================
pause
