# 📜 OPCIÓN 1: El Baúl Vintage — Tienda Minimalista Monolítica de Segunda Mano

**Estado:** GUARDADA Y ACTIVA (Versión 1.0)  
**Ubicación:** `C:\code\mpold`  
**Servidor Local:** `http://localhost:3000`

---

## 📌 Resumen de la Opción 1

Esta opción es una **tienda minimalista de artículos de segunda mano y coleccionables vintage**, construida sobre un **monolito ultra ligero en Go** con desarrollo guiado por especificaciones (SDD).

### 🚀 Características de la Opción 1:

- **Monolito en Go + Fiber**: Sin Python, sin FastAPI, sin node_modules ni microservicios pesados.
- **Consumo de Recursos Mínimo**: `< 10 MB` de RAM y **0% CPU** en reposo.
- **Diseño Dual Vintage**:
  - **Modo Pergamino (Claro)**: Tonos papel antiguo, sellos de cera, acentos de latón y cobre.
  - **Modo Noir (Oscuro)**: Fondo terciopelo oscuro, oro viejo y ámbar.
- **Venta de Segunda Mano**: Catálogo para objetos de época (1/1), estado de conservación (1-10), pátina natural y dimensiones.
- **Formulario "+ Vender Artículo"**: Permite a usuarios/vendedores publicar objetos vintage directamente en el catálogo.
- **Carrito & Pedidos por WhatsApp**: Formateo automático de pedidos ricos hacia WhatsApp para compra o reserva directa sin comisiones.
- **Persistencia Local**: Guardado en archivo plano `data/products.json`.

---

## 🗂️ Estructura Guardada

- [`SPEC.md`](file:///C:/code/mpold/SPEC.md) — Especificaciones de arquitectura SDD.
- [`STACK.md`](file:///C:/code/mpold/STACK.md) — Stack técnico Go + HTML5/CSS3/JS Vanilla.
- [`DEPLOYMENT.md`](file:///C:/code/mpold/DEPLOYMENT.md) — Comandos de arranque y compilación.
- [`README.md`](file:///C:/code/mpold/README.md) — Resumen ejecutivo y guía rápida.
- [`cmd/app/main.go`](file:///C:/code/mpold/cmd/app/main.go) — Punto de entrada del binario Go.
- [`internal/server/server.go`](file:///C:/code/mpold/internal/server/server.go) — Servidor HTTP Fiber.
- [`internal/store/store.go`](file:///C:/code/mpold/internal/store/store.go) — Motor de almacenamiento persistente.
- [`internal/handler/product.go`](file:///C:/code/mpold/internal/handler/product.go) — Controladores de productos y checkout.
- [`internal/model/product.go`](file:///C:/code/mpold/internal/model/product.go) — Estructuras de datos.
- [`web/static/index.html`](file:///C:/code/mpold/web/static/index.html) — Interfaz HTML5.
- [`web/static/style.css`](file:///C:/code/mpold/web/static/style.css) — CSS nativo con variables claro/oscuro.
- [`web/static/app.js`](file:///C:/code/mpold/web/static/app.js) — Aplicación en JavaScript nativo.
- [`data/products.json`](file:///C:/code/mpold/data/products.json) — Base de datos JSON local.

---

## 🛠️ Comando para Ejecutar esta Opción

```powershell
cd C:\code\mpold
go run .\cmd\app
```
