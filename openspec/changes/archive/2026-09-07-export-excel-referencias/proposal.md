## Why

El sistema extrae los datos de combustibles pero no los exporta en el formato completo que el usuario necesita (las 8 hojas del Excel de referencia), ni permite gestionar las tablas de referencia vía web. Falta un campo de tarifa en bolivianos, redondear los valores a dos decimales, y poder descargar por mes/año.

## What Changes

- Nueva columna `tarifa_flete_bob_m3` (Bs/m³) calculada como `flete_total_bs / cantidad_m3`.
- Redondeo de los datos numéricos a dos decimales al guardar en la base de datos.
- Exportación Excel con las 8 hojas (clientes, proveedores, productos, aduanas, paises, incoterms, transportes, detalles) en el orden definido en `combustibles_export.xlsx`, con filtro de mes/año que aplica solo a la hoja "detalles".
- Tablas de referencia nuevas (`proveedores`, `productos`, `paises`, `incoterms`, `transportes`) sembradas desde el Excel, y `aduanas` ampliada con `tipo` y `ciudad`.
- Sección web para dar de alta (solo añadir) registros en las tablas de referencia.
- Un cliente añadido por web queda incluido en los procesos automáticos (siguiente corrida).

## Capabilities

### New Capabilities
- `referencias`: catálogo de tablas de referencia (proveedores, productos, paises, incoterms, transportes) con alta vía web, y campos adicionales en `aduanas`.
- `export-excel`: exportación del Excel con las 8 hojas en el orden del modelo, con filtro por mes/año y redondeo a dos decimales.

### Modified Capabilities
- `combustibles`: añadir `tarifa_flete_bob_m3` y redondear los datos numéricos a dos decimales.

## Impact

- Backend: nuevas tablas de referencia (esquema + seed), endpoint de exportación Excel multi-hoja con filtro de mes/año, y redondeo en la extracción de `combustibles`.
- Frontend: sección de alta de referencias (solo añadir) y selector mes/año en la descarga.
- Los clientes añadidos por web se crean con `activo = true`, por lo que entran en la siguiente corrida de los procesos automáticos.
