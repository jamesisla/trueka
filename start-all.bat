@echo off
echo ========================================================
echo   TRUEKA - INICIANDO APP Y MODULO DE ADMINISTRACION
echo ========================================================
start "Trueka App (:3005)" start-app.bat
timeout /t 1 /nobreak >nul
start "Trueka Admin (:3006)" start-admin.bat

echo.
echo [OK] Ambos servicios iniciados:
echo - Web Principal: http://localhost:3005
echo - Modulo Admin:  http://localhost:3006
echo.
pause
