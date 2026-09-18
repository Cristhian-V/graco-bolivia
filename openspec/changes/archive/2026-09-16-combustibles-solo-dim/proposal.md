## Why

La extracción de combustibles intentaba obtener la declaración de los manifiestos que solo tienen DAM usando el endpoint de DIM, que responde 202 con cuerpo vacío y provoca el error "Unexpected end of JSON input" en cada corrida. Se verificó que el DAM no trae los campos necesarios (tipo de cambio y flete), por lo que no aporta valor extraerlo.

## What Changes

- **Solo DIM**: la extracción de combustibles procesa únicamente los manifiestos que tienen DIM (`di`); los que solo tienen DAM se omiten.
- Se elimina el fallback `di || dam` y la consulta de manifiestos deja de incluir los que no tienen `di`.
- Se corrigen las specs de `combustibles` para reflejar que la DAM ya no se usa.

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `combustibles`: la obtención de la declaración por manifiesto deja de contemplar la DAM; los manifiestos sin DIM se omiten.

## Impact

- **Backend**: `backend/src/services/combustiblesService.js` (consulta de manifiestos y selección del número de declaración).
- **Sin migraciones ni dependencias nuevas**; no se eliminan datos existentes.
