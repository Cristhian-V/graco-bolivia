## 1. Fecha inicial

- [x] 1.1 `backend/src/config.js`: `fechaDesde` por defecto `2026-01-01`. Verificar: con `PRM_FECHA_DESDE` sin definir, el backfill parte de 2026-01-01.
- [x] 1.2 `.env`: `PRM_FECHA_DESDE=2026-01-01`. Verificar: el contenedor backend muestra `PRM_FECHA_DESDE=2026-01-01`.

## 2. Despliegue y verificación

- [x] 2.1 Reconstruir y recrear el backend. Verificar: `/api/ejecutar` (sin rango) usa `desde = 2026-01-01`.
