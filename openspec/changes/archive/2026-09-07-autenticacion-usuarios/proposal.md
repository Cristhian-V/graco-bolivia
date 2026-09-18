## Why

La aplicación SUMA expone hoy todas sus secciones y toda su API sin ningún control de acceso: cualquiera que alcance el servidor puede ver los datos, descargar el Excel o disparar las corridas del scraper. Se necesita autenticación con roles para que solo los operadores autorizados accedan, y para limitar a los usuarios de tipo "presentación" a la única sección que les corresponde.

## What Changes

- Se agrega autenticación por usuario y contraseña con emisión de **JWT** en **cookie httpOnly**.
- Se crea una tabla `usuarios` con roles `admin` y `presentacion` (hash de contraseña con `scrypt`, sin texto plano).
- Se crea por defecto una cuenta `admin` al arrancar, con la contraseña tomada de `ADMIN_PASSWORD` en el `.env`.
- El rol `admin` ve **todas** las secciones y además una nueva sección **Usuarios** para crear y editar cuentas (y desactivarlas con `activo=false`; sin borrado).
- El rol `presentacion` ve **solo** la sección Presentación (puede usar sus filtros y pestañas).
- El backend protege toda la API con middleware: `presentacion` solo accede a `/api/auth/*` y `/api/dashboard/*`; el resto es solo `admin`.
- Login/logout/`me` en `/api/auth/*` y CRUD de usuarios en `/api/usuarios/*` (solo admin).

## Capabilities

### New Capabilities
- `autenticacion`: autenticación de operadores, roles, control de acceso en backend y frontend, y gestión de cuentas de usuario.

### Modified Capabilities

(ninguna — el acceso protegido se describe como requisitos de la nueva capacidad)

## Impact

- **Base de datos**: nueva tabla `usuarios` (`db/init/007_usuarios.sql`).
- **Backend**: nuevo `services/authService.js` (hash `scrypt`, firma/verificación JWT), `middleware/auth.js` (requireAuth/requireAdmin), endpoints `/api/auth/*` y `/api/usuarios/*`; aplicación del middleware en `index.js` con lista blanca para auth y health.
- **Dependencia nueva**: `jsonwebtoken` en `backend/package.json`.
- **Frontend**: pantalla de login, estado de sesión (consulta a `/api/auth/me`), filtrado de `SECTIONS` por rol, sección `Usuarios` (solo admin), logout.
- **Configuración**: `JWT_SECRET` y `ADMIN_PASSWORD` en el `.env`.
- **Sin breaking changes** para los flujos existentes del scraper (solo quedan protegidos tras login).
