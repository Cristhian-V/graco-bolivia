## MODIFIED Requirements

### Requirement: Procesamiento incremental de PRMs

El sistema SHALL detener la paginación de PRMs de un cliente al primer registro ya almacenado para no reprocesar los existentes, siempre que los PRMs guardados del cliente lleguen hasta la fecha inicial `desde` (sin huecos). Si el registro guardado más antiguo es posterior a `desde`, el sistema SHALL recorrer el rango de fechas completo sin cortar por registros existentes, para llenar el hueco.

#### Scenario: Registro ya almacenado
- **WHEN** durante la paginación se encuentra un PRM que ya está almacenado (mismo `prm`, `dam` y `di`) y los PRMs guardados del cliente llegan hasta `desde`
- **THEN** se detiene la paginación de ese cliente

#### Scenario: Cliente sin registros previos
- **WHEN** el cliente no tiene PRMs almacenados
- **THEN** se procesa el rango de fechas completo

#### Scenario: Hueco de datos
- **WHEN** el PRM guardado más antiguo del cliente es posterior a `desde`
- **THEN** no se corta por encontrar registros existentes y se recorre la paginación hasta `desde` para completar el hueco
