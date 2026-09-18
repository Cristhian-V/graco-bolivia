## Context

Ver `proposal.md` (Why/What Changes) y los specs. El backend es Node/Express (ESM, `exceljs`, `pg`, `node-cron`), el frontend es React/Vite sin librería de gráficos, y la BD PostgreSQL se administra con archivos idempotentes en `db/init/` que el contenedor aplica al arrancar.

La tabla cruda `combustibles` es desnormalizada (nombres en texto). El dashboard original (`Presentacion`) consume un esquema normalizado con FKs y un Excel manual; aquí se reemplaza por una tabla espejo desnormalizada alimentada por el scraper.

## Goals / Non-Goals

**Goals:**
- Aislar la capa de presentación de la tabla cruda del scraper.
- Replicar automáticamente cada combustible (extraído o reprocesado) a `detalles`.
- Servir el dashboard completo con tema claro y solo lectura.

**Non-Goals:**
- No importar/exportar desde la sección (eso ya vive en Combustibles).
- No normalizar proveedor, transporte, aduana ni país (solo el importador por NIT).
- No migrar la app a un framework de gráficos nuevo.

## Decisions

### D1 — Tabla `detalles` espejo desnormalizada (24 columnas, única `dim_dam`)

`detalles` replica las columnas de negocio de `combustibles` (hasta `tarifa_flete_bob_m3`), sin FKs a catálogos, con `UNIQUE (dim_dam)`.

- Alternativa: esquema normalizado con FKs (como `Presentacion`). Descartada: `combustibles` ya es desnormalizada, así que la replicación es copia directa y el SQL del dashboard no necesita joins.
- El esquema se agrega como `db/init/006_detalles.sql` (idempotente, `CREATE TABLE IF NOT EXISTS`), siguiendo el patrón existente.

### D2 — Replicación en el servicio de combustibles

Tras cada escritura en `combustibles` (`upsertCombustible`) y en `reprocesarCombustibles`, se hace un `INSERT ... ON CONFLICT (dim_dam) DO UPDATE` en `detalles` con los campos finales.

- Alternativa: trigger de BD. Descartada: la lógica vive en JS y la normalización por NIT requiere consultar `clientes`; además el proyecto ya orquesta todo desde el servicio.
- El `importador` se resuelve con `clientes` por NIT antes de insertar (D3).

### D3 — Normalización del importador por NIT

Al replicar, se obtiene el nombre canónico con `SELECT nombre FROM clientes WHERE nit = $1` usando `importador_nit` (o `nit` del combustible). Si no existe, se conserva el nombre crudo.

- Alternativa: guardar solo el nombre crudo. Descartada: el usuario pidió normalizar por NIT y mostrar nombre + NIT.

### D4 — Carga histórica desde Excel con `exceljs`

Se agrega un servicio `seedDetallesDesdeExcel(ruta)` que lee la hoja `detalles` del Excel de referencia (las mismas 24 columnas del export) y hace upsert en `detalles`. Se ejecuta una única vez (endpoint temporal o script manual) para cargar desde enero del año en curso.

- Alternativa: `xlsx`. Descartada: el backend ya usa `exceljs`.
- Deduplicación: `ON CONFLICT (dim_dam)`; la carga histórica corre antes que la replicación en vivo, que mantiene el último valor.

### D5 — API de solo lectura `/api/dashboard/*`

Un endpoint `GET /api/dashboard/data` (con filtros por query: `mes`, `importador`, `proveedor`, `procedencia`, `aduana`, `producto`) devuelve todo el JSON que el frontend necesita (KPIs, frecuencia mensual, benchmarking, volumen, tarifa por tramo, donuts), adaptando las consultas de `Presentacion/backend/server.js` a la tabla `detalles` desnormalizada. `GET /api/dashboard/filters` devuelve los valores de los filtros.

- Alternativa: dos endpoints `/graco` y `/futura`. Descartada: el frontend React consume una sola respuesta agregada.

### D6 — Frontend: D3 dentro de React (Opción A) con tema claro

Nueva sección `Presentacion` (`DashboardSection.jsx`) en `SECTIONS`. Se agrega `d3` como dependencia npm. Las funciones D3 del original (`d3Line`, `d3Benchmark`, `d3HBar`, `d3Donut`, `kpir`) se copian y montan con `useRef`/`useEffect`; React solo gestiona estado de filtros y tabs y nunca re-renderiza el SVG.

- Alternativa: Recharts. Descartada: requiere reescribir los 7 tipos de gráfico, incluido el eje X jerárquico empresa/mes que en D3 ya está resuelto.
- Tema: se re-tema el CSS del dashboard de oscuro (`#0b1120`) a claro (fondo `#f4f5f7`, tarjetas blancas, texto gris `#1f2937`, acento azul `#2563eb`), conservando los colores de serie de los gráficos.

## Risks / Trade-offs

- [Solapamiento histórico vs. en vivo sobre `dim_dam`] → `ON CONFLICT` deduplica; la replicación en vivo escribe el último valor.
- [Nombres crudos de proveedor/transporte/aduana generan grupos duplicados] → aceptado para el MVP; solo se normaliza importador por NIT. Normalizar el resto queda como trabajo futuro.
- [Desincronización si cambia un campo final] → la replicación también corre en `reprocesarCombustibles`, que es el flujo que recalcula esos campos.
- [D3 imperativo dentro de React] → los gráficos se renderizan solo vía `useEffect` sobre refs; el estado de React no toca el DOM del SVG.
- [Duplicación de 24 columnas entre tablas] → trade-off aceptado a cambio del aislamiento de la capa de presentación.

## Migration Plan

1. Agregar `db/init/006_detalles.sql`; el contenedor crea `detalles` al arrancar.
2. Ejecutar la carga histórica desde el Excel (una vez).
3. Desplegar backend (replicación + endpoints) y frontend (nueva sección).
4. Rollback: eliminar la sección y los endpoints; `detalles` puede descartarse sin afectar `combustibles`.
