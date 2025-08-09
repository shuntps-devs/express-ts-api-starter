@echo off
echo 🧹 Cleaning VS Code cache...

REM Close VS Code first
taskkill /f /im "Code.exe" 2>nul

REM Remove main cache files
echo Removing workspaces...
rmdir /s /q "%APPDATA%\Code\User\workspaceStorage" 2>nul
mkdir "%APPDATA%\Code\User\workspaceStorage" 2>nul

echo Removing file history...
del /q "%APPDATA%\Code\User\History\*" 2>nul

echo Removing session states...
rmdir /s /q "%APPDATA%\Code\CachedData" 2>nul
rmdir /s /q "%APPDATA%\Code\logs" 2>nul

REM Remove project temporary files
echo Removing project VS Code files...
if exist ".vscode\settings.json" (
    echo Backing up settings...
    copy ".vscode\settings.json" ".vscode\settings.json.backup" 2>nul
)

rmdir /s /q ".vscode" 2>nul
mkdir ".vscode" 2>nul

if exist ".vscode\settings.json.backup" (
    echo Restoring essential settings...
    copy ".vscode\settings.json.backup" ".vscode\settings.json" 2>nul
    del ".vscode\settings.json.backup" 2>nul
)

echo ✅ Cleanup completed!
echo ⚠️  Restart VS Code to apply changes
pause
