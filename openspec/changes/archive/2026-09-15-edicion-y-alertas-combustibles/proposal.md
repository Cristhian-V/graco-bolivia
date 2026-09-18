## Why

La tabla de administración de Combustibles no permite detectar rápidamente tarifas de flete anómalas, consultar documentos sin perder el contexto del registro, ni corregir datos a mano; además, las corridas programadas vuelven a procesar todos los registros existentes, lo que pisa cualquier corrección manual y multiplica las llamadas a la API sin necesidad.

## What Changes

- **Alertas visuales de fila**: fila amarilla cuando `tarifa_flete_usd_m3` es nula o mayor a 150; fila rojo suave cuando `tipo_cambio_trans` es nulo (precede al amarillo); botón **Ignorar** para quitar el amarillo tras revisar el valor.
- **Documentos en línea**: al pulsar "Docs" los documentos del despacho se abren debajo del registro correspondiente, en lugar de al final de la tabla.
- **Edición por fila**: botón **Editar** en cada fila para modificar todas las columnas de negocio excepto `dim_dam` (clave), con recálculo de los campos derivados y replicación de los cambios a la tabla `detalles`.
- **Marca de revisión persistente**: nuevas columnas `tarifa_revisada` (bandera) y `tarifa_revisada_valor` (valor revisado); el amarillo reaparece si el valor vuelve a cambiar.
- **Procesamiento incremental** en PRMs, manifiestos y combustibles: cada corrida procesa únicamente registros nuevos y se detiene al encontrar el primer registro ya almacenado. En combustibles se registra cada declaración evaluada (`declaraciones_procesadas`) para saltar también las clasificadas como no combustible en corridas futuras.
- **Eliminación de "Reprocesar" y "Normalizar"**: se quitan del panel y sus endpoints de barrido completo (`POST /combustibles/reprocesar`, `POST /combustibles/normalizar`), que dejaban de tener sentido con el flujo incremental y pisaban las ediciones.

## Capabilities

### New Capabilities

- `tabla-combustibles`: interfaz de la tabla de administración de Combustibles: alertas visuales de fila, documentos en línea, edición por fila y marcado de revisión de tarifa.

### Modified Capabilities

- `combustibles`: edición manual de registros con recálculo de campos derivados y replicación a `detalles`; nueva marca `tarifa_revisada_valor`; procesamiento incremental de las corridas; la replicación deja de depender del reprocesamiento.
- `prm-scraping`: la corrida de PRMs se vuelve incremental y deja de reprocesar registros existentes.
- `manifiestos`: la corrida de manifiestos se vuelve incremental y deja de reconsultar manifiestos ya descargados.

## Impact

- **Frontend**: `frontend/src/App.jsx` (sección Combustibles), `frontend/src/api.js` (nuevas llamadas `putCombustible`, `ignorarTarifa`; se eliminan `normalizarCombustibles` y `reprocesarCombustibles`), `frontend/src/index.css` (nueva clase `soft-yellow`).
- **Backend**: `backend/src/routes/api.js` (nuevos `PUT /combustibles/:id` y `POST /combustibles/:id/ignorar`; se eliminan endpoints de reprocesar/normalizar), `backend/src/services/combustiblesService.js`, `backend/src/services/runService.js` y `backend/src/services/manifiestosService.js` (procesamiento incremental; se eliminan `reprocesarCombustibles` y `normalizarCombustibles`).
- **Base de datos**: `db/init/001_schema.sql` (nuevas columnas `tarifa_revisada boolean` y `tarifa_revisada_valor numeric` en `combustibles`, idempotentes) y `db/init/008_declaraciones_procesadas.sql` (nueva tabla `declaraciones_procesadas` con backfill idempotente).
- **Sin dependencias nuevas**; no cambia la sección Presentación (sigue siendo de solo lectura).
