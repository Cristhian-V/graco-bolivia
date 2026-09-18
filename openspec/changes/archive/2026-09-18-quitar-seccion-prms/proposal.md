## Why

La sección "PRMs" ya no aporta: los manifiestos dejaron de depender de los PRMs (buscan por cliente con `aduana = null`), así que la extracción de PRMs, sus endpoints y su tabla no se usan para nada.

## What Changes

- Se elimina la sección **PRMs** del panel (pestañas Registros, Resumen mensual, Histórico y el botón "Procesar PRMs").
- Se eliminan los endpoints de PRMs: `GET /clientes/:nit/prms`, `GET /resumen`, `GET /historico`, `POST /ejecutar`.
- Se elimina el código de extracción de PRMs (`services/runService.js` y `scraper/prm.js`).
- La tabla `prm` y la vista `resumen_mensual` quedan **huérfanas** (nada las lee ni escribe).

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `prm-scraping`: se retiran los requisitos de consulta de PRMs, filtro por fechas y procesamiento incremental.
- `prm-ingestion`: se retiran la persistencia de PRMs, la programación de su corrida y la exposición de sus datos por API.
- `prm-dashboard`: se retiran la tabla de registros, el resumen mensual y el histórico.

## Impact

- **Frontend**: `frontend/src/App.jsx` (sección PRMs y su navegación), `frontend/src/api.js` (llamadas de PRMs).
- **Backend**: `backend/src/routes/api.js` (rutas de PRMs) y eliminación de `backend/src/services/runService.js` y `backend/src/scraper/prm.js`; `config.js` (se quita `prmTimeoutMs`).
- **Base de datos**: `prm` (82 MB, 32.509 filas) y `resumen_mensual` quedan sin uso.
- **Sin dependencias nuevas.**
