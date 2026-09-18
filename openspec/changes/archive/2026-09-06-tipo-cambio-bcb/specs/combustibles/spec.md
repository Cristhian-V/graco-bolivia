## ADDED Requirements

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
