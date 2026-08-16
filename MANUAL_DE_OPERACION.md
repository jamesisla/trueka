# Manual de Operación y Documentación Técnica — Trueka & Trueka Admin

---

## 1. Descripción General del Sistema

**Trueka** es una plataforma colaborativa y minimalista de comercio e intercambio de artículos de segunda mano y colección (*trueque moderno*). Su propósito es facilitar el intercambio directo entre personas sin intermediarios ni comisiones, promoviendo la economía circular y la reutilización de objetos con valor histórico, estético o funcional.

### Arquitectura Técnica
* **Núcleo del Servidor:** Monolito en **Go (Fiber v2)** diseñado para consumo ultra-bajo de recursos (< 10 MB RAM en reposo, < 15 MB en alta concurrencia).
* **Persistencia:** Archivos JSON thread-safe en disco (`data/products.json` y `data/config.json`) con lecturas atómicas y bloqueo por mutex `sync.RWMutex`.
* **Frontend:** Vanilla HTML5, CSS3 moderno con variables CSS y JavaScript nativo sin dependencias externas ni frameworks pesados (0 KB de librerías externas).
* **Módulos Desacoplados:**
  1. **Trueka Web Principal (Puerto 3005):** Aplicación pública orientada al usuario final para navegar, publicar y acordar intercambios.
  2. **Trueka Admin & CMS (Puerto 3006):** Módulo independiente para gestión de contenidos fijos, moderación de anuncios y supervisión del estado del servidor.

---

## 2. Manual de Operación: Sitio Público de Intercambio (:3005)

### 2.1. Inicio del Servicio
* **Windows (Script):** Doble clic en `start-app.bat`.
* **Terminal:**
  ```powershell
  cd C:\code\trueka
  go run .\cmd\app
  # O bien con el ejecutable compilado:
  .\trueka-app.exe
  ```
