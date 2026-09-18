## ADDED Requirements

### Requirement: Procesamiento incremental de PRMs

El sistema SHALL detener la paginación de PRMs de un cliente en cuanto encuentra el primer registro ya almacenado, para no reprocesar en cada corrida los registros existentes.

#### Scenario: Registro ya almacenado
- **WHEN** durante la paginación se encuentra un PRM que ya está almacenado (mismo `prm`, `dam` y `di`)
- **THEN** se detiene la paginación de ese cliente, ya que la API devuelve los resultados por fecha descendente

#### Scenario: Cliente sin registros previos
- **WHEN** el cliente no tiene PRMs almacenados
- **THEN** se procesa el rango de fechas completo
