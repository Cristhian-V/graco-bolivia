## Context

Ver `proposal.md` (Why/What Changes) y el spec de `autenticacion`. El backend es Express 4 (ESM) con `pg`, `node-cron` y `exceljs`; sirve todo `/api/*` sin control de acceso. El frontend es una SPA React/Vite servida por nginx que hace proxy de `/api` al backend. No existe ninguna autenticación de la propia app (las referencias a "auth" actuales son el login externo del scraper contra SUMA).

## Goals / Non-Goals

**Goals:**
- Autenticar operadores con usuario/contraseña y emitir JWT en cookie httpOnly.
- Restringir por rol tanto en el frontend como en el backend.
- Dar al admin un CRUD de cuentas (crear, editar, desactivar; sin borrado).

**Non-Goals:**
- No integrar con clientes/NIT ni con el login de SUMA.
- No implementar OAuth, 2FA ni recuperación de contraseña.
- No borrar cuentas (solo desactivar con `activo=false`).

## Decisions

### D1 — JWT en cookie httpOnly

Se firma un JWT con `jsonwebtoken` y `JWT_SECRET` del `.env` (expiración, ej. 8 h), y se entrega en cookie httpOnly + SameSite=Lax (protege contra XSS y, en una SPA same-origin, mitiga CSRF).

- Alternativa: token en `localStorage` con header `Authorization`. Descartada por el usuario: pidió cookie httpOnly.
- El frontend nunca lee el token; solo usa `/api/auth/me` para conocer usuario y rol.

### D2 — Hash de contraseña con `crypto.scrypt`

Hash con `scrypt` (built-in de Node, sin dependencia nativa) y salt aleatorio por contraseña, almacenado como `salt:hash` en `usuarios.password_hash`.

- Alternativa: `bcrypt` (dependencia nativa). Descartada para no agregar dependencia pesada con pocos usuarios.

### D3 — Cuenta admin por defecto al arrancar

Como SQL no puede calcular el hash de `scrypt`, el admin por defecto se crea en el arranque del backend (`index.js` → `initAdmin()` de `authService`) solo si no existe: se hashea `ADMIN_PASSWORD` del `.env` y se inserta `usuarios(admin, rol='admin')`. Si `ADMIN_PASSWORD` no está definido, se registra un error claro y no se crea la cuenta.

- La tabla `usuarios` se define idempotente en `db/init/007_usuarios.sql`.

### D4 — Middleware de roles

`middleware/auth.js` exporta `requireAuth` (verifica el JWT de la cookie) y `requireAdmin` (verifica rol). En `index.js` se aplican antes del router `/api`, con lista blanca para `POST /api/auth/login`, `GET /health` y `GET /api/auth/me`/`POST /api/auth/logout` (que usan `requireAuth`). El router de usuarios usa `requireAdmin`.

- Regla de alcance: `presentacion` → solo `/api/auth/*` y `/api/dashboard/*`; el resto (`/api/combustibles`, `/api/prm` vía resumen, ejecución de corridas, referencias, tipo-cambio, usuarios, export) → solo `admin`.
- Implementación: el middleware de `/api/dashboard/*` acepta ambos roles; el resto del router se monta tras `requireAdmin`.

### D5 — Endpoints

- `POST /api/auth/login` → valida credenciales, emite cookie `token`.
- `GET /api/auth/me` → `{ usuario, rol }` desde el JWT.
- `POST /api/auth/logout` → limpia la cookie.
- `GET /api/usuarios` / `POST /api/usuarios` / `PUT /api/usuarios/:id` (o por `usuario`) → solo admin; permiten usuario, contraseña (opcional en edición), rol, activo.

### D6 — Frontend por rol

- Estado global de sesión: al cargar se consulta `/api/auth/me`; si 401 → pantalla de login; si OK → app con `SECTIONS` filtradas por rol.
- `admin`: todas las secciones + `Usuarios`. `presentacion`: solo `Presentación`.
- Nueva sección `Usuarios` (solo admin): tabla de cuentas + formulario crear/editar + toggle activo.

## Risks / Trade-offs

- [JWT en cookie puede requerir manejo CSRF] → SameSite=Lax + método/alcance same-origin de la SPA mitigan.
- [Proteger toda la API puede romper el scraper si el middleware es incorrecto] → lista blanca explícita y verificación por endpoint en tasks.
- [Falta de `JWT_SECRET` o `ADMIN_PASSWORD` deja la app sin acceso] → validación al arrancar con mensaje claro; documentar en `.env`.
- [Token expirado en medio de una corrida manual larga] → la expiración es de horas; las corridas programadas por cron son internas (no pasan por HTTP), por lo que no se ven afectadas.
- [Cierre de sesión con JWT sin estado no revoca el token] → logout limpia la cookie; revocación inmediata no es requisito (escala interna).

## Migration Plan

1. Agregar `db/init/007_usuarios.sql` (tabla idempotente).
2. Agregar `JWT_SECRET` y `ADMIN_PASSWORD` al `.env` (y al `docker-compose.yml`).
3. Desplegar backend (dependencia `jsonwebtoken`, `authService`, middleware, endpoints) y frontend (login + roles + Usuarios).
4. Verificar: login admin, creación de cuenta presentacion, visibilidad de secciones y bloqueo de endpoints.
5. Rollback: quitar el middleware devuelve el comportamiento anterior sin migraciones destructivas (la tabla `usuarios` queda inerte).
