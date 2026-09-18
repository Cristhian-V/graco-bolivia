## Purpose

Extrae por API los datos comerciales de la declaración de importación (DIM, o DAM cuando no hay DIM) de cada despacho de combustible y los persiste en una tabla, guardando además localmente los documentos de soporte del despacho.

## ADDED Requirements

### Requirement: Obtención de la declaración por manifiesto

El sistema SHALL obtener, para cada manifiesto delimitado como combustible, el código de la DIM (declaración de importación, código `DI`) y, si no existe DIM, el código de la DAM, y SHALL obtener sus datos estructurados por API.

#### Scenario: Despacho con DIM
- **WHEN** el manifiesto tiene asociada una DIM
- **THEN** se obtienen los datos de la DIM

#### Scenario: Despacho sin DIM
- **WHEN** el manifiesto no tiene DIM pero sí DAM
- **THEN** se obtienen los datos equivalentes de la DAM

### Requirement: Extracción de los datos de la declaración

El sistema SHALL extraer de la declaración los siguientes datos: `crt`, `uso`, `fecha`, `aduana`, `dim_dam`, `incoterm`, `producto`, `proveedor`, `importador`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `tramo_flete`, `us_unitario`, `lugar_entrega`, `importador_nit`, `pais_procedencia`, `modalidad_despacho`, `us_precio_marcador`, `fecha_factura_trans`, `flete_total_usd`, `flete_total_bs`, `tipo_cambio_trans` y `tarifa_flete_usd_m3`.

#### Scenario: Datos provenientes de la declaración
- **WHEN** se leen los datos de la DIM (o DAM)
- **THEN** `crt`, `uso`, `incoterm`, `producto`, `proveedor`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `us_unitario`, `lugar_entrega`, `pais_procedencia`, `modalidad_despacho` y `flete_total_usd` se toman de la declaración; `importador` e `importador_nit` de la base de datos interna; `fecha` y `aduana` de la sección de agrupación de PRMs; `fecha_factura_trans`, `tipo_cambio_trans` y `tramo_flete` de la factura de transporte

#### Scenario: Campos derivados
- **WHEN** se calculan los campos derivados
- **THEN** `dim_dam` es el código `DI` si hay DIM y si no el código de la DAM; `us_unitario` es el precio unitario multiplicado por 1000; `tramo_flete` combina el origen y el destino final de la factura de transporte; `us_precio_marcador` es 1120; `flete_total_usd` es el flete real declarado; `flete_total_bs` es `flete_total_usd` multiplicado por `tipo_cambio_trans`; `tarifa_flete_usd_m3` es `flete_total_usd` dividido entre `cantidad_m3`

### Requirement: Almacenamiento y deduplicación

El sistema SHALL almacenar cada extracción en la tabla `combustibles` y SHALL deduplicar por el número de declaración (`dim_dam`), de modo que una declaración no se registre dos veces.

#### Scenario: Declaración nueva
- **WHEN** llega una declaración cuyo `dim_dam` no está registrado
- **THEN** se inserta un registro nuevo

#### Scenario: Declaración ya registrada
- **WHEN** llega una declaración cuyo `dim_dam` ya existe
- **THEN** se actualiza el registro sin duplicarlo

### Requirement: Descarga de documentos de despacho

El sistema SHALL guardar localmente todos los documentos de la sección "L. Documentos" de la DIM (o de la DAM si no hay DIM) en una carpeta del servidor, y SHALL permitir descargarlos.

#### Scenario: Guardado de documentos
- **WHEN** se procesa una declaración
- **THEN** se descargan sus documentos de soporte a una carpeta por despacho

#### Scenario: Descarga de un documento
- **WHEN** el usuario solicita un documento
- **THEN** se descarga el archivo guardado localmente

### Requirement: Programación semanal

El sistema SHALL ejecutar la extracción de datos de combustibles automáticamente cada sábado, después de la corrida de manifiestos.

#### Scenario: Disparo tras manifiestos
- **WHEN** la corrida semanal de manifiestos finaliza
- **THEN** se dispara la corrida de extracción de combustibles
