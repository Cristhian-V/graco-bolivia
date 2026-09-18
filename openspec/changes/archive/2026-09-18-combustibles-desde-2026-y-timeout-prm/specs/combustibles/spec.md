## ADDED Requirements

### Requirement: Filtro por fecha de la corrida de combustibles

El sistema SHALL procesar en la corrida de extracción de combustibles únicamente los manifiestos cuya `fecha` sea igual o posterior a la fecha inicial configurada (por defecto 2026-01-01), y SHALL omitir los anteriores.

#### Scenario: Manifiesto anterior a la fecha inicial
- **WHEN** un manifiesto tiene fecha anterior a la fecha inicial configurada
- **THEN** se omite en la extracción de combustibles

#### Scenario: Manifiesto dentro del rango
- **WHEN** un manifiesto tiene fecha igual o posterior a la fecha inicial
- **THEN** se procesa normalmente
