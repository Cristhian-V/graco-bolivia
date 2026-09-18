## MODIFIED Requirements

### Requirement: Filtro por rango de fechas

El sistema SHALL filtrar los PRMs devueltos por la búsqueda por el campo `fecTra`, conservando únicamente los del rango configurado (primera carga julio en adelante; corridas diarias el mes en curso).

#### Scenario: Filtro de la corrida semanal
- **WHEN** la corrida es diaria
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` dentro del mes en curso

#### Scenario: Primera carga
- **WHEN** la corrida es la primera carga (backfill)
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` desde la fecha inicial configurada (por defecto 2026-07-01)

## REMOVED Requirements

### Requirement: Programación semanal

**Reason**: La programación se centraliza y pasa a ser diaria; el detalle vive en la capacidad `programacion-corridas`.
**Migration**: El disparo diario de la descarga de manifiestos queda cubierto por la cadena de `programacion-corridas`, que corre manifiestos después de PRMs.
