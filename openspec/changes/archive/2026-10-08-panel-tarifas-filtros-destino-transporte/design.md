## Context

Ver `proposal.md` y los deltas de `presentacion-datos` y `referencias`. La tabla vive en `TarifasTable` (`frontend/src/DashboardSection.jsx`), que consume `getTarifasTramo` (`backend/src/services/presentacionService.js`) vía `GET /api/dashboard/data?chart=tarifas`. Hoy `getTarifasTramo` devuelve `{ periodos, tc, general, tarifas }` con `tarifas: [{ tramo, usd, bs }]` para 3 meses, agrupando por `tramo_flete` sin transportes. El filtro avanzado y el segmentado de tipo ya existen (`CardFrame` con `singleMonth` y `headerExtra`). Las tablas de referencia se editan vía `TABLAS_REFERENCIA` en `routes/api.js` y la lista `REFERENCIAS` en `App.jsx`.

## Goals / Non-Goals

**Goals:**
- Acotar la unidad mostrada (Bs / USD / Ambos) y la columna T/C.
- Recuperar la variación en valor (sin porcentaje).
- Filtrar por origen (lugar de embarque, por ejemplo `ILO`, `IQUIQUE`, `DESAGUADERO`).

**Non-Goals:**
- No separar origen y destino en columnas.
- No tocar el scraper ni `detalles`.
- No cambiar la lógica de tarifa ponderada ni el segmentado por tipo.
- No incluir columna de transporte.
- El filtro de origen no aplica a otras tablas/gráficos.

## Decisions

### D1 — Filtro de unidad (solo presentación)

`TarifasTable` gana un estado `unidad` (`bs | usd | ambos`, default `bs`) y lo pasa por `headerExtra`. El backend ya devuelve `bs` y `usd` por período, así que no cambia. El render de columnas depende del modo: `bs` → Bs/m³; `usd` → USD/m³ + T/C; `ambos` → Bs/m³ + USD/m³. El título se arma según el modo.

- Alternativa: filtrar en backend. Descartada: los datos ya vienen completos; sería un viaje extra sin beneficio.

### D2 — Variación en valor con columnas por unidad

Se reactiva `celdasVariacion`, usándolo solo para el valor (se descarta el porcentaje). La comparación es **mes en curso vs mes inmediatamente anterior** (`periodos[2]` vs `periodos[1]`); `dif = round(act) - round(ant)` sobre lo mostrado. Colores y flechas como el mockup (`table-tarifas.html`): ▲ sube rojo, ▼ baja verde, sin dato si falta el anterior. En modo `ambos` se agrupan dos subvalores (Bs y USD) bajo un encabezado "Variación".

- Alternativa: una variación por mes. Descartada por el pedido de "una sola columna".

### D3 — Filtro de origen

El origen de un tramo se extrae de `tramo_flete` como el texto anterior al primer guion: `btrim(regexp_replace(tramo_flete, '\s*[-–].*$', ''))`. El filtro por origen aplica `= ANY(...)` sobre esa expresión. Las opciones del selector son los orígenes distintos derivados de `detalles`, expuestos desde `GET /api/dashboard/filters` (clave `origen`).

- Alternativa: tabla de referencia de orígenes. Descartada: los orígenes se derivan de los datos.
- Alternativa: parsear en el frontend. Descartada: el filtro debe aplicarse en SQL.

### D4 — Sin columna de transporte

Se descarta la columna de transporte (se decidió quitarla). `getTarifasTramo` no agrega transportes y la tabla no la muestra.

### D5 — Registro de `destinos` en Referencias

Se suma `destinos: { cols: ['destino', 'departamento'], required: ['destino', 'departamento'] }` a `TABLAS_REFERENCIA` (`routes/api.js`), su hoja en el export de referencias, y la entrada en la lista `REFERENCIAS` de `App.jsx`. El alta ya la cubre el endpoint genérico `/referencias/:tabla`.

### D6 — Migración de esquema

Nuevo `db/init/014_destinos.sql` idempotente (`CREATE TABLE IF NOT EXISTS` + `INSERT ... ON CONFLICT DO NOTHING`), siguiendo el patrón de `db/init`. El arranque del backend aplica los `*.sql` de forma idempotente, así que no hace falta migración aparte.

## Risks / Trade-offs

- [Origen no listado] → el origen se deriva de `tramo_flete`, así que aparece si hay datos.
- [Orígenes con guiones compuestos] → se toma el texto anterior al primer guion.
- [Ancho de tabla en modo `Ambos` con 3 meses] → sigue con scroll horizontal y primera columna fija.

## Migration Plan

1. DB: `db/init/014_destinos.sql` (tabla + seed de los 9 departamentos) — se mantiene la referencia `destinos`.
2. Backend: `getTarifasTramo` (sin transportes; filtro por origen), `/dashboard/filters` (opciones de origen), `TABLAS_REFERENCIA` y export de referencias.
3. Frontend: `TarifasTable` (filtro de unidad, columnas, variación, filtro de origen), `REFERENCIAS` en `App.jsx`, estilos en `index.css`.
4. Verificar: filtros de unidad y origen, variación, alta de `destinos` en Referencias.
5. Rollback: revertir los archivos de frontend/backend; la tabla `destinos` queda sin uso.
