## Purpose

Mantiene las tablas de referencia del sistema (proveedores, productos, paises, incoterms, transportes) y amplía la tabla de aduanas, permitiendo dar de alta nuevos registros desde la web.

## ADDED Requirements

### Requirement: Tablas de referencia

El sistema SHALL mantener las tablas de referencia `proveedores` (nombre), `productos` (nombre, nandina), `paises` (nombre, codigo_iso2), `incoterms` (codigo, descripcion) y `transportes` (nombre), sembradas desde el Excel de referencia.

#### Scenario: Catálogos disponibles
- **WHEN** se consulta una tabla de referencia
- **THEN** se devuelven sus registros con los campos correspondientes

### Requirement: Aduanas con tipo y ciudad

El sistema SHALL mantener la tabla `aduanas` con los campos `tipo`, `ciudad`, `codigo` y `nombre`.

#### Scenario: Consulta de aduanas
- **WHEN** se consulta el catálogo de aduanas
- **THEN** se devuelven el tipo, la ciudad, el código y el nombre de cada aduana

### Requirement: Alta de registros de referencia

El sistema SHALL permitir dar de alta (solo añadir) registros en las tablas de referencia desde la web.

#### Scenario: Alta de un registro
- **WHEN** el usuario ingresa los datos de un nuevo registro de referencia y confirma
- **THEN** el registro se crea y queda disponible en el catálogo

#### Scenario: Registro duplicado
- **WHEN** se intenta añadir un registro que ya existe por su clave
- **THEN** se rechaza la creación para no duplicarlo
