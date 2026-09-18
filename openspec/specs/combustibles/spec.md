# combustibles Specification

## Purpose

Extrae por API los datos comerciales de la declaración de importación (DIM) de cada despacho de combustible y los persiste en una tabla, guardando además localmente los documentos de soporte del despacho.

## Requirements

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

### Requirement: Almacenamiento y deduplicación

El sistema SHALL almacenar cada extracción en la tabla `combustibles` y SHALL deduplicar por el número de declaración (`dim_dam`), de modo que una declaración no se registre dos veces.

#### Scenario: Declaración nueva
- **WHEN** llega una declaración cuyo `dim_dam` no está registrado
- **THEN** se inserta un registro nuevo

#### Scenario: Declaración ya registrada
- **WHEN** llega una declaración cuyo `dim_dam` ya existe
- **THEN** se actualiza el registro sin duplicarlo

### Requirement: Descarga de documentos de despacho

El sistema SHALL guardar localmente el PDF de la DIM en una carpeta del servidor y SHALL registrar los documentos de soporte de la sección "L. Documentos" con su URL pública de la aduana (`b-oce/rest/downloadFile/{id}`) sin descargarlos. SHALL permitir descargar ambos.

#### Scenario: Guardado de documentos
- **WHEN** se procesa una declaración
- **THEN** se descarga y guarda el PDF de la DIM y los documentos de soporte se registran con su URL pública sin descargarlos

#### Scenario: Documentos de soporte por URL
- **WHEN** la declaración tiene documentos de soporte
- **THEN** se registran con su URL pública de la aduana, sin guardar el archivo en el servidor

#### Scenario: Descarga de un documento
- **WHEN** el usuario solicita un documento
- **THEN** se descarga el archivo local si es la DIM, o se redirige a la URL pública si es un documento de soporte

### Requirement: Tipo de cambio desde el BCB

El sistema SHALL obtener el `tipo_cambio_trans` de cada registro de combustible a partir del tipo de cambio oficial del BCB correspondiente a la fecha de la factura de transporte (`fecha_factura_trans`), en lugar de extraerlo del PDF de la factura.

#### Scenario: Cálculo con tipo de cambio del BCB
- **WHEN** se procesa un registro con su `fecha_factura_trans`
- **THEN** se consulta el tipo de cambio oficial del BCB para esa fecha exacta y se asigna a `tipo_cambio_trans`

#### Scenario: Fecha sin cotización
- **WHEN** el BCB no tiene cotización para la fecha de la factura
- **THEN** `tipo_cambio_trans` queda nulo y el registro se marca para revisión

#### Scenario: Flete en bolivianos recalculado
- **WHEN** se tiene `flete_total_usd` y `tipo_cambio_trans` del BCB
- **THEN** `flete_total_bs` se calcula como `flete_total_usd` multiplicado por `tipo_cambio_trans`

#### Scenario: De la factura de transporte solo se usa la fecha
- **WHEN** se procesa la factura de transporte
- **THEN** solo se extrae su fecha (`fecha_factura_trans`); el tipo de cambio ya no se extrae de su texto

### Requirement: Tarifa de flete en bolivianos

El sistema SHALL calcular el campo `tarifa_flete_bob_m3` como `flete_total_bs` dividido entre `cantidad_m3`.

#### Scenario: Cálculo de la tarifa en bolivianos
- **WHEN** se procesa un registro con `flete_total_bs` y `cantidad_m3`
- **THEN** `tarifa_flete_bob_m3` es `flete_total_bs` dividido entre `cantidad_m3`

### Requirement: Redondeo de datos numéricos

El sistema SHALL redondear los datos numéricos a dos decimales al guardarlos en la base de datos.

#### Scenario: Guardado redondeado
- **WHEN** se guarda un registro con valores numéricos
- **THEN** cada valor numérico se redondea a dos decimales

### Requirement: Edición manual de registros

El sistema SHALL permitir editar manualmente un registro de combustible a través de la API, modificando todas las columnas de negocio excepto `dim_dam`, y SHALL persistir los cambios en `combustibles` y en `detalles`.

#### Scenario: Edición de un registro
- **WHEN** se actualiza un registro por su identificador con uno o más campos de negocio
- **THEN** se guardan los cambios en `combustibles` y se replica el registro actualizado a `detalles`

