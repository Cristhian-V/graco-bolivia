## ADDED Requirements

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
