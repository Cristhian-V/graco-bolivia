## Why

Al dar de alta un cliente con un historial muy grande (YPFB tiene ~475.852 PRMs en la aduana), la extracción de PRMs se extiende sobre todo su historial y la consulta de la primera página tarda más que el timeout, fallando. Se quiere acotar la extracción a partir de enero de 2026 para todos los clientes.

## What Changes

- La **fecha inicial** de la extracción de PRMs (backfill) pasa a ser **2026-01-01** para todos los clientes (antes 2026-07-01), de modo que la corrida no recorra todo el historial de un cliente nuevo.

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `prm-scraping`: la fecha inicial por defecto del backfill es 2026-01-01.
- `manifiestos`: la primera carga parte desde enero de 2026.

## Impact

- **Backend**: `backend/src/config.js` (`fechaDesde` por defecto) y `.env` (`PRM_FECHA_DESDE`).
- **Sin migraciones ni dependencias nuevas.**