* **Acceso en el navegador:** [http://localhost:3005](http://localhost:3005)

---

### 2.2. Identidad y Perfil de Usuario
* En la esquina superior derecha del encabezado se encuentra el botón de usuario con el alias activo (por defecto `@usuario`).
* Haz clic sobre este botón para definir o cambiar tu alias de usuario (ej. `@antonio_retro`).
* Este alias se utilizará de forma automática cada vez que publiques un artículo o envíes una propuesta de trueke.

---

### 2.3. Publicar un Artículo para Trueke
1. Haz clic en el botón principal **"+ Publicar Trueke"** en el encabezado o en el banner principal.
2. Completa los datos en el formulario:
   * **Foto del artículo:** Arrastra una imagen a la zona de carga (PNG, JPG, WebP hasta 5MB) o utiliza los botones de fotos de ejemplo.
   * **Título del artículo:** Nombre claro del objeto (ej. *Cámara Réflex Olympus OM-1*).
   * **Categoría:** Selecciona entre *Audio & Vinilos*, *Cámaras & Foto*, *Consolas & Juegos*, *Escritorio & Libros*, *Relojes*, etc.
   * **Valor estimado de referencia (€):** Valor monetario aproximado para guiar la equivalencia en el trueque.
   * **Estado de conservación:** Puntuación del 1 al 10 con descripción (ej. *Excelente 9/10*).
   * **Época / Estilo:** Año o década aproximada (ej. *Años 80*, *Art Déco*).
   * **¿Qué buscas a cambio? (Wishlist):**
     * Selecciona una o más categorías de interés.
     * Describe en detalle qué artículos específicos te gustaría recibir (ej. *Busco tocadiscos portátil o vinilos de jazz*).
   * **Datos de contacto:** Tu WhatsApp y tu ubicación aproximada (ej. *Madrid Centro*).
3. Haz clic en **"Publicar en Trueka"**. El artículo aparecerá de inmediato en el catálogo público.

---

### 2.4. Exploración y Modos de Búsqueda
Trueka cuenta con un sistema de exploración bidireccional:
* **Modo "📦 Artículos Ofrecidos":** Muestra los objetos que los usuarios tienen disponibles para entregar.
* **Modo "🎯 ¿Qué buscan los usuarios?":** Filtra los anuncios según lo que los dueños andan buscando recibir. Permite encontrar usuarios que estén buscando exactamente lo que tú tienes en casa para intercambiar.
* **Filtros por estado:** Permite alternar entre artículos disponibles y truekes ya completados.
* **Ordenamiento:** Por más recientes, mayor número de ofertas recibidas o valor estimado.

---

### 2.5. Proponer un Intercambio & Coordinación
Al abrir el detalle de cualquier artículo:
1. **Proponer mi Artículo a Cambio:**
   * Abre el formulario de oferta vinculada.
   * Permite subir la foto y descripción de tu artículo ofertado.
   * **Casilla "Publicar también este artículo en el catálogo general":** Al marcarla, tu objeto no solo se le ofrece al dueño, sino que también ingresa al catálogo público de Trueka para que otros usuarios lo descubran.
2. **Proponer Trueke directo por WhatsApp:**
   * Genera un mensaje formateado con los datos de ambos artículos y abre una conversación directa con el dueño en WhatsApp Web o móvil.
3. **Aceptar o Rechazar Propuestas:**
   * En el detalle del artículo se listan todas las ofertas recibidas.
   * El dueño puede pulsar **"Aceptar Propuesta"**, lo que cambiará el estado de ambos artículos a `trueke_completado`.

---

### 2.6. Guardar Artículos ("Mis Truekes") y Modo Visual
* **Mis Truekes:** Puedes pulsar en el botón ⭐ para guardar artículos en tu cajón lateral y luego iniciar una conversación conjunta vía WhatsApp.
* **Modo Claro / Oscuro:** Pulsa el botón del sol/luna en la cabecera para alternar entre el tema **Canvas** (editorial claro) y **Noir** (alto contraste nocturno).

---

## 3. Manual de Operación: Módulo Independiente de Administración (:3006)

El módulo de administración es un servidor independiente concebido para operar en paralelo, con control de ciclo de vida desacoplado y consumo inferior a 3 MB de RAM.

### 3.1. Inicio y Parada del Módulo Admin

#### A. Iniciar el Módulo:
* **Windows (Script):** Doble clic en `start-admin.bat`.
* **Terminal:**
  ```powershell
  cd C:\code\trueka
  go run .\cmd\admin
  # O con el binario:
  .\trueka-admin.exe
  ```
* **Acceso al Panel:** [http://localhost:3006](http://localhost:3006)

#### B. Detener el Módulo mediante API o Interfaz:
1. **Vía Panel Web:** Haz clic en el botón rojo **"🛑 Detener Admin"** en la barra superior.
2. **Vía Script:** Ejecuta `stop-admin.bat`.
3. **Vía Petición HTTP / Terminal:**
   ```bash
   curl -X POST http://localhost:3006/api/admin/stop
   ```

---

### 3.2. Pestaña 1: Gestor de Mensajes Fijos (CMS)

Esta sección permite modificar todos los textos estáticos de la portada de Trueka con **Vista Previa en Vivo**:

| Sección en CMS | Campo Editable | Efecto en la Web Principal |
| :--- | :--- | :--- |
| **1. Cintillo Superior** | Interruptor Mostrar/Ocultar | Oculta o muestra la barra superior de avisos. |
| | Texto Principal del Cintillo | Mensaje general de aviso / bienvenida. |
| | Etiqueta / Tag destacada | Badge (ej. `Monolito Go Superligero`). |
| **2. Marca & Header** | Lema del Logo (Tagline) | Texto debajo de `trueka` (ej. `intercambio & trueque directo`). |
| | Placeholder del buscador | Texto de ayuda en la caja de búsqueda. |
| **3. Sección Central (Hero)** | Título Central H1 | Encabezado principal (`Intercambia Artículos Sin Complicaciones`). |
| | Subtítulo Central | Párrafo descriptivo debajo del título central. |
| **4. Pasos 1, 2 y 3** | Texto Paso 1 | Explicación del primer paso del flujo. |
| | Texto Paso 2 | Explicación del segundo paso del flujo. |
| | Texto Paso 3 | Explicación del tercer paso del flujo. |
| **5. Pie de Página (Footer)**| Mensaje Principal Footer | Lema de economía circular en el pie de página. |
| | Copyright / Leyenda | Texto de derechos reservados y créditos. |

#### Pasos para aplicar cambios:
1. Edita el texto deseado en los campos de la izquierda.
2. Observa la tarjeta de **Vista Previa en Vivo** en la columna derecha para validar el aspecto visual.
3. Haz clic en **"💾 Guardar Todos los Cambios"**.
4. Los cambios se guardan en `data/config.json` y se reflejan de inmediato en la web sin necesidad de reiniciar la app.
5. Para volver a los textos originales de fábrica, haz clic en **"🔄 Restaurar Predeterminados"**.

---

### 3.3. Pestaña 2: Gestor de Artículos

Permite auditar y moderar el catálogo general:
* **Buscador en tiempo real:** Filtra artículos por título, vendedor o categoría.
* **Filtro por estado:** Visualiza solo disponibles o solo truekes completados.
* **Cambiar Estado:** Permite alternar manualmente el estado de un artículo entre *Disponible* y *Trueke Realizado*.
* **Eliminar:** Botón 🗑️ para borrar permanentemente un artículo publicado.

---

### 3.4. Pestaña 3: Propuestas de Trueke

Ofrece una vista consolidada de todas las ofertas de intercambio enviadas en la plataforma:
* Muestra el usuario proponente y su contacto de WhatsApp.
* Visualización gráfica del objeto ofrecido frente al objeto destino.
* Mensaje personalizado adjunto a la propuesta.
* Estado actual de la negociación (*pendiente*, *aceptada*, *rechazada*).

---

### 3.5. Pestaña 4: Control API & Diagnóstico del Sistema

* **Métricas en tiempo real:** Versión del compilador Go, memoria RAM asignada en MB, conteo de Goroutines y tiempo de actividad (*uptime*).
* **Monitor de la App Principal:** Verifica periódicamente si el servidor público en el puerto 3005 está en línea.
* **Referencia de Endpoints API:** Documentación interactiva de las rutas REST disponibles para integración y control remoto.

---

## 4. Tabla Resumen de Endpoints de la API

| Método | Endpoint | Módulo | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | App (3005) | Verificación de salud y estado del servicio cliente. |
| `GET` | `/api/config` | App & Admin | Obtiene los textos y mensajes fijos actuales en formato JSON. |
| `PUT` | `/api/config` | App & Admin | Actualiza los textos fijos del sitio (CMS). |
| `POST` | `/api/config/reset` | App & Admin | Restablece los textos a la configuración predeterminada. |
| `GET` | `/api/products` | App & Admin | Lista de artículos con filtros de búsqueda, categoría y estado. |
| `POST` | `/api/products` | App | Publicación de un nuevo artículo para trueke. |
| `POST` | `/api/upload` | App | Carga de archivos de imagen al directorio `web/static/uploads`. |
| `POST` | `/api/products/:id/propose`| App | Envía una propuesta de intercambio vinculada a un artículo. |
| `GET` | `/api/admin/status` | Admin (3006) | Diagnóstico completo de RAM, Uptime y estado de la app en :3005. |
| `POST` | `/api/admin/stop` | Admin (3006) | Detiene ordenadamente el servidor de administración. |
| `GET` | `/api/admin/proposals` | Admin (3006) | Lista consolidada de todas las propuestas de intercambio. |
| `DELETE`| `/api/admin/products/:id`| Admin (3006) | Eliminación definitiva de un artículo por moderación. |

---

---

## 5. Arquitectura de Seguridad & Blindaje Ligero

El sistema cuenta con 5 capas de protección nativa sin añadir peso ni dependencias externas:

1. **Autenticación en Admin por Token Secreto:**
   * Las rutas de modificación en el Admin (`/api/admin/config`, `/api/admin/stop`, `/api/admin/products/:id`) requieren el header `X-Admin-Token` o el parámetro `?secret=...`.
   * La clave por defecto en local es `trueka-admin-2026`. Para producción se puede personalizar con la variable de entorno:
     ```powershell
     $env:ADMIN_SECRET="MiClaveSuperSegura2026!"; .\trueka-admin.exe
     ```
2. **Cabeceras de Seguridad HTTP (Helmet):**
   * `X-Frame-Options: SAMEORIGIN` (evita Clickjacking).
   * `X-Content-Type-Options: nosniff` (evita ejecución de scripts en estáticos).
   * `X-XSS-Protection: 1; mode=block` (bloqueo XSS en navegadores).
   * `Referrer-Policy: strict-origin-when-cross-origin`.
3. **Control de Abuso y Anti-DoS (Rate Limiting Nativo):**
   * Límite general: Máximo 120 peticiones/minuto por dirección IP.
   * Límite de subida de fotos: Máximo 15 subidas/minuto por dirección IP.
   * Límite de administración: Máximo 150 peticiones/minuto.
4. **Blindaje de Archivos Subidos (Magic Bytes):**
   * Inspección binaria de los primeros 512 bytes del archivo (`http.DetectContentType`) para verificar que sea una imagen real (JPG, PNG, WebP o GIF), rechazando scripts o ejecutables camuflados.
   * Generación de nombres aleatorios (`upload_timestamp_random.ext`) para prevenir *Path Traversal*.
5. **Validación y Límites de Longitud:**
   * Títulos restringidos a 120 caracteres, descripciones a 1,500 caracteres y sanitización en frontend y backend.

---

## 6. Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

### ¿Qué hacer si el puerto 3005 o 3006 está ocupado?
Puedes cambiar el puerto asignando la variable de entorno `PORT` o `ADMIN_PORT` antes de ejecutar:
```powershell
$env:PORT="3010"; .\trueka-app.exe
$env:ADMIN_PORT="3011"; .\trueka-admin.exe
```

### ¿Cómo cambiar la clave del Administrador?
Basta con definir la variable de entorno `ADMIN_SECRET` antes de iniciar el binario de administración:
```powershell
$env:ADMIN_SECRET="TuClavePersonalizada"; .\trueka-admin.exe
```

### ¿Los cambios del CMS se pierden al apagar la máquina?
No. Todos los cambios se guardan de forma persistente en `data/config.json`. Al reiniciar el servidor, se cargan automáticamente los textos guardados.

### ¿Se pueden ejecutar ambos servidores a la vez?
Sí. El archivo `start-all.bat` inicia automáticamente la aplicación pública en el puerto 3005 y el módulo de administración en el puerto 3006 en ventanas independientes.

