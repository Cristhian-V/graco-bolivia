## MODIFIED Requirements

### Requirement: Manifiesto de carga faltante

El sistema SHALL permitir completar, para los registros de combustibles que no tienen manifiesto de carga, el primer manifiesto de la tabla `manifiestos` que referencia su declaración (`di` o `dam`), copiando su PDF al folder de documentos y registrándolo como documento `TR-007`. El sistema SHALL mantener a lo sumo un `TR-007` por declaración, eliminando los duplicados existentes. El sistema SHALL ejecutar este completado automáticamente al finalizar cada corrida de combustibles, y SHALL ofrecer un botón en la sección Combustibles (solo para `admin`) para ejecutarlo manualmente.

#### Scenario: Backfill de manifiestos
- **WHEN** se ejecuta el backfill
- **THEN** cada combustible sin `TR-007` recibe el primer manifiesto vinculado a su declaración, registrado como documento `TR-007`

#### Scenario: Declaración sin manifiesto vinculado
- **WHEN** un combustible sin `TR-007` no tiene manifiesto vinculado en `manifiestos`
- **THEN** se omite y se informa en el resumen del backfill

#### Scenario: Un solo manifiesto por declaración
- **WHEN** existen varios `TR-007` para una misma declaración
- **THEN** se conserva uno solo y se eliminan los demás

#### Scenario: Completado automático tras la corrida
- **WHEN** termina la corrida de extracción de combustibles
- **THEN** se completan automáticamente los manifiestos de carga de los registros que no lo tenían

#### Scenario: Completado manual desde la interfaz
- **WHEN** el administrador pulsa "Completar manifiestos" en la sección Combustibles
- **THEN** se ejecuta el completado y se muestra el resumen
