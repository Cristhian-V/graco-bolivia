## REMOVED Requirements

### Requirement: Persistencia con deduplicación

**Reason**: Se elimina la tabla y la persistencia de PRMs.
**Migration**: Ya no se almacenan PRMs.

### Requirement: Programación diaria

**Reason**: El sistema ya no extrae PRMs.
**Migration**: La programación diaria de la cadena está en `programacion-corridas` (manifiestos → combustibles).

### Requirement: Exposición de datos vía API

**Reason**: Se eliminan los endpoints de PRMs (`/clientes/:nit/prms`, `/resumen`, `/historico`).
**Migration**: Los datos de importación se consultan desde la sección Presentación.
