@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_NEARBUY.ps1" %*
exit /b %errorlevel%
