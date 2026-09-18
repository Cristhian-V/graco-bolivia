## MODIFIED Requirements

### Requirement: Corrida diaria programada

El sistema SHALL ejecutar automáticamente la cadena de extracción todos los días a la hora configurada (por defecto 15:00 en la zona `America/La_Paz`), en el orden manifiestos y luego combustibles.

#### Scenario: Ejecución diaria
- **WHEN** llega la hora programada y el backend está en ejecución
- **THEN** se dispara la cadena de extracción

#### Scenario: Orden de la cadena
- **WHEN** se ejecuta la cadena
- **THEN** primero corren los manifiestos y por último los combustibles
