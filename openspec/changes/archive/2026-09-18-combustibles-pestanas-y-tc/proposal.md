## Why

La sección Combustibles muestra una única tabla sin paginación y sin separar los registros con problemas de los correctos, por lo que revisar las observaciones es difícil. Además, los registros con `tipo_cambio_trans` nulo no se corrigen porque el tipo de cambio del BCB dejó de actualizarse (la tabla `tipo_cambio` quedó en 2026-09-07 y el proceso diario no lo actualiza).

## What Changes

- **Dos pestañas** en Combustibles con la barra de acciones compartida arriba:
  - **Historial**: todos los registros, **paginados server-side a 100 por página**, de fecha más reciente a más antigua.
  - **Pendientes**: registros con alguna validación pendiente, mismo orden por fecha.
- **Validaciones pendientes**: `tipo_cambio_trans` nulo (dato faltante), `us_unitario` mayor a 5000, y `tarifa_flete_usd_m3` nula o mayor a 150 sin revisar.
- **Colores por prioridad**: **rojo suave** (dato faltante) > **violeta** (`us_unitario` > 5000) > **amarillo** (tarifa sin revisar).
- **Sin "Ignorar" para `us_unitario`**: ese dato se corrige editando el registro. El botón "Ignorar" sigue solo para la tarifa.
- La fila deja de aparecer en Pendientes cuando, tras editarla, ya no tiene validaciones pendientes.
- **Refresco por mes**: un botón que toma el mes elegido en el selector y carga los registros de ese mes (en la pestaña activa).
- **Sincronización del tipo de cambio**: el proceso diario actualiza la tabla `tipo_cambio` desde el BCB y re-deriva el `tipo_cambio_trans` de los combustibles que lo tienen nulo (recalculando `flete_total_bs` y `tarifa_flete_bob_m3` y replicando a `detalles`).

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `tabla-combustibles`: alertas por color con prioridad e incorporación de `us_unitario`; pestañas Historial/Pendientes con paginación.
- `tipo-cambio`: actualización diaria desde el BCB y sincronización del `tipo_cambio_trans` de combustibles.

## Impact

- **Frontend**: `frontend/src/App.jsx` (sección Combustibles: pestañas, paginación, alertas), `frontend/src/api.js`, `frontend/src/index.css` (clase violeta).
- **Backend**: `backend/src/routes/api.js` (`GET /combustibles` paginado y sin `raw`; endpoint de sincronización), `backend/src/services/tipoCambioService.js` (sincronización de combustibles), `backend/src/index.js` (paso de tipo de cambio en la cadena diaria).
- **Sin migraciones ni dependencias nuevas**.
