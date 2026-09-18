## Why

El sistema SUMA extrae y normaliza los datos de importación de combustibles, pero no tiene una vista de presentación: hoy los datos solo se consultan como tablas operativas y se descargan a Excel. Existe un dashboard D3 ya desarrollado (proyecto `Presentacion`) que visualiza estos datos con KPIs y gráficos, pero vive fuera de la aplicación, consume un Excel manual y desconoce los campos finales que se agregaron (`tarifa_flete_bob_m3`, fletes totales, tipos de cambio). Se necesita incorporarlo como una sección de la aplicación, alimentada por una tabla de presentación propia, para consultar los datos en vivo sin duplicar la tabla cruda del scraper.

## What Changes

- Se agrega una nueva tabla `detalles` (capa de presentación) con las mismas 24 columnas de negocio de `combustibles` (hasta `tarifa_flete_bob_m3`), separada de la tabla cruda del scraper.
- Se carga en `detalles` el histórico (desde enero de este año) desde el Excel de referencia (hoja `detalles`).
- Los datos nuevos que extraiga o reprocese el scraper se replican automáticamente a `detalles` (sin import/export manual; la sección es de solo lectura).
- El importador se normaliza por NIT contra la tabla `clientes` (se muestra nombre + NIT).
- Se agrega una nueva sección "Presentación" en el frontend con el dashboard completo (KPIs, frecuencia mensual, benchmarking, volumen, tarifa de flete por tramo, donuts de proveedor/procedencia/CIF), retemado a colores claros.
- Se agregan endpoints de solo lectura `/api/dashboard/*` que leen de `detalles`.

## Capabilities

### New Capabilities
- `presentacion-datos`: capa de presentación de los datos de combustibles — tabla `detalles`, carga histórica, normalización por NIT, panel de visualización y su API de solo lectura.

### Modified Capabilities
- `combustibles`: replicación automática de cada registro extraído/reprocesado hacia la tabla `detalles`.

## Impact

- **Base de datos**: nueva tabla `detalles` (24 columnas, clave única `dim_dam`) + script de carga histórica desde el Excel.
- **Backend**: `services/combustiblesService.js` (replicación en `upsertCombustible` y `reprocesarCombustibles`); `routes/api.js` (nuevos endpoints `/api/dashboard/*`).
- **Frontend**: nueva sección `Presentacion` (componente React + D3 con tema claro), `api.js` con `getDashboard*`; dependencia `d3`.
- **Sin breaking changes**: la tabla `combustibles` y los flujos existentes no cambian su comportamiento salvo la replicación adicional.
