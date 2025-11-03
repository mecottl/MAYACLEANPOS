# Proyecto: LavanderPOS 🧺

Un Punto de Venta (POS) web moderno para lavanderías, enfocado en la automatización de la comunicación con el cliente y programas de lealtad.

## Propósito del Proyecto

El objetivo es crear un sistema POS que no solo gestione clientes y pedidos, sino que también mejore la retención de clientes a través de:

* Gestión de pedidos (por kilo o prenda).
* Notificaciones de estado (Ticket, Pedido Listo, En Entrega).
* Sistema de lealtad (ej. "décimo servicio gratis").
* Gestión de servicio a domicilio.
* Dashboard de pedidos con estado de tiempo real (A Tiempo, Demorado, Atrasado).

## Tech Stack (Tecnologías)

* **Backend:** Node.js (ESM) con Express.js.
* **Base de Datos:** Neon (PostgreSQL).
* **Frontend:** HTML5, CSS3 y JavaScript (Vanilla JS).
* **Gestor de Paquetes:** `pnpm`.
* **Notificaciones:** SendGrid (Email) y `wa.me` (WhatsApp).
* **Despliegue:**
    * **Backend (API):** Render
    * **Base de Datos:** Neon
    * **Frontend:** Vercel

---

## 🚧 Roadmap (TODO List) 🚧

Esta es la guía de pasos para construir el proyecto.

### Fase 1: Backend - Autenticación y Seguridad (El Login)
* [X] **(Backend)** Crear la carpeta `src/routes/auth.routes.js` y `src/controllers/auth.controller.js`.
* [X] **(Backend)** Instalar `bcryptjs` y `jsonwebtoken` (`pnpm add bcryptjs jsonwebtoken`).
* [X] **(Backend)** [Ruta `POST /api/auth/register`]
    * Crear la función `register` en el controlador.
    * Recibir `email` y `password` del `req.body`.
    * *Hashear* la contraseña con `bcryptjs.hash()`.
    * Guardar el nuevo `Usuario` (con la contraseña hasheada) en la base de datos de Neon.
* [x] **(Backend)** [Ruta `POST /api/auth/login`]
    * Crear la función `login` en el controlador.
    * Buscar al usuario por `email`.
    * Comparar la contraseña del `req.body` con la hasheada en la DB usando `bcryptjs.compare()`.
    * Si es exitoso, crear un `jsonwebtoken` (JWT) que incluya el `id` y el `rol` del usuario.
    * Enviar el token al cliente.
* [X] **(Backend)** Crear un *middleware* `verificarToken.js` que lea el JWT del `Authorization header` y verifique su validez.

### Fase 2: Backend - Lógica de Negocio (Clientes y Pedidos)
* [X] **(Backend)** Crear las rutas y controladores para `Clientes` (`clientes.routes.js`, `clientes.controller.js`).
    * `POST /api/clientes` (Crear nuevo cliente).
    * `GET /api/clientes/buscar` (Buscar por `telefono`).
* [X] **(Backend)** Crear las rutas y controladores para `Pedidos` (`pedidos.routes.js`, `pedidos.controller.js`).
* [X] **(Backend)** [Ruta `GET /api/pedidos/dashboard`]
    * **¡Ruta Clave!** Proteger esta ruta con el *middleware* `verificarToken.js`.
    * Hacer la consulta a Neon: `SELECT * FROM Pedidos WHERE estado_flujo IN ('En Proceso', 'Listo') ORDER BY fecha_creacion ASC`.
    * Devolver la lista de pedidos activos.
* [X] **(Backend)** [Ruta `POST /api/pedidos`]
    * Proteger esta ruta.
    * Recibir datos del pedido (ej. `cliente_id`, `precio_total`).
    * Guardar el nuevo pedido en la base de datos.
* [X] **(Backend)** [Ruta `PUT /api/pedidos/:folio/estado`]
    * Proteger esta ruta.
    * Actualizar el `estado_flujo` (ej. a 'Listo' o 'Entregado') y el `estado_pago` (a 'Pagado').
* [X] **(Backend)** [Lógica de Lealtad]
    * Al marcar un pedido como 'Entregado' Y 'Pagado', ejecutar una segunda consulta: `UPDATE Clientes SET contador_servicios = contador_servicios + 1 WHERE id = $1`.

### Fase 3: Frontend - Vistas y Lógica (Vanilla JS)
* [ ] **(Frontend)** Crear la carpeta `frontend/` con `index.html` (Login), `dashboard.html`, `style.css` y `src/`.
* [ ] **(Frontend)** Crear `src/services/api.js`.
    * Este módulo centralizará todas las llamadas `fetch()` a tu backend en Render.
    * Tendrá funciones como `login(email, password)`, `getDashboardPedidos(token)`, etc.
* [ ] **(Frontend)** [Lógica de Login]
    * Crear `src/login.js` (e importarlo en `index.html`).
    * Añadir un `addEventListener` al formulario de login.
    * Al hacer submit, llamar a `api.login()`.
    * Si es exitoso, guardar el token en `localStorage`.
    * Redirigir a `dashboard.html`.
* [ ] **(Frontend)** [Lógica de Dashboard]
    * Crear `src/dashboard.js` (e importarlo en `dashboard.html`).
    * Al cargar la página, buscar el token en `localStorage`. Si no existe, redirigir a `index.html`.
    * Llamar a `api.getDashboardPedidos(token)`.
    * Renderizar dinámicamente las "tarjetas de pedido" en un `<div>`.
* [ ] **(Frontend)** [Lógica de Estado de Tiempo (24h)]
    * En `dashboard.js`, al renderizar cada tarjeta, calcular las horas pasadas (`new Date() - new Date(pedido.fecha_creacion)`).
    * Añadir una clase CSS (`.verde`, `.amarillo`, `.rojo`) a la tarjeta basado en las horas (ej: < 18h, 18-24h, > 24h).
* [ ] **(Frontend)** [Lógica de Roles]
    * (Opcional v1) Decodificar el JWT en el frontend para leer el `rol`.
    * Ocultar botones (ej. 'Contabilidad') si el `rol` no es 'admin'.

### Fase 4: Notificaciones y Despliegue
* [ ] **(Backend)** [Fase 1: Email]
    * Instalar SendGrid (`pnpm add @sendgrid/mail`).
    * Crear `src/services/notificaciones.service.js`.
    * Llamar a `notificaciones.enviarTicket(pedido)` después de crear un pedido (en `pedidos.controller.js`).
* [ ] **(Frontend)** [Fase 2: WhatsApp]
    * En `dashboard.js`, al renderizar las tarjetas, añadir un botón "Avisar por WhatsApp".
    * El `href` de ese botón debe ser el enlace `wa.me/` generado dinámicamente (`https://wa.me/TELEFONO?text=Tu%20pedido%20esta%20listo...`).
* [ ] **(Deploy)** [Keep-Alive de Neon]
    * Crear la ruta `GET /api/keep-alive` en el backend (que hace `SELECT 1`).
    * Crear el archivo `.github/workflows/keep-alive.yml` en la raíz del proyecto para "pingear" esa ruta diariamente.
* [ ] **(Deploy)** Desplegar el `backend/` en Render.
* [ ] **(Deploy)** Desplegar el `frontend/` en Vercel.
* [ ] **(Deploy)** Configurar las Variables de Entorno (`DATABASE_URL`, `SENDGRID_API_KEY`, `JWT_SECRET`) en Render.

---

## Estructura de Carpetas