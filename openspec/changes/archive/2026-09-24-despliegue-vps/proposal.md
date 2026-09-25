## Why

La aplicación va a pasar de un equipo local a un **VPS público con dominio propio**, con la base de datos y los archivos migrados y en horario de Bolivia. Hoy el `docker-compose.yml` expone el backend (3000) y sirve todo por HTTP, las contraseñas están fijas para desarrollo y la base de datos queda en UTC.

## What Changes

- **Zona horaria**: todos los contenedores (`db`, `backend`) usan `TZ=America/La_Paz`; la corrida diaria se mantiene a las **15:00 Bolivia**.
- **Publicación por dominio con HTTPS**: se agrega un **reverse proxy (Caddy)** que sirve el dominio con certificado automático (Let's Encrypt) y enruta al frontend; **no se exponen** el backend (3000) ni la base de datos.
- **Secretos por entorno**: `JWT_SECRET`, `ADMIN_PASSWORD` y la contraseña de Postgres se definen en `.env` (valores fuertes), no fijos en el compose.
- **Migración de datos (Opción A)**: se traslada **toda la base** (dump/restore) y los volúmenes `downloads` y `documentos-despacho`.
- **Repositorio git** para versionar y desplegar el proyecto.

## Capabilities

### New Capabilities

- `despliegue`: operación en el VPS — horario de Bolivia, publicación por dominio con HTTPS, servicios internos no expuestos y secretos por entorno.

### Modified Capabilities

<!-- ninguna -->

## Impact

- **Infraestructura**: `docker-compose.yml` (TZ en `db`, quitar el puerto público del backend, parámetros desde `.env`), `Caddyfile` (nuevo), `.env`/`.env.example`.
- **Datos**: migración de `dbdata` (BD), `downloads` y `documentos-despacho` al VPS.
- **Sin cambios de código de aplicación** ni dependencias nuevas.
