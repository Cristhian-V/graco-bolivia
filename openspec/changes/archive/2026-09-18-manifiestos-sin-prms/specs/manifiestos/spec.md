## MODIFIED Requirements

### Requirement: Búsqueda de manifiestos por cliente y aduana

El sistema SHALL buscar los PRMs de un cliente en la sección "Agrupación de PRM's" de SUMA usando el NIT del importador (campo consignatario) **sin acotar la aduana de recepción**, y SHALL paginar los resultados hasta agotarlos.

#### Scenario: Búsqueda con resultados
- **WHEN** se consulta el endpoint `criBus` con `numDocCos` igual al NIT del importador y sin aduana de recepción
- **THEN** se obtienen los PRMs de todas las aduanas del cliente con su manifiesto asociado (`datGen.numMan` e `datGen.idMan`) y su aduana (`datGen.aduRec.cod`)

#### Scenario: Cliente sin manifiestos
- **WHEN** un cliente no tiene resultados
- **THEN** el sistema continúa con el siguiente cliente sin error

## REMOVED Requirements

### Requirement: Obtención de las aduanas por cliente

**Reason**: Las aduanas ya no se derivan de los PRMs; la búsqueda `criBus` sin aduana devuelve todas las del cliente.
**Migration**: La búsqueda de manifiestos se hace por cliente sin acotar aduana y se usa la aduana del propio registro.
