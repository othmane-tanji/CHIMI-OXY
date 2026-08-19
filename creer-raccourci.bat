@echo off
title Configuration Demarrage Automatique & Raccourci - Beta ERP
echo Configuration du demarrage automatique a l'allumage du PC...

powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Desktop = [System.Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut(\"$Desktop\BETA ERP.lnk\"); $Shortcut.TargetPath = \"%~dp0lancer-prod.bat\"; $Shortcut.WorkingDirectory = \"%~dp0\"; $Shortcut.WindowStyle = 7; $Shortcut.Description = 'Application Beta ERP - Oxyral & Chimiral'; $Shortcut.Save()"

powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Startup = [System.Environment]::GetFolderPath('Startup'); $Shortcut = $WshShell.CreateShortcut(\"$Startup\BETA ERP.lnk\"); $Shortcut.TargetPath = \"%~dp0lancer-prod.bat\"; $Shortcut.WorkingDirectory = \"%~dp0\"; $Shortcut.WindowStyle = 7; $Shortcut.Description = 'Demarrage automatique Beta ERP'; $Shortcut.Save()"

echo.
echo [SUCCESS] Raccourci Bureau ET demarrage automatique a l'allumage du PC configures avec succes !
pause
