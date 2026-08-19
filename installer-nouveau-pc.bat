@echo off
title INSTALLATION BETA ERP - NOUVEAU PC
color 0A
echo =======================================================
echo     INSTALLATION AUTOMATIQUE BETA ERP (Nouveau PC)
echo =======================================================
echo.
echo Initialisation de l'installation...
echo.

:: 1. Verification et Installation automatique de Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ETAPE 1/4] Node.js n'est pas encore installe sur ce PC.
    echo Telechargement automatique de Node.js LTS en cours...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '%temp%\node-installer.msi'"
    
    if not exist "%temp%\node-installer.msi" (
        echo [ERREUR] Le telechargement de Node.js a echoue.
        echo Veuillez verifier votre connexion Internet ou installer Node.js manuellement.
        pause
        exit /b 1
    )
    
    echo Installation de Node.js en cours...
    msiexec /i "%temp%\node-installer.msi" /passive /norestart
    echo.
    echo [SUCCES] Node.js a ete installe avec succes !
    echo VEUILLEZ FERMER CETTE FENETRE ET RELANCER 'installer-nouveau-pc.bat'
    pause
    exit /b 0
)

echo [OK] Node.js est bien installe sur ce PC.
echo.

:: 2. Preparation du backend
echo [ETAPE 2/4] Preparation du Backend...
cd /d "%~dp0backend"
call npm.cmd install
call npx.cmd prisma generate
call npm.cmd run build

:: 3. Preparation du frontend
echo.
echo [ETAPE 3/4] Preparation du Frontend...
cd /d "%~dp0frontend"
call npm.cmd install
call npm.cmd run build

:: 4. Creation des raccourcis
echo.
echo [ETAPE 4/4] Configuration du raccourci Bureau et du demarrage automatique...
powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Desktop = [System.Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut(\"$Desktop\BETA ERP.lnk\"); $Shortcut.TargetPath = \"%~dp0lancer.bat\"; $Shortcut.WorkingDirectory = \"%~dp0\"; $Shortcut.WindowStyle = 1; $Shortcut.Description = 'Application Beta ERP'; $Shortcut.Save()"

powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Startup = [System.Environment]::GetFolderPath('Startup'); $Shortcut = $WshShell.CreateShortcut(\"$Startup\BETA ERP.lnk\"); $Shortcut.TargetPath = \"%~dp0lancer.bat\"; $Shortcut.WorkingDirectory = \"%~dp0\"; $Shortcut.WindowStyle = 7; $Shortcut.Description = 'Demarrage automatique Beta ERP'; $Shortcut.Save()"

echo.
echo =======================================================
echo [SUCCES] INSTALLATION COMPLETE ET ENREGISTREE !
echo - Une icone 'BETA ERP' a ete creee sur le Bureau.
echo - L'application s'ouvrira automatiquement a l'allumage du PC.
echo =======================================================
echo.
echo Demarrage immediat de l'application...
cd /d "%~dp0"
call lancer.bat

pause
