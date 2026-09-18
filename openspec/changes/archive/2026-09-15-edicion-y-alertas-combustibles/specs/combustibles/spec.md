## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Replicación a la tabla de detalles

**Reason**: El reprocesamiento se elimina; la replicación ahora ocurre en la extracción y en la edición manual.
**Migration**: El requisito se reemplaza por "Replicación de combustibles a detalles" con los escenarios de extracción y edición manual.
