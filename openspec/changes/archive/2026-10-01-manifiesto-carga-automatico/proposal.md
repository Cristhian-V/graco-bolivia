## Why

Hoy, para que un registro de combustible muestre su manifiesto de carga cuando el DIM no lo trae en sus documentos, hay que ejecutar el backfill a mano (endpoint). Conviene que se complete **automáticamente** al terminar cada corrida de combustibles, y ofrecer un botón para forzarlo desde la sección Combustibles.

## What Changes

- Al finalizar la corrida de combustibles, el sistema ejecuta el backfill de manifiestos de carga automáticamente.
- Se agrega un botón **"Completar manifiestos"** (solo `admin`) en la sección Combustibles que llama al mismo backfill.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `combustibles`: el backfill de manifiestos de carga se ejecuta automáticamente tras cada corrida y también puede dispararse manualmente desde la interfaz.

## Impact

- **Backend**: `services/combustiblesService.js` (`executeCombustiblesRun` llama a `backfillManifiestos` al terminar).
- **Frontend**: `api.js` (`backfillManifiestos`) y `App.jsx` (botón en Combustibles).
