# Especificación para desarrollo (SDD) — RetroBay 80s (Opción 2)

## Propósito

Especificar la arquitectura, interfaz y criterios de aceptación del sistema monolítico de comercio de segunda mano **RetroBay 80s**, con estética eBay de los 80, consumo de recursos ultra bajo (< 10MB RAM) y desarrollo guiado por especificaciones (SDD).

## Opciones Disponibles en la Base

- **Opción 1**: [`OPCION_1.md`](file:///C:/code/mpold/OPCION_1.md) — *El Baúl Vintage (Estilo Pergamino & Antigüedades Clásicas)*.
- **Opción 2**: [`OPCION_2.md`](file:///C:/code/mpold/OPCION_2.md) — *RetroBay 80s (Estilo eBay Retro de los 80s con Casetes, Walkman, Polaroid & CRT Neon)* **[ACTIVA]**.

## Criterios de Aceptación

- [x] **Logotipo e Interfaz eBay 80s**: Logo multicolor e-b-a-y, tarjetas de anuncios estilo subasta 80s con reputación de vendedor (`⭐ 99.8%`).
- [x] **Reloj Digital 80s**: Temporizador regresivo animado para la "subasta de la semana".
- [x] **Monolito de Bajo Consumo**: Servidor ejecutable único en Go con Fiber y archivos estáticos.
- [x] **Persistencia JSON**: Los anuncios se guardan en `data/products.json`.
- [x] **Publicar Anuncio 80s**: Formulario interactivo "+ VENDER ARTÍCULO 80s" para agregar productos de segunda mano en tiempo real.
- [x] **Modo Dual 80s**: 80s Paper Catalog (Claro) y 80s CRT Neon Arcade (Oscuro) alternables con un clic.
- [x] **Checkout WhatsApp**: Formato de pedido directo a WhatsApp.
