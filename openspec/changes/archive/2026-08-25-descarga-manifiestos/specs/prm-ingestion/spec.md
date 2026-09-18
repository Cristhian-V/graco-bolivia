## ADDED Requirements

### Requirement: Catálogo de aduanas

El sistema SHALL mantener una tabla `aduanas` con el código de aduana y su nombre, y SHALL permitir listar y dar de alta nuevos registros a través de la API.

#### Scenario: Listado de aduanas
- **WHEN** se consulta el catálogo de aduanas por API
- **THEN** se devuelven el código y el nombre de cada aduana

#### Scenario: Alta de aduana
- **WHEN** se envía un código de aduana y un nombre que no existen
- **THEN** se crea el registro de aduana

#### Scenario: Aduana duplicada
- **WHEN** se envía un código de aduana que ya existe
- **THEN** se rechaza la creación para no duplicar el registro
