## MODIFIED Requirements

### Requirement: Obtención de la declaración por manifiesto

El sistema SHALL obtener, para cada manifiesto delimitado como combustible que tenga DIM, el código de la declaración de importación (código `DI`) y SHALL obtener sus datos estructurados por API. Los manifiestos que no tengan DIM SHALL omitirse.

#### Scenario: Despacho con DIM
- **WHEN** el manifiesto tiene asociada una DIM
- **THEN** se obtienen los datos de la DIM

#### Scenario: Despacho sin DIM
- **WHEN** el manifiesto no tiene DIM (solo DAM o ninguno)
- **THEN** el manifiesto se omite sin extraer datos

### Requirement: Extracción de los datos de la declaración

El sistema SHALL extraer de la declaración los siguientes datos: `crt`, `uso`, `fecha`, `aduana`, `dim_dam`, `incoterm`, `producto`, `proveedor`, `importador`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `tramo_flete`, `us_unitario`, `importador_nit`, `pais_procedencia`, `modalidad_despacho`, `us_precio_marcador`, `fecha_factura_trans`, `flete_total_usd`, `flete_total_bs`, `tipo_cambio_trans` y `tarifa_flete_usd_m3`.

#### Scenario: Datos provenientes de la declaración
- **WHEN** se leen los datos de la DIM
- **THEN** `crt`, `uso`, `incoterm`, `producto`, `proveedor`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `us_unitario`, `pais_procedencia` y `modalidad_despacho` se toman de la declaración; `importador` e `importador_nit` de la base de datos interna; `fecha` y `aduana` de la sección de agrupación de PRMs; `tramo_flete` del lugar de embarque y el departamento de destino de la declaración; `fecha_factura_trans` y el flete (`flete_total_usd` y `flete_total_bs`) de la factura de transporte

#### Scenario: Campos derivados
- **WHEN** se calculan los campos derivados
- **THEN** `dim_dam` es el código `DI`; `us_unitario` es el precio unitario multiplicado por 1000; `tramo_flete` combina el lugar de embarque y el departamento de destino; `flete_total_usd` y `flete_total_bs` se derivan del total de la factura de transporte y su moneda, convirtiendo con el tipo de cambio; `tarifa_flete_usd_m3` es `flete_total_usd` dividido entre `cantidad_m3`

#### Scenario: Precio marcador por fecha
- **WHEN** se extrae un combustible con su `fecha`
- **THEN** `us_precio_marcador` se toma del precio marcador registrado para esa fecha y, si no existe, se usa el valor por defecto (1120)
