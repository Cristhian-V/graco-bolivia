## Why

Hoy el sistema descarga los manifiestos (PDF) pero no extrae los datos comerciales de las declaraciones de importación. Se necesita obtener, a partir de la DIM (o DAM cuando no hay DIM), los campos de la importación de combustibles —producto, incoterm, cantidades, fletes, tipo de cambio— y persistirlos en una tabla estructurada, además de guardar localmente los documentos de soporte de cada despacho.

## What Changes

- Nueva delimitación de manifiestos: solo se descargan manifiestos cuyos ítems de PRM tienen tipo de embalaje `VL` / `LIQUIDO A GRANEL` (combustibles a granel).
- Nueva extracción de datos de la declaración: para cada manifiesto delimitado se obtiene la DIM (código `DI`); si no existe DIM, se obtienen los datos equivalentes de la DAM, vía API estructurada (no parseando el PDF).
- Nueva tabla `combustibles` con las columnas: `crt`, `uso`, `fecha`, `aduana`, `dim_dam`, `incoterm`, `producto`, `proveedor`, `importador`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `tramo_flete`, `us_unitario`, `lugar_entrega`, `importador_nit`, `pais_procedencia`, `modalidad_despacho`, `us_precio_marcador`, `flete_origen_frontera`, `tipo_cambio_fof`, `flete_frontera_destino`, `tipo_cambio_ffd`, `total_flete_usd`, `tarifa_flete_usd_m3`.
- Nueva descarga de documentos de despacho: se guardan localmente todos los documentos de la sección "L. Documentos" de la DIM (o DAM si no hay DIM) en una carpeta del servidor, descargables desde el frontend.

## Capabilities

### New Capabilities
- `combustibles`: extracción por API de los datos de la DIM (o DAM) de cada despacho de combustible, almacenamiento en la tabla `combustibles` y descarga de los documentos de despacho.

### Modified Capabilities
- `manifiestos`: la descarga de manifiestos se limita a los de tipo de embalaje `VL` / `LIQUIDO A GRANEL`.

## Impact

- Backend: nuevo cliente para la API de DIM/DAM (`n-ingreso/api/json/dim/...`, `ssu-mim-ingreso-rest/dim/...`), nueva tabla `combustibles`, carpeta `documentos-despacho/` (volumen), y endpoints para consultar los datos y descargar los documentos.
- `manifiestos`: filtro adicional de tipo de embalaje sobre los ítems del PRM.
- Frontend: nueva sección para visualizar los datos extraídos y descargar los documentos.
- Requiere un spike para mapear los códigos del formulario (E11, H7, C2, C8, etc.) a los nombres del JSON estructurado de la API, y para confirmar la equivalencia de campos entre DIM y DAM.
