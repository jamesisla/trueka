# Trueka — Plataforma de Intercambio & Trueque de Segunda Mano

**Trueka** es una plataforma colaborativa y minimalista de trueque e intercambio de artículos de segunda mano y colección, diseñada con un monolito en **Go (Fiber)** de consumo ultra-bajo (< 10MB RAM) y un frontend en **Vanilla HTML/CSS/JS** con estética cuidada en modo Claro ("Canvas") y Oscuro ("Noir").

## Concepto y Flujo de Intercambio

1. **Publicar lo que ofreces:**
   - Sube una foto de tu artículo (desde archivo local, URL o demo).
   - Selecciona la categoría, estado de conservación (puntuación /10) y descripción.
   - Indica las categorías o artículos específicos que **buscas a cambio** (*wishlist de trueke*).

2. **Descubrimiento Inteligente:**
   - Modo de exploración dual:
     - **"📦 Artículos Ofrecidos"**: Encuentra lo que otros usuarios tienen disponible.
     - **"🎯 ¿Qué buscan los usuarios?"**: Descubre qué usuarios están buscando lo que tú tienes para intercambiar.

3. **Vincular Ofertas & Promoción Circular:**
   - Al ver un artículo, cualquier usuario puede proponer un trueke directo con un artículo propio.
   - El artículo ofertado se vincula al anuncio original y **también entra al catálogo público de Trueka** para que otros miembros puedan descubrirlo y proponer intercambios.
   - Comunicación directa por WhatsApp con mensajes formateados automáticamente.

## Ejecución Rápida

```powershell
cd C:\code\trueka
go run .\cmd\app
```

Abre `http://localhost:3005` en tu navegador.
