# Guía de Ejecución y Despliegue — El Baúl Vintage

## Arrancar en Desarrollo Local

Abre la consola en PowerShell o CMD:

```powershell
cd C:\code\mpold
go mod tidy
go run .\cmd\app
```

Abrir la aplicación en tu navegador: `http://localhost:3000`

## Compilar un Binario Autónomo Monolítico

```powershell
go build -o .\el-baul-vintage.exe .\cmd\app
```

Ejecutar el ejecutable directo:

```powershell
.\el-baul-vintage.exe
```

## Características de Producción

- **Sin dependencias externas**: No requiere base de datos SQL separada ni servicios de terceos para funcionar.
- **Persistencia**: Todos los artículos creados o modificados se guardan automáticamente en `C:\code\mpold\data\products.json`.
