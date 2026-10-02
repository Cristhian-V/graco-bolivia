## Why

Una declaración de combustible puede traer varios documentos `TR-007` (Manifiesto Internacional de Carga) —hasta 10— y hoy se registran todos, llenando la sección de Documentos de basura repetida. Además, 1295 registros de combustibles no tienen ningún manifiesto de carga en sus documentos.

## What Changes

- Al registrar los documentos de soporte de una declaración, se guarda **solo el primer `TR-007`** (manifiesto de carga) por DIM.
- Una migración idempotente deja **un solo `TR-007` por DIM**, borrando los duplicados ya guardados.
- Un endpoint de **backfill** agrega, a los combustibles sin `TR-007`, el primer manifiesto de la tabla `manifiestos` que referencia su declaración (copiando el PDF al folder de documentos).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `combustibles`: los documentos de despacho guardan un solo manifiesto de carga por declaración, con backfill desde la tabla de manifiestos.

## Impact

- **Backend**: `services/combustiblesService.js` (límite de `TR-007` en el registro de documentos y función de backfill), `routes/api.js` (endpoint de backfill).
- **Base de datos**: migración `db/init/013_manifiesto_unico.sql` (deja un `TR-007` por DIM).
- Sin cambios en el scraper; los manifiestos ya se descargan en su corrida.
