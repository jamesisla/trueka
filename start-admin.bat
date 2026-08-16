@echo off
title Trueka - Modulo de Administracion (Puerto 3006)
echo ========================================================
echo   TRUEKA - INICIANDO MODULO DE ADMINISTRACION
echo   Panel: http://localhost:3006
echo ========================================================
set PORT=3006
set ADMIN_PORT=3006
set MAIN_PORT=3005
if exist "trueka-admin.exe" (
    trueka-admin.exe
) else (
    go run .\cmd\admin
)
pause
