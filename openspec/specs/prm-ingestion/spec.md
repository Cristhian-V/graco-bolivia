# prm-ingestion Specification

## Purpose

Mantiene el catálogo de clientes, el registro de ejecuciones y el catálogo de aduanas. La persistencia de PRMs fue retirada.

## Requirements

### Requirement: Catálogo de clientes

El sistema SHALL mantener una tabla `clientes` con el NIT y nombre de cada cliente, y SHALL iterar la extracción sobre los NITs de esa tabla.

#### Scenario: Alta de cliente
- **WHEN** se registra un cliente con su NIT y nombre
- **THEN** el cliente queda disponible para la extracción diaria

### Requirement: Registro de ejecuciones

El sistema SHALL registrar cada corrida en la tabla `ejecuciones` con inicio, fin, estado, total de PRMs, PRMs nuevos y errores.

#### Scenario: Corrida exitosa
- **WHEN** una corrida termina sin errores
- **THEN** se registra con estado `OK` y los contadores correspondientes

#### Scenario: Corrida con fallos
- **WHEN** una corrida termina con errores en algunos clientes
- **THEN** se registra el estado y los contadores de errores para su revisión

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
