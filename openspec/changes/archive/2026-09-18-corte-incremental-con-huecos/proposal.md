## Why

El corte incremental ("detenerse en el primer registro ya almacenado") asume que la API devuelve registros únicos y estrictamente por fecha descendente. Para YPFB no se cumple: la API devolvió un registro repetido/desplazado (`PRM-2026-241-291498`) y la extracción de PRMs se truncó en **400** registros, dejando un hueco. Además, si una primera corrida se corta, los registros recientes quedan guardados y los antiguos no, y el corte detiene la corrida siguiente de inmediato.

## What Changes

- El corte incremental por "primer existente" SHALL aplicarse **solo cuando los datos guardados del cliente llegan hasta la fecha inicial `desde`** (sin huecos).
- Si el registro guardado más antiguo es **posterior** a `desde` (hay hueco), el sistema SHALL recorrer el rango completo **sin cortar** por registros existentes, para llenarlo.

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `prm-scraping`: el corte incremental de PRMs solo aplica sin huecos; con hueco, recorre el rango completo.
- `manifiestos`: el corte incremental de manifiestos solo aplica sin huecos; con hueco, recorre el rango completo.

## Impact

- **Backend**: `backend/src/services/runService.js` (`scrapeCliente`) y `backend/src/services/manifiestosService.js` (`processAduana`).
- **Sin migraciones ni dependencias nuevas.**
