## MODIFIED Requirements

### Requirement: Filtro por rango de fechas

El sistema SHALL filtrar los PRMs devueltos por la búsqueda por el campo `fecTra`, conservando únicamente los del rango configurado (primera carga desde enero 2026 en adelante; corridas diarias el mes en curso).

#### Scenario: Filtro de la corrida diaria
- **WHEN** la corrida es diaria
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` dentro del mes en curso

#### Scenario: Primera carga
- **WHEN** la corrida es la primera carga (backfill)
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` desde la fecha inicial configurada (por defecto 2026-01-01)
