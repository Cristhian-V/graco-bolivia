# tipo-cambio Specification

## Purpose

Mantiene el histórico del tipo de cambio oficial diario (Bs/USD) del Banco Central de Bolivia, con carga inicial desde un archivo de cotizaciones y actualización desde el sitio web del BCB, y lo expone para su consulta.

## Requirements

### Requirement: Carga inicial desde el archivo de cotizaciones

El sistema SHALL cargar el histórico inicial del tipo de cambio desde el archivo `cotizacion.xls`, que contiene las cotizaciones oficiales diarias del BCB por mes.

#### Scenario: Carga del archivo
- **WHEN** se procesa el archivo `cotizacion.xls`
- **THEN** se registran en la tabla `tipo_cambio` las cotizaciones de cada día con su fecha y valor

#### Scenario: Fecha ya existente
- **WHEN** una fecha del archivo ya existe en la tabla
- **THEN** se actualiza su valor sin duplicar la fecha

### Requirement: Actualización desde el BCB

El sistema SHALL actualizar el tipo de cambio consultando el endpoint del BCB, que devuelve la tabla de cotización diaria en formato .xls.

#### Scenario: Consulta de una fecha
- **WHEN** se consulta el endpoint `otras_imprimir2XLS.php?qdd=&qmm=&qaa=` para una fecha
- **THEN** se obtiene la cotización oficial del dólar estadounidense (Bs/USD) de esa fecha y se registra en la tabla

#### Scenario: Fecha sin cotización
- **WHEN** el BCB no tiene cotización para una fecha
- **THEN** no se registra un valor para esa fecha

### Requirement: Almacenamiento del histórico

El sistema SHALL almacenar el tipo de cambio en una tabla `tipo_cambio` con la fecha y el valor, usando la fecha como clave única.

#### Scenario: Alta de una cotización
- **WHEN** se registra una cotización con su fecha y valor
- **THEN** la fecha queda disponible para su consulta por fecha exacta

### Requirement: Consulta y visualización

El sistema SHALL exponer el histórico del tipo de cambio por API y SHALL mostrarlo en una sección del frontend.

#### Scenario: Listado del histórico
- **WHEN** se consulta el histórico del tipo de cambio
- **THEN** se devuelve la lista de fechas con su valor ordenadas cronológicamente

#### Scenario: Consulta por fecha
- **WHEN** se consulta el tipo de cambio de una fecha exacta
- **THEN** se devuelve el valor oficial de esa fecha

### Requirement: Actualización diaria del tipo de cambio

El sistema SHALL actualizar automáticamente la tabla `tipo_cambio` desde el BCB como parte de la corrida diaria, cubriendo el período en curso, de modo que las extracciones nuevas encuentren la cotización de su fecha.

#### Scenario: Actualización en la corrida diaria
- **WHEN** se ejecuta la corrida diaria
- **THEN** se consultan y registran en `tipo_cambio` las cotizaciones del BCB del período en curso

#### Scenario: Fecha sin cotización
- **WHEN** el BCB no tiene cotización para una fecha
- **THEN** esa fecha no se registra y no se interrumpe la corrida

### Requirement: Sincronización del tipo de cambio de combustibles

El sistema SHALL re-derivar el `tipo_cambio_trans` de los registros de combustible que lo tienen nulo, usando la cotización de su `fecha_factura_trans`; SHALL recalcular `flete_total_bs` y `tarifa_flete_bob_m3`, y SHALL replicar los cambios a `detalles`.

#### Scenario: Registros con tipo de cambio faltante
- **WHEN** existen registros de combustible con `tipo_cambio_trans` nulo y `fecha_factura_trans` conocida
- **THEN** se obtiene la cotización de esa fecha y se completa `tipo_cambio_trans`

#### Scenario: Recalculo del flete en bolivianos
- **WHEN** se completa `tipo_cambio_trans` de un registro
- **THEN** `flete_total_bs` se recalcula como `flete_total_usd × tipo_cambio_trans` y `tarifa_flete_bob_m3` como `flete_total_bs / cantidad_m3`

#### Scenario: Replicación a detalles
- **WHEN** se sincroniza un registro de combustible
- **THEN** los valores actualizados se replican en `detalles`
