## MODIFIED Requirements

### Requirement: Descarga de documentos de despacho

El sistema SHALL guardar localmente el PDF de la DIM en una carpeta del servidor y SHALL registrar los documentos de soporte de la sección "L. Documentos" con su URL pública de la aduana (`b-oce/rest/downloadFile/{id}`) sin descargarlos. SHALL permitir descargar ambos.

#### Scenario: Guardado de documentos
- **WHEN** se procesa una declaración
- **THEN** se descarga y guarda el PDF de la DIM y los documentos de soporte se registran con su URL pública sin descargarlos

#### Scenario: Documentos de soporte por URL
- **WHEN** la declaración tiene documentos de soporte
- **THEN** se registran con su URL pública de la aduana, sin guardar el archivo en el servidor

#### Scenario: Descarga de un documento
- **WHEN** el usuario solicita un documento
- **THEN** se descarga el archivo local si es la DIM, o se redirige a la URL pública si es un documento de soporte
