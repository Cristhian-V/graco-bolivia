## Why

Hoy el equipo consulta manualmente el portal SUMA de la Aduana Nacional (Depósito → Búsqueda de PRM) por cada cliente para ver los Partes de Recepción de Mercancías del mes, y no existe un histórico consultable ni un conteo por cliente. Se necesita automatizar la extracción por API, persistirla en una base de datos y exponerla en una interfaz web con resúmenes mensuales e históricos.

## What Changes

- Nueva aplicación full-stack empaquetada con Docker (frontend React, backend Node.js, PostgreSQL).
- Un scraper que se autentica en SUMA vía API y consulta los PRM de cada cliente por NIT (endpoint `getParteRecepcionByNumPrmAndImpAndDe`).
- Almacenamiento con deduplicación por clave de negocio `prm + dam + di` (upsert), para no duplicar registros entre corridas.
- Un programador que ejecuta la extracción automáticamente cada sábado, y una corrida inicial de backfill desde julio de 2026.
- Un frontend React con: tabla de registros por cliente, resumen mensual (nº de PRMs por cliente) y vista histórica de todos los meses.

## Capabilities

### New Capabilities
- `prm-scraping`: autenticación contra SUMA (SSO) y extracción de Partes de Recepción de Mercancías por NIT de cliente.
- `prm-ingestion`: persistencia de PRMs en PostgreSQL con upsert por `prm + dam + di`, registro de ejecuciones y programación semanal.
- `prm-dashboard`: interfaz React para consultar registros por cliente, resumen del mes e histórico acumulado.

### Modified Capabilities

(ninguna — proyecto nuevo)

## Impact

- Código nuevo: servicios `backend`, `frontend`, `scraper` y `db` (PostgreSQL) orquestados con `docker-compose`.
- Dependencia externa: API de SUMA (`b-sso/rest/autenticar`, `n-ingreso/api/json/pre/*`); el token de sesión expira (~2h) y se renueva en cada corrida.
- Credenciales en `.env` (usuario/contraseña) — no se versionan.
- Sin cambios sobre sistemas existentes; es un proyecto greenfield dentro del repositorio.
