# Stack de Desarrollo Monolítico — El Baúl Vintage

## Tecnologías Principales

- **Lenguaje Principal**: Go 1.22+
- **Framework Web**: Fiber v2 (Alto rendimiento, ultra ligero)
- **Frontend**: HTML5 Semántico + CSS Vanilla (Variables CSS, Flexbox/Grid, Animaciones) + JavaScript ES6+ Nativo
- **Almacenamiento**: Persistencia local basada en JSON (`data/products.json`) segura para concurrencia (`sync.RWMutex`).
- **Recursos Gráficos**: Fotos vintage optimizadas servidas nativamente bajo `/static/images/`.

## Ventajas del Stack Monolítico

1. **Recursos Mínimos**: Consume < 10 MB de RAM y 0% CPU en reposo.
2. **Binario Único**: No requiere Node.js, Python, FastAPI ni servidores adicionales. Todo corre en un solo proceso.
3. **Estilo Vintage & Temas**: Sistema completo de modo claro ("Pergamino") y oscuro ("Noir") sin librerías externas.
4. **Respuesta Inmediata**: Tiempos de respuesta de la API menores a 2 milisegundos.

## Estructura del Código

- `cmd/app/main.go` — Punto de entrada del binario
- `internal/server/server.go` — Configuración del servidor Fiber, rutas estáticas y API
- `internal/handler/product.go` — Controladores HTTP para productos y pedidos
- `internal/store/store.go` — Motor de almacenamiento persistente con precarga de catálogo
- `internal/model/product.go` — Estructuras de datos de dominio
- `web/static/` — Frontend estático (index.html, style.css, app.js, imágenes)
