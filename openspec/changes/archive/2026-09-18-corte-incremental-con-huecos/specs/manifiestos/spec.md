## MODIFIED Requirements

### Requirement: Procesamiento incremental de manifiestos

El sistema SHALL detener la búsqueda de manifiestos de un cliente al primer manifiesto ya descargado para no reconsultar los existentes, siempre que los manifiestos guardados de ese cliente y aduana lleguen hasta la fecha inicial `desde` (sin huecos). Si el manifiesto guardado más antiguo es posterior a `desde`, el sistema SHALL recorrer el rango de fechas completo sin cortar por manifiestos existentes, para llenar el hueco.

#### Scenario: Manifiesto ya descargado
- **WHEN** durante la paginación se encuentra un manifiesto cuyo `numMan` ya está registrado y los manifiestos guardados de la aduana llegan hasta `desde`
- **THEN** se detiene la paginación de esa aduana

#### Scenario: Aduana sin manifiestos previos
- **WHEN** la aduana no tiene manifiestos descargados previamente
- **THEN** se procesa el rango de fechas completo

#### Scenario: Hueco de manifiestos
- **WHEN** el manifiesto guardado más antiguo de la aduana es posterior a `desde`
- **THEN** no se corta por encontrar manifiestos existentes y se recorre la paginación hasta `desde` para completar el hueco
