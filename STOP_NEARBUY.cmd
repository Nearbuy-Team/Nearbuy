@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0STOP_NEARBUY.ps1" %*
exit /b %errorlevel%
