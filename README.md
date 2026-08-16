# Trueka — Plataforma de Intercambio & Trueque con CMS y Módulo de Administración Independiente

**Trueka** es una plataforma colaborativa y minimalista de trueque e intercambio de artículos de segunda mano y colección, diseñada con un monolito en **Go (Fiber)** de consumo ultra-bajo (< 10MB RAM) y un frontend en **Vanilla HTML/CSS/JS** con estética cuidada en modo Claro ("Canvas") y Oscuro ("Noir").

Incluye un **Módulo Independiente de Administración y CMS** que se puede iniciar, detener y controlar por separado mediante API o interfaz gráfica.

---

## Arquitectura de Módulos

```
C:\code\trueka
├── cmd/
│   ├── app/           # Servidor de la aplicación pública Trueka (Puerto 3005)
│   └── admin/         # Módulo independiente de administración y CMS (Puerto 3006)
├── data/
│   ├── config.json    # Mensajes fijos editables del sitio (CMS)
│   └── products.json  # Persistencia de artículos y propuestas de trueke
├── internal/
│   ├── admin/         # Servidor y API del módulo de administración
│   ├── handler/       # Controladores REST (Productos, Subidas, Configuración)
│   ├── model/         # Estructuras de datos (Product, TradeProposal, SiteConfig)
│   ├── server/        # Servidor web principal
│   └── store/         # Persistencia en disco y gestión de estado
└── web/
    ├── admin/         # Panel de Control & CMS Web (HTML/CSS/JS)
    └── static/        # Frontend público de Trueka
```

---

## 🚀 Ejecución de Módulos Independientes

### 1. Iniciar la Aplicación Principal (Puerto 3005)

**Opción A (Script):** Doble clic en `start-app.bat`

**Opción B (Terminal):**
```powershell
cd C:\code\trueka
go run .\cmd\app
# O usando el binario compilado:
.\trueka-app.exe
```
🌐 **Acceso Web:** [http://localhost:3005](http://localhost:3005)

---

### 2. Iniciar el Módulo Independiente de Administración (Puerto 3006)

**Opción A (Script):** Doble clic en `start-admin.bat`

**Opción B (Terminal):**
```powershell
cd C:\code\trueka
go run .\cmd\admin
# O usando el binario compilado:
.\trueka-admin.exe
```
🛠️ **Acceso Admin:** [http://localhost:3006](http://localhost:3006)

---

### 3. Iniciar Ambos Módulos a la Vez

Doble clic en `start-all.bat` para levantar la app principal y el panel de administración en ventanas independientes.

---

## 🛑 Control del Módulo de Administración vía API

Puedes bajar, subir o consultar el estado del módulo de administración de forma remota o local:

### 1. Detener el Módulo Admin vía API:
```powershell
# Mediante script:
.\stop-admin.bat

# Mediante petición HTTP / curl:
curl -X POST http://localhost:3006/api/admin/stop

# O desde PowerShell:
Invoke-RestMethod -Uri "http://localhost:3006/api/admin/stop" -Method Post
```

### 2. Consultar Estado & Métricas de Salud del Sistema:
```powershell
curl http://localhost:3006/api/admin/status
```
*Devuelve:* Uptime, memoria RAM (< 3MB), versión de Go, estado de la app principal (`online: true/false`), total de artículos y propuestas.

---

## 📝 Modificación de Mensajes Fijos (CMS)

Desde el panel en [http://localhost:3006](http://localhost:3006) en la pestaña **"Mensajes Fijos (CMS)"** podrás editar con vista previa en tiempo real:

1. **Cintillo Superior de Anuncio**:
   - Texto principal (ej: `🔄 trueka — Intercambia lo que tienes por lo que buscas`)
   - Etiqueta / Tag (ej: `Monolito Go Superligero` o personalizado)
   - Interruptor para mostrar u ocultar el cintillo
2. **Encabezado y Marca**:
   - Subtítulo del logotipo (`intercambio & trueque directo`)
   - Texto placeholder del buscador
3. **Sección Central (Hero)**:
   - Título Central H1 (`Intercambia Artículos Sin Complicaciones`)
   - Subtítulo explicativo
4. **Pasos Explicativos 1, 2 y 3**:
   - Paso 1: Publicación de artículo
   - Paso 2: Vinculación de propuestas
   - Paso 3: Catálogo circular
5. **Pie de Página (Footer)**:
   - Lema principal del footer
   - Leyenda de Copyright

> Todos los cambios se guardan instantáneamente en `data/config.json` y se sincronizan al cliente sin reiniciar el servidor.

---

## 🔄 Flujo de Intercambio de Trueka

1. **Publicar lo que ofreces:** Sube foto, condición (/10) y qué buscas a cambio.
2. **Descubrimiento Inteligente:** Explora artículos ofrecidos o revisa qué buscan otros miembros.
3. **Propuestas Vinculadas:** Propón intercambios directos con negociación y contacto por WhatsApp.
