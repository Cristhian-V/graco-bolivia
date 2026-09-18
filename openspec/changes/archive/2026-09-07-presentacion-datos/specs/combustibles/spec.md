## ADDED Requirements

### Requirement: Replicación a la tabla de detalles

El sistema SHALL insertar o actualizar en la tabla `detalles` cada registro de combustible al extraerlo o reprocesarlo, con sus campos finales (incluido `tarifa_flete_bob_m3`).

#### Scenario: Extracción de un combustible nuevo
- **WHEN** se extrae un combustible nuevo
- **THEN** además de guardarse en `combustibles`, se inserta en `detalles` con sus campos finales

#### Scenario: Reprocesamiento
- **WHEN** se reprocesan los combustibles
- **THEN** los registros se actualizan también en `detalles`
