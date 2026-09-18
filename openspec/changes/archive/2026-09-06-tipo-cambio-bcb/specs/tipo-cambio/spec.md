## Purpose

Mantiene el histórico del tipo de cambio oficial diario (Bs/USD) del Banco Central de Bolivia, con carga inicial desde un archivo de cotizaciones y actualización desde el sitio web del BCB, y lo expone para su consulta.

## ADDED Requirements

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
