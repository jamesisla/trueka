@echo off
title Trueka - App Principal (Puerto 3005)
echo ========================================================
echo   TRUEKA - INICIANDO APLICACION PRINCIPAL
echo   Web: http://localhost:3005
echo ========================================================
set PORT=3005
if exist "trueka-app.exe" (
    trueka-app.exe
) else (
    go run .\cmd\app
)
pause
