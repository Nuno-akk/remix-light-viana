@echo off
setlocal
cd /d "%~dp0"
if exist "dist\index.html" (
  start "" "%~dp0dist\index.html"
) else (
  start "" "%~dp0index.html"
)
