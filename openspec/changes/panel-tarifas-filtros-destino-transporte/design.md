## Context

Ver `proposal.md` y los deltas de `presentacion-datos` y `referencias`. La tabla vive en `TarifasTable` (`frontend/src/DashboardSection.jsx`), que consume `getTarifasTramo` (`backend/src/services/presentacionService.js`) vía `GET /api/dashboard/data?chart=tarifas`. Hoy `getTarifasTramo` devuelve `{ periodos, tc, general, tarifas }` con `tarifas: [{ tramo, usd, bs }]` para 3 meses, agrupando por `tramo_flete` sin transportes. El filtro avanzado y el segmentado de tipo ya existen (`CardFrame` con `singleMonth` y `headerExtra`). Las tablas de referencia se editan vía `TABLAS_REFERENCIA` en `routes/api.js` y la lista `REFERENCIAS` en `App.jsx`.

## Goals / Non-Goals

**Goals:**
- Acotar la unidad mostrada (Bs / USD / Ambos) y la columna T/C.
- Recuperar la variación en valor (sin porcentaje).
- Filtrar por departamento de destino con una tabla de referencia mantenible.
- Ver las empresas de transporte por tramo.

**Non-Goals:**
- No separar origen y destino en columnas.
- No tocar el scraper ni `detalles`.
- No cambiar la lógica de tarifa ponderada ni el segmentado por tipo.
- El filtro de destino no aplica a otras tablas/gráficos.

## Decisions

### D1 — Filtro de unidad (solo presentación)

`TarifasTable` gana un estado `unidad` (`bs | usd | ambos`, default `bs`) y lo pasa por `headerExtra`. El backend ya devuelve `bs` y `usd` por período, así que no cambia. El render de columnas depende del modo: `bs` → Bs/m³; `usd` → USD/m³ + T/C; `ambos` → Bs/m³ + USD/m³. El título se arma según el modo.

- Alternativa: filtrar en backend. Descartada: los datos ya vienen completos; sería un viaje extra sin beneficio.

### D2 — Variación en valor con columnas por unidad

Se reactiva `celdasVariacion`, usándolo solo para el valor (se descarta el porcentaje). La comparación es **mes en curso vs mes inmediatamente anterior** (`periodos[2]` vs `periodos[1]`); `dif = round(act) - round(ant)` sobre lo mostrado. Colores y flechas como el mockup (`table-tarifas.html`): ▲ sube rojo, ▼ baja verde, sin dato si falta el anterior. En modo `ambos` se agrupan dos subvalores (Bs y USD) bajo un encabezado "Variación".

- Alternativa: una variación por mes. Descartada por el pedido de "una sola columna".

### D3 — Filtro de destino con tabla `destinos`

Nueva tabla `destinos (destino text PRIMARY KEY, departamento text NOT NULL)` sembrada con los 9 departamentos (el `destino` crudo es `LA PAZ`, `SANTA CRUZ`, `POTOSI`, …). El destino de un tramo se extrae con `btrim(regexp_replace(tramo_flete, '^.*[-–]\s*', ''))` (toma lo que sigue al último guion, válido para orígenes compuestos como `BATON ROUGE -LOUISIANA - LA PAZ`). El filtro por departamento se implementa con un `EXISTS`/subconsulta contra `destinos`. Las opciones del selector son los `departamento` distintos de `destinos`, expuestos desde `GET /api/dashboard/filters` (clave `departamento`).

- Alternativa: mapeo fijo en código. Descartada: el usuario pidió mantenerlo desde Referencias (por si aparecen alias como `SCZ`).
- Alternativa: parsear en el frontend. Descartada: el filtro debe aplicarse en SQL.

### D4 — Columna de transporte

`getTarifasTramo` agrega `string_agg(DISTINCT NULLIF(BTRIM(transporte), ''), ' | ') AS transportes` por tramo, sobre los 3 períodos (mismos filtros). El frontend muestra: 1 nombre → el nombre; >1 → `N transportes` con expansión de fila (patrón de `WeeklyTable`); 0 → `–`. Columna inmediatamente después de Tramo.

### D5 — Registro de `destinos` en Referencias

Se suma `destinos: { cols: ['destino', 'departamento'], required: ['destino', 'departamento'] }` a `TABLAS_REFERENCIA` (`routes/api.js`), su hoja en el export de referencias, y la entrada en la lista `REFERENCIAS` de `App.jsx`. El alta ya la cubre el endpoint genérico `/referencias/:tabla`.

### D6 — Migración de esquema

Nuevo `db/init/014_destinos.sql` idempotente (`CREATE TABLE IF NOT EXISTS` + `INSERT ... ON CONFLICT DO NOTHING`), siguiendo el patrón de `db/init`. El arranque del backend aplica los `*.sql` de forma idempotente, así que no hace falta migración aparte.

## Risks / Trade-offs

- [Muchos transportes por tramo] → celda colapsada con conteo y expansión de fila; no ensancha la tabla.
- [Destino no mapeado en `destinos`] → aparece solo en `Todos`; se resuelve agregándolo en Referencias.
- [Orígenes con guiones] → se toma el destino tras el último guion, que es correcto para los datos actuales (verificado con las 47 filas).
- [Ancho de tabla en modo `Ambos` con 3 meses] → sigue con scroll horizontal y primera columna fija.

## Migration Plan

1. DB: `db/init/014_destinos.sql` (tabla + seed de los 9 departamentos).
2. Backend: `getTarifasTramo` (transporte + filtro por departamento de destino), `/dashboard/filters` (opciones de departamento), `TABLAS_REFERENCIA` y export de referencias.
3. Frontend: `TarifasTable` (filtro de unidad, columnas, variación, filtro destino, transporte expandible), `REFERENCIAS` en `App.jsx`, estilos en `index.css`.
4. Verificar: filtros de unidad y destino, variación, columna y expansión de transporte, alta de `destinos` en Referencias.
5. Rollback: quitar la tabla `destinos` y revertir los archivos de frontend/backend; sin datos afectados.
