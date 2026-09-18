## 1. Andamiaje del proyecto (Docker)

- [x] 1.1 Crear estructura de carpetas (`backend`, `frontend`, `db`) y `docker-compose.yml` con los 4 servicios (frontend, backend, db); verificar que `docker compose config` valida sin errores.
- [x] 1.2 Agregar Dockerfiles (backend Node, frontend React/Vite servido por nginx, PostgreSQL) y `.gitignore` que excluya `.env`; verificar que `docker compose build` completa.

## 2. Base de datos

- [x] 2.1 Escribir el script SQL de esquema (`clientes`, `ejecuciones`, `prm` con `UNIQUE (prm, dam, di)`, vista `resumen_mensual` e índices); verificar que `psql` lo ejecuta sin errores.
- [x] 2.2 Hacer que el esquema se aplique de forma idempotente al arrancar el backend (o vía `db/init`); verificar que reiniciar los servicios no duplica ni falla.

## 3. Backend — scraper (cliente SUMA)

- [x] 3.1 Implementar login contra `autenticar/portal?operador=ip` (tipo `EXTERNO`) y persistir token; verificar con una llamada real que devuelve `success: true` y un token.
- [x] 3.2 Implementar búsqueda de PRMs por NIT (`count` + `getParteRecepcionByNumPrmAndImpAndDe` con paginación `size=100`); verificar que para un NIT de prueba devuelve la misma cantidad que el conteo.
- [x] 3.3 Implementar filtro por `fecTra` dentro del rango `[desde, hasta]` configurable; verificar con un NIT que solo se conservan los PRMs del rango.
- [x] 3.4 Agregar reintentos, espera entre peticiones y re-login ante HTTP 401; verificar que un fallo transitorio no aborta la corrida.

## 4. Backend — ingestión y programación

- [x] 4.1 Implementar upsert de PRMs en la tabla `prm` con `ON CONFLICT (prm, dam, di) DO UPDATE`; verificar que re-ejecutar la misma corrida no crea duplicados.
- [x] 4.2 Implementar alta/registro de clientes (`nit`, `nombre`, `activo`); verificar que un cliente nuevo queda disponible para la extracción.
- [x] 4.3 Registrar cada corrida en `ejecuciones` (inicio, fin, estado, contadores, mensaje); verificar que tras una corrida se inserta el registro con los contadores correctos.
- [x] 4.4 Configurar el scheduler semanal (sábado) con node-cron; verificar que la expresión de cron y el manejador quedan registrados.
- [x] 4.5 Implementar disparo manual de corrida/backfill con fecha inicial configurable (por defecto 2026-07-01); verificar que un backfill captura desde julio hasta hoy.

## 5. Backend — API REST

- [x] 5.1 Exponer `GET /api/clientes`; verificar que devuelve el listado de clientes.
- [x] 5.2 Exponer `GET /api/clientes/:nit/prms`; verificar que devuelve los PRMs del cliente con sus campos.
- [x] 5.3 Exponer `GET /api/resumen?mes=YYYY-MM`; verificar que devuelve el nº de PRMs por cliente del mes.
- [x] 5.4 Exponer `GET /api/historico`; verificar que devuelve el nº de PRMs por cliente y mes.
- [x] 5.5 Exponer `POST /api/ejecutar`; verificar que dispara una corrida manual.

## 6. Frontend React

- [x] 6.1 Configurar Vite y pantalla de tabla de registros por cliente (consumiendo `GET /api/clientes/:nit/prms`); verificar que muestra los PRMs de un cliente seleccionado.
- [x] 6.2 Implementar vista de resumen mensual (consumiendo `GET /api/resumen`); verificar que muestra el nº de PRMs por cliente del mes.
- [x] 6.3 Implementar vista histórica (consumiendo `GET /api/historico`); verificar que muestra la cantidad por cliente y mes para todos los meses.

## 7. Integración y validación

- [x] 7.1 Levantar todo con `docker compose up` y verificar el flujo completo (login → extracción → upsert → API → frontend) contra datos reales.
- [x] 7.2 Ejecutar el backfill desde julio y verificar en la vista histórica que aparecen los meses esperados sin duplicados.
