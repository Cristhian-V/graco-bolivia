## ADDED Requirements

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
