## MODIFIED Requirements

### Requirement: Tablas de referencia

El sistema SHALL mantener las tablas de referencia `proveedores` (nombre), `productos` (nombre, nandina), `paises` (nombre, codigo_iso2), `incoterms` (codigo, descripcion), `transportes` (nombre) y `destinos` (destino, departamento), sembradas desde el Excel de referencia.

#### Scenario: Catálogos disponibles
- **WHEN** se consulta una tabla de referencia
- **THEN** se devuelven sus registros con los campos correspondientes

#### Scenario: Destinos sembrados
- **WHEN** se consulta el catálogo de destinos
- **THEN** se devuelven los destinos con su departamento, incluyendo los departamentos de la carga inicial
