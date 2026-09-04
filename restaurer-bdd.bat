@echo off
title Restauration de la Base de Donnees - Beta ERP
color 0C
echo =======================================================
echo     RESTAURATION / IMPORTATION BASE DE DONNEES
echo =======================================================
echo.
echo Ce script va remplacer la base de donnees de ce PC par un fichier de sauvegarde (.db).
echo.

:: 1. Arret des serveurs Node pour liberer le fichier dev.db
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

set DEST_DB=%~dp0backend\prisma\dev.db

if "%~1" neq "" (
    set SOURCE_INPUT=%~1
    goto DO_RESTORE
)

if exist "%~dp0MA_BASE_DE_DONNEES.db" (
    echo Un fichier 'MA_BASE_DE_DONNEES.db' a ete trouve dans le dossier principal.
    echo.
    choice /C ON /M "Voulez-vous restaurer 'MA_BASE_DE_DONNEES.db' ? (O: Oui, N: Non, glisser un autre fichier)"
    if errorlevel 2 goto ASK_FILE
    set SOURCE_INPUT=%~dp0MA_BASE_DE_DONNEES.db
    goto DO_RESTORE
)

:ASK_FILE
echo.
echo Glissez-deposez le fichier .db de sauvegarde ici et appuyez sur Entree :
set /p SOURCE_INPUT="Chemin du fichier : "
set SOURCE_INPUT=%SOURCE_INPUT:"=%

:DO_RESTORE
if not exist "%SOURCE_INPUT%" (
    echo.
    echo [ERREUR] Le fichier specifie n'existe pas : %SOURCE_INPUT%
    echo.
    pause
    exit /b 1
)

:: Sauvegarde de securite de l'ancienne BD avant ecrasement
if exist "%DEST_DB%" (
    copy /Y "%DEST_DB%" "%~dp0backend\prisma\dev.db.bak" >nul
)

copy /Y "%SOURCE_INPUT%" "%DEST_DB%" >nul

echo.
echo =======================================================
echo [SUCCES] La base de donnees a ete restauree avec succes !
echo =======================================================
echo.
echo Redemarrage de l'application...
cd /d "%~dp0"
call lancer.bat
pause
