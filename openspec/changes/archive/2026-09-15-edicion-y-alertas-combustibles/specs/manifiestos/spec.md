## ADDED Requirements

### Requirement: Procesamiento incremental de manifiestos

El sistema SHALL detener la búsqueda de manifiestos de un cliente en cuanto encuentra el primer manifiesto ya descargado, para no reconsultar en cada corrida los manifiestos existentes.

#### Scenario: Manifiesto ya descargado
- **WHEN** durante la paginación se encuentra un manifiesto cuyo `numMan` ya está registrado
- **THEN** se detiene la paginación de esa aduana, ya que la API devuelve los resultados por fecha descendente

#### Scenario: Aduana sin manifiestos previos
- **WHEN** la aduana no tiene manifiestos descargados previamente
- **THEN** se procesa el rango de fechas completo
