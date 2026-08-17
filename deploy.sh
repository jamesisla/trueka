#!/usr/bin/env bash
set -e

# ==============================================================================
# Trueka — Script de Despliegue Rápido y Optimizado para OCI (Oracle Cloud)
# Diseñado para instancias 1 vCPU / 1GB RAM (Monolito Nativo en Go)
# ==============================================================================

echo "🚀 Iniciando despliegue de Trueka..."

# 1. Obtener última versión desde GitHub
echo "📦 Actualizando código desde Git..."
git pull origin main || git pull

# 2. Compilar binarios nativos Go con optimización de tamaño y velocidad
echo "🔨 Compilando binarios nativos Go (App + Admin)..."
export CGO_ENABLED=0
go build -ldflags="-s -w" -o trueka ./cmd/app
go build -ldflags="-s -w" -o trueka-admin ./cmd/admin

# 3. Asegurar permisos y directorios
mkdir -p data web/static/uploads
chmod +x trueka trueka-admin

# 4. Reiniciar servicios systemd si están activos
if systemctl is-active --quiet trueka; then
    echo "🔄 Reiniciando servicio systemd trueka..."
    sudo systemctl restart trueka
else
    echo "ℹ️ Servicio trueka no activo aún. Puedes iniciarlo con: sudo systemctl start trueka"
fi

if systemctl is-active --quiet trueka-admin; then
    echo "🔄 Reiniciando servicio systemd trueka-admin..."
    sudo systemctl restart trueka-admin
fi

echo "✅ Despliegue completado con éxito. Trueka (App + Admin) listos."