#### Scenario: Clave no editable
- **WHEN** se intenta modificar el `dim_dam` de un registro
- **THEN** el cambio se rechaza o se ignora, conservando la clave original

### Requirement: Recálculo de campos derivados

El sistema SHALL recalcular los campos derivados del flete al editar un registro para mantenerlos consistentes según las fórmulas: `tarifa_flete_usd_m3` = `flete_total_usd / cantidad_m3`; `flete_total_bs` = `flete_total_usd × tipo_cambio_trans`; y `tarifa_flete_bob_m3` = `flete_total_bs / cantidad_m3`.

#### Scenario: Cambio de flete o cantidad
- **WHEN** cambia `flete_total_usd` o `cantidad_m3`
- **THEN** se recalculan las tarifas y, si cambió el flete en dólares, también el flete en bolivianos, según las fórmulas

#### Scenario: Cambio de tipo de cambio
- **WHEN** cambia `tipo_cambio_trans`
- **THEN** se recalculan `flete_total_bs` y `tarifa_flete_bob_m3` según las fórmulas

#### Scenario: Dato faltante
- **WHEN** `cantidad_m3` es nula o cero, o falta `tipo_cambio_trans`
- **THEN** los campos derivados que dependan del dato faltante quedan nulos

### Requirement: Marca de revisión de tarifa

El sistema SHALL registrar que la tarifa de flete fue revisada en una columna persistente (`tarifa_revisada`) junto con el valor revisado (`tarifa_revisada_valor`), cuando el usuario marca la tarifa como revisada.

#### Scenario: Marcado de revisión
- **WHEN** el usuario marca la tarifa de un registro como revisada
- **THEN** `tarifa_revisada` queda en verdadero y `tarifa_revisada_valor` guarda el valor actual de `tarifa_flete_usd_m3`

#### Scenario: Tarifa nula revisada
- **WHEN** la tarifa revisada es nula
- **THEN** `tarifa_revisada` queda en verdadero y `tarifa_revisada_valor` queda nulo

#### Scenario: Persistencia de la marca
- **WHEN** se vuelve a consultar el registro
- **THEN** la marca `tarifa_revisada` y el valor `tarifa_revisada_valor` se mantienen almacenados

### Requirement: Procesamiento incremental de combustibles

El sistema SHALL procesar en cada corrida únicamente los manifiestos cuya declaración (`dim_dam`) no ha sido procesada antes, omitiendo tanto las declaraciones ya registradas en `combustibles` como las ya clasificadas como no combustible. El sistema SHALL registrar como procesada toda declaración que evalúa, sea combustible o no.

#### Scenario: Declaración ya registrada
- **WHEN** un manifiesto tiene un `dim_dam` que ya existe en `combustibles`
- **THEN** se omite su procesamiento sin re-extraerlo ni actualizarlo

#### Scenario: Declaración no combustible ya revisada
- **WHEN** un manifiesto tiene una declaración previamente clasificada como no combustible
- **THEN** se omite su procesamiento en las corridas siguientes

#### Scenario: Declaración nueva
- **WHEN** un manifiesto tiene un `dim_dam` no procesado
- **THEN** se extrae y se registra como procesada; si es combustible, se guarda y se replica a `detalles`

### Requirement: Replicación de combustibles a detalles

El sistema SHALL insertar o actualizar en la tabla `detalles` cada registro de combustible al extraerlo o editarlo manualmente, con sus campos finales (incluido `tarifa_flete_bob_m3`).

#### Scenario: Extracción de un combustible nuevo
- **WHEN** se extrae un combustible nuevo
- **THEN** además de guardarse en `combustibles`, se inserta en `detalles` con sus campos finales

#### Scenario: Edición manual
- **WHEN** se edita manualmente un registro de combustible
- **THEN** el registro se actualiza también en `detalles`

### Requirement: Filtro por fecha de la corrida de combustibles

El sistema SHALL procesar en la corrida de extracción de combustibles únicamente los manifiestos cuya `fecha` sea igual o posterior a la fecha inicial configurada (por defecto 2026-01-01), y SHALL omitir los anteriores.

#### Scenario: Manifiesto anterior a la fecha inicial
- **WHEN** un manifiesto tiene fecha anterior a la fecha inicial configurada
- **THEN** se omite en la extracción de combustibles

#### Scenario: Manifiesto dentro del rango
- **WHEN** un manifiesto tiene fecha igual o posterior a la fecha inicial
- **THEN** se procesa normalmente
