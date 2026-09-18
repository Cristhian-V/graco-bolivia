## ADDED Requirements

### Requirement: Delimitación por tipo de embalaje

El sistema SHALL descargar únicamente los manifiestos cuyos PRMs tienen al menos un ítem con tipo de embalaje de código `VL` y descripción `LIQUIDO A GRANEL`.

#### Scenario: Manifiesto de combustible
- **WHEN** un manifiesto tiene un ítem con tipo de embalaje `VL` / `LIQUIDO A GRANEL`
- **THEN** el manifiesto se descarga

#### Scenario: Manifiesto que no es de combustible
- **WHEN** un manifiesto no tiene ningún ítem con tipo de embalaje `VL` / `LIQUIDO A GRANEL`
- **THEN** el manifiesto se omite
