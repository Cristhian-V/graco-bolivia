## Context

Proyecto greenfield (ver `proposal.md`). El spike confirmó que la extracción es viable 100 % por API, sin navegador:

- Login: `POST https://suma.aduana.gob.bo/b-sso/rest/autenticar/portal?operador=ip` con `{ nombreUsuario, password, tipo: "EXTERNO" }` → `{ token (UUID), jwt }`.
- Módulo "Depósito → Búsqueda de PRM" = `transitoDeposito`, backend `https://suma.aduana.gob.bo/n-ingreso/api/json/`.
- Búsqueda: `POST /pre/getParteRecepcionByNumPrmAndImpAndDe?page=&size=` con body `{ dst: { numDoc: "<NIT>" } }` y headers `Auth-Token: <UUID>` + `User: <usuario>`.
- Conteo: `POST /pre/countParteRecepcionByNumPrmAndImpAndDe`.
- Respuesta: array de resúmenes con `cor` (PRM), `fecTra` (epoch ms), `datGen.numDocAso` (DAM), `datGen.numDocAso2` (DI), `datGen.numTraDE` (CRT), `datGen.numMan`, `datGen.numDocEmb`, `datGen.aduRec/aduDes`, `datGen.modTra`, `ingUbiMer.*`, `dst.*`, `estAct`.
- El token expira (~2 h); se renueva en cada corrida.

## Goals / Non-Goals

**Goals:**
- Automatizar login → extracción por NIT → upsert en Postgres, con corrida semanal (sábado) y backfill inicial desde julio 2026.
- Exponer una API REST y una UI React (tabla por cliente, resumen mensual, histórico).

**Non-Goals:**
- No extraer detalle de ítems (`detIte`), proveedores, transporte por ítem ni volúmenes/valores (el resumen de la búsqueda no los trae).
- No importar el Excel histórico existente (se arranca con BD vacía).
- No implementar autenticación multi-usuario ni roles en el frontend.

## Decisions

### Arquitectura: 4 servicios en un solo `docker-compose.yml`

```
frontend (React + Vite, nginx)  ──HTTP──▶  backend (Node + Express)
                                              ├─ scheduler (node-cron)
                                              ├─ scraper (axios/fetch)
                                              └─ pg (PostgreSQL)
```

- **Decisión**: Express + node-cron embebido en el backend (sin contenedor de cron aparte).
- **Alternativa considerada**: NestJS (más estructura) y cron del host/systemd. Se descarta por sobrecarga para este alcance; node-cron mantiene el disparo autocontenido y portable con Docker.

### Extracción: API-first (sin Playwright)

- **Decisión**: cliente HTTP directo (axios) reproduciendo el flujo del navegador.
- **Alternativa**: Playwright/headless. Se descarta porque el spike demostró que todo es REST y es más rápido/estable.

### Autenticación por corrida

- Login al inicio de cada corrida (y reintento ante 401 a mitad de corrida). Header de módulos: `Auth-Token` = UUID del login, `User` = usuario, `charset: UTF-8`.

### Modelo de datos

3 tablas + 1 vista (ver `proposal.md` y specs de `prm-ingestion`):

- `clientes(nit PK, nombre, activo)`
- `ejecuciones(id, iniciado_en, finalizado_en, estado, total_prm, prm_nuevos, errores, mensaje)`
- `prm(... UNIQUE (prm, dam, di))`
- `resumen_mensual` (vista agregada por nit/mes)

- **Upsert**: `INSERT ... ON CONFLICT (prm, dam, di) DO UPDATE SET ...`. Los campos `dam`/`di` nulos participan del índice único (PostgreSQL trata los NULL como distintos por defecto; la unicidad efectiva se documenta y se valida en tests con `NULLS NOT DISTINCT` si se requiere).

### Estrategia de extracción

Por cada cliente activo: `count` → paginar `size=100` hasta alcanzar el total → filtrar `fecTra` dentro de `[desde, hasta]` → upsert. Espera de ~1–2 s entre peticiones para evitar bloqueo por volumen.

### Rango de fechas configurable

- Env: `PRM_FECHA_DESDE`, `PRM_FECHA_HASTA` (opcionales).
- Corrida semanal: `desde = 1º del mes en curso`, `hasta = hoy`.
- Backfill inicial: `desde = 2026-07-01`, `hasta = hoy`. Disparo manual vía endpoint o flag de arranque.

### API REST del backend

- `GET /api/clientes` — listado de clientes.
- `GET /api/clientes/:nit/prms` — registros de un cliente.
- `GET /api/resumen?mes=YYYY-MM` — nº de PRMs por cliente del mes.
- `GET /api/historico` — nº de PRMs por cliente y mes (todos los meses).
- `POST /api/ejecutar` — disparo manual de una corrida (para backfill/pruebas).

## Risks / Trade-offs

- **Bloqueo o rate-limit de la Aduana por volumen** → esperas entre peticiones, reintentos acotados, y corrida por lotes de clientes.
- **Cambio de la API de SUMA (endpoints/headers)** → aislar el cliente HTTP en un módulo `scraper` con URLs en configuración; falla explícita y logueada, sin romper el resto.
- **Token expira a mitad de corrida (~2 h)** → re-login ante 401; para 67 clientes el tiempo es holgado.
- **`dam`/`di` ausentes en algún PRM** → se almacenan nulos; la clave compuesta se evalúa sobre los campos presentes (documentado en specs).
- **Credenciales en `.env`** → no versionado (`.gitignore`); solo el backend accede al archivo.

## Migration Plan

- Proyecto nuevo: `docker compose up --build` levanta `db`, `backend`, `frontend`.
- Migraciones de esquema con un mecanismo simple (script SQL idempotente al arranque del backend o `db/init`).
- Rollback: detener servicios; el esquema es aditivo y el upsert es idempotente (re-correr no duplica).
