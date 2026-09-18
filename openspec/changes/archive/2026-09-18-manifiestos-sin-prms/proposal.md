## Why

El scrape de PRMs (que para un cliente nuevo como YPFB tarda horas) solo se usaba, en la automatización, para obtener las **aduanas de recepción** de cada cliente. Pero se verificó que el endpoint `criBus` **sin aduana** (`aduRec = null`) devuelve **todas** las aduanas del cliente en una sola búsqueda, y cada registro ya trae su aduana (`datGen.aduRec.cod`). Por lo tanto, no hace falta bajar los PRMs para extraer manifiestos/combustibles.

## What Changes

- La búsqueda de manifiestos pasa a ser **por cliente, sin acotar aduana** (`aduana = null`); la aduana de cada manifiesto se toma del propio registro.
- Se retira la obtención de aduanas a partir de los PRMs.
- La **cadena diaria deja de ejecutar la extracción de PRMs**: pasa a ser manifiestos → combustibles (y el tipo de cambio).

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `manifiestos`: búsqueda por cliente sin aduana; se retira la dependencia de los PRMs para las aduanas.
- `programacion-corridas`: la cadena diaria no incluye PRMs.

## Impact

- **Backend**: `backend/src/services/manifiestosService.js` (`processAduana` → `processCliente`, búsqueda con `aduana = null`) y `backend/src/index.js` (se quita el paso de PRMs de la cadena).
- La sección "PRMs" del panel deja de recibir datos automáticos (queda como estaba).
- **Sin migraciones ni dependencias nuevas.**
