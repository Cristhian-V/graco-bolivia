## 1. Base de datos y configuración

- [x] 1.1 Crear `db/init/007_usuarios.sql` con la tabla `usuarios` (`usuario` único, `password_hash`, `rol`, `activo`) y verificar con `docker compose up -d` que el init reporta 7 archivos y la tabla existe
- [x] 1.2 Agregar `JWT_SECRET` y `ADMIN_PASSWORD` al `.env` y pasarlos en `docker-compose.yml`; verificar que el backend los lee (`config.js`)

## 2. Backend — autenticación

- [x] 2.1 Agregar `jsonwebtoken` a `backend/package.json` y verificar `npm install`/build del contenedor
- [x] 2.2 Crear `services/authService.js` con hash/verificación `scrypt` y firma/verificación JWT; verificar con `node --check`
- [x] 2.3 Crear el admin por defecto al arrancar (`initAdmin` en `index.js`) hasheando `ADMIN_PASSWORD` solo si no existe; verificar en la BD que la cuenta `admin` aparece con hash y rol admin
- [x] 2.4 Crear `middleware/auth.js` (`requireAuth`, `requireAdmin`) y endpoints `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`; verificar login con `curl` (cookie emitida) y `me` devuelve usuario y rol

## 3. Backend — control de acceso

- [x] 3.1 Aplicar el middleware en `index.js` con lista blanca para login/health y montar el router bajo `requireAuth`; verificar que sin cookie `/api/combustibles` responde 401
- [x] 3.2 Restringir por rol: permitir `/api/dashboard/*` a ambos roles y el resto solo admin; verificar que una cuenta `presentacion` recibe 403 en `/api/combustibles` y 200 en `/api/dashboard/data`

## 4. Backend — gestión de usuarios

- [x] 4.1 Crear `GET /api/usuarios`, `POST /api/usuarios`, `PUT /api/usuarios/:id` (solo admin, sin borrado) en `api.js` o router propio; verificar crear/editar y que una cuenta con `activo=false` no puede iniciar sesión
- [x] 4.2 Verificar que el admin puede editar su propia cuenta y las demás, y que el rol `presentacion` recibe 403 en `/api/usuarios`

## 5. Frontend — login y roles

- [x] 5.1 Agregar `login`/`logout`/`me` a `api.js` y crear pantalla de login; verificar `vite build` y que sin sesión se muestra el login
- [x] 5.2 Al cargar, consultar `/api/auth/me` y filtrar `SECTIONS` por rol (admin: todas + Usuarios; presentacion: solo Presentación); verificar cada vista por rol
- [x] 5.3 Crear la sección `Usuarios` (solo admin): listar cuentas, formulario de crear/editar y toggle de `activo`; verificar creación, edición y desactivación

## 6. Integración y validación

- [x] 6.1 Verificar end-to-end: login admin y presentacion, visibilidad de secciones, protección de endpoints y que las corridas programadas siguen funcionando
- [x] 6.2 Marcar las tareas completadas y validar con `openspec validate autenticacion-usuarios`
