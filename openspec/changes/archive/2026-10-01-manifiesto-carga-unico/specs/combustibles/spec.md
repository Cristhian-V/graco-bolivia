## MODIFIED Requirements

### Requirement: Descarga de documentos de despacho

El sistema SHALL guardar localmente el PDF de la DIM en una carpeta del servidor y SHALL registrar los documentos de soporte de la sección "L. Documentos" con su URL pública de la aduana (`b-oce/rest/downloadFile/{id}`) sin descargarlos. Cuando la declaración traiga varios documentos de manifiesto de carga (`TR-007`), SHALL registrar solo el primero, de modo que exista a lo sumo un `TR-007` por declaración. SHALL permitir descargar todos.

#### Scenario: Guardado de documentos
- **WHEN** se procesa una declaración
- **THEN** se descarga y guarda el PDF de la DIM y los documentos de soporte se registran con su URL pública sin descargarlos

#### Scenario: Documentos de soporte por URL
- **WHEN** la declaración tiene documentos de soporte
- **THEN** se registran con su URL pública de la aduana, sin guardar el archivo en el servidor

#### Scenario: Manifiesto de carga único
- **WHEN** una declaración trae varios documentos `TR-007` (manifiesto de carga)
- **THEN** se registra solo el primero y se omiten los demás

#### Scenario: Descarga de un documento
- **WHEN** el usuario solicita un documento
- **THEN** se descarga el archivo local si es la DIM, o se redirige a la URL pública si es un documento de soporte

## ADDED Requirements

### Requirement: Manifiesto de carga faltante

El sistema SHALL permitir completar, para los registros de combustibles que no tienen manifiesto de carga, el primer manifiesto de la tabla `manifiestos` que referencia su declaración (`di` o `dam`), copiando su PDF al folder de documentos y registrándolo como documento `TR-007`. El sistema SHALL mantener a lo sumo un `TR-007` por declaración, eliminando los duplicados existentes.

#### Scenario: Backfill de manifiestos
- **WHEN** se ejecuta el backfill
- **THEN** cada combustible sin `TR-007` recibe el primer manifiesto vinculado a su declaración, registrado como documento `TR-007`

#### Scenario: Declaración sin manifiesto vinculado
- **WHEN** un combustible sin `TR-007` no tiene manifiesto vinculado en `manifiestos`
- **THEN** se omite y se informa en el resumen del backfill

#### Scenario: Un solo manifiesto por declaración
- **WHEN** existen varios `TR-007` para una misma declaración
- **THEN** se conserva uno solo y se eliminan los demás
