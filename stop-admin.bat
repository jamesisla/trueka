@echo off
echo ========================================================
echo   TRUEKA - DETENIENDO MODULO DE ADMINISTRACION (:3006)
echo ========================================================
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:3006/api/admin/stop' -Method Post -TimeoutSec 2; Write-Host 'Admin detenido via API: ' $res.message } catch { Write-Host 'El modulo admin ya no responde o no estaba en ejecucion.' }"
timeout /t 2 /nobreak >nul
