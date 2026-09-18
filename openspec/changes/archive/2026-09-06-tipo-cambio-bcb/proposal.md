## Why

El tipo de cambio que se extraía del PDF de la factura de transporte resultó poco confiable: al cruzarlo con la cotización oficial del Banco Central de Bolivia, 31 de 98 registros no coincidían (T/C desactualizados como 8.20 o 6.96, y errores de parseo que capturaban el número de factura). Se necesita una fuente oficial de tipo de cambio por fecha, consultable desde el frontend, y usarla en lugar del dato de la factura.

## What Changes

- Nueva tabla `tipo_cambio` con el histórico del tipo de cambio oficial diario (Bs/USD) del BCB, con su propia sección en el frontend.
- Primera carga desde el archivo `cotizacion.xls` (cotizaciones oficiales 2026).
- Actualización posterior scrapeando el endpoint del BCB (`otras_imprimir2XLS.php?qdd=&qmm=&qaa=`), que devuelve la tabla diaria en .xls.
- En `combustibles`, `tipo_cambio_trans` pasa a tomarse del BCB por `fecha_factura_trans` (fecha exacta), reemplazando el parseo del PDF. De la factura de transporte solo se necesita la fecha. Se aplica a todos los casos, incluidas las facturas en bolivianos.

## Capabilities

### New Capabilities
- `tipo-cambio`: histórico del tipo de cambio oficial del BCB (Bs/USD), con carga inicial desde `cotizacion.xls`, actualización desde el endpoint del BCB y visualización en el frontend.

### Modified Capabilities
- `combustibles`: el `tipo_cambio_trans` se obtiene del tipo de cambio oficial del BCB según la fecha de la factura de transporte, en lugar de extraerlo del PDF.

## Impact

- Backend: nueva tabla `tipo_cambio`, módulo de carga/actualización del BCB, y cambio en la extracción de `combustibles` para consultar el TC por fecha.
- Frontend: nueva sección "Tipo de cambio" (histórico), y la sección Combustibles deja de marcar rojo los casos que ahora se resuelven con el BCB.
- Reemplaza la lógica actual de parseo del T/C desde el PDF de la factura de transporte (se conserva solo la extracción de la fecha).
