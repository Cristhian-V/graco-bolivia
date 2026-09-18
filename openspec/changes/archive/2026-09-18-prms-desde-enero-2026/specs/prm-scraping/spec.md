## MODIFIED Requirements

### Requirement: Filtro por rango de fechas

El sistema SHALL filtrar los PRMs devueltos por la API por el campo `fecTra`, conservando únicamente los registros dentro de un rango de fechas configurable (`desde` y `hasta`).

#### Scenario: Filtro del mes en curso
- **WHEN** la corrida es diaria
- **THEN** se conservan únicamente los PRMs con `fecTra` entre el primer día del mes en curso y el día de la corrida

#### Scenario: Backfill desde fecha inicial
- **WHEN** la corrida es un backfill inicial
- **THEN** se conservan los PRMs con `fecTra` desde la fecha inicial configurada (por defecto 2026-01-01) hasta la fecha de la corrida
