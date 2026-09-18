## Purpose

Presenta los datos de importación de combustibles en un panel de visualización de solo lectura, alimentado por una tabla de presentación propia (`detalles`) que combina el histórico cargado desde Excel con los datos que replica el scraper en vivo.

## ADDED Requirements

### Requirement: Tabla de presentación detalles

El sistema SHALL mantener una tabla `detalles` con las mismas columnas de negocio que `combustibles` y una clave única sobre `dim_dam`.

#### Scenario: Estructura de la tabla
- **WHEN** se crea la tabla `detalles`
- **THEN** contiene las columnas `crt`, `uso`, `fecha`, `aduana`, `dim_dam`, `incoterm`, `producto`, `proveedor`, `importador`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `tramo_flete`, `us_unitario`, `importador_nit`, `pais_procedencia`, `modalidad_despacho`, `us_precio_marcador`, `fecha_factura_trans`, `flete_total_usd`, `flete_total_bs`, `tipo_cambio_trans`, `tarifa_flete_usd_m3` y `tarifa_flete_bob_m3`

#### Scenario: Deduplicación
- **WHEN** se inserta un registro cuyo `dim_dam` ya existe en `detalles`
- **THEN** el registro se actualiza en lugar de duplicarse

### Requirement: Carga de datos históricos

El sistema SHALL cargar en `detalles` los datos históricos desde el Excel de referencia (hoja `detalles`), desde enero del año en curso.

#### Scenario: Carga del histórico
- **WHEN** se ejecuta la carga inicial del histórico
- **THEN** los registros con `fecha` desde enero del año en curso se insertan en `detalles` sin duplicar `dim_dam`

### Requirement: Importador normalizado por NIT

El sistema SHALL almacenar el importador en `detalles` usando el nombre canónico de la tabla `clientes` cuando coincide por NIT, y SHALL mostrar el nombre junto con el NIT.

#### Scenario: Importador con NIT conocido
- **WHEN** el `importador_nit` coincide con un cliente
- **THEN** se guarda el nombre normalizado del cliente junto con su NIT

#### Scenario: Importador sin NIT conocido
- **WHEN** el `importador_nit` no existe en `clientes`
- **THEN** se conserva el nombre del importador tal como viene del combustible

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: precio marcador, precio promedio, total CIF, volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, volumen por importador, tarifa de flete promedio por tramo, market share por proveedor, volumen por procedencia y valor CIF por país.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs y los gráficos calculados sobre `detalles`

### Requirement: Fletes y tarifas en bolivianos

El sistema SHALL presentar los valores de flete y tarifa en bolivianos usando `flete_total_bs` y `tarifa_flete_bob_m3`.

#### Scenario: Flete en bolivianos visible
- **WHEN** se muestran los indicadores de flete
- **THEN** se incluye la tarifa de flete en bolivianos (`tarifa_flete_bob_m3`) y el flete total en bolivianos (`flete_total_bs`)

### Requirement: Filtros y pestañas

El sistema SHALL permitir filtrar el panel por mes, importador, proveedor, procedencia y aduana, y SHALL permitir alternar entre Diésel y Gasolina 90.

#### Scenario: Filtrado
- **WHEN** el usuario selecciona uno o más filtros
- **THEN** los KPIs y los gráficos se recalculan con los registros que cumplen el filtro

#### Scenario: Cambio de producto
- **WHEN** el usuario alterna la pestaña entre Diésel y Gasolina 90
- **THEN** el panel se limita al producto seleccionado

### Requirement: Solo lectura

El sistema SHALL presentar el panel como de solo lectura, sin importar ni exportar los datos de `detalles` desde esta sección.

#### Scenario: Sin edición desde el panel
- **WHEN** el usuario usa la sección Presentación
- **THEN** no se ofrecen acciones de importar ni exportar; los datos solo se consultan
