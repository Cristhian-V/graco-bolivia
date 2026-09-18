## REMOVED Requirements

### Requirement: Consulta de PRMs por NIT

**Reason**: Se elimina la extracción de PRMs; los manifiestos ya no dependen de ellos.
**Migration**: Los manifiestos se buscan por cliente con `criBus` sin aduana.

### Requirement: Filtro por rango de fechas

**Reason**: Se elimina la extracción de PRMs.
**Migration**: Ya no aplica; la extracción de manifiestos filtra por `fecTra`.

### Requirement: Procesamiento incremental de PRMs

**Reason**: Se elimina la extracción de PRMs.
**Migration**: Ya no aplica; queda el procesamiento incremental de manifiestos.
