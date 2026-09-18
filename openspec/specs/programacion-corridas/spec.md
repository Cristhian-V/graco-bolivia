# programacion-corridas Specification

## Purpose
Ejecuta automáticamente la cadena diaria de extracción (manifiestos → combustibles) en el horario configurado y recupera las corridas que se hayan perdido.

## Requirements

### Requirement: Corrida diaria programada

El sistema SHALL ejecutar automáticamente la cadena de extracción todos los días a la hora configurada (por defecto 15:00 en la zona `America/La_Paz`), en el orden manifiestos y luego combustibles.

#### Scenario: Ejecución diaria
- **WHEN** llega la hora programada y el backend está en ejecución
- **THEN** se dispara la cadena de extracción

#### Scenario: Orden de la cadena
- **WHEN** se ejecuta la cadena
- **THEN** primero corren los manifiestos y por último los combustibles

### Requirement: Recuperación de corridas perdidas

El sistema SHALL recuperar la corrida del día cuando el backend esté disponible después de la hora programada y no se haya ejecutado ese día, y SHALL verificar periódicamente para cubrir interrupciones por suspensión, sin duplicar corridas.

#### Scenario: Recuperación tras arranque
- **WHEN** el backend arranca después de la hora programada y no hubo corrida ese día
- **THEN** se dispara la cadena de extracción

#### Scenario: Recuperación tras suspensión
- **WHEN** el backend estuvo suspendido durante la hora programada y vuelve a estar disponible
- **THEN** se dispara la cadena de extracción del día

#### Scenario: Sin duplicados
- **WHEN** ya existe una corrida del día
- **THEN** no se dispara otra corrida automática

#### Scenario: Antes de la hora
- **WHEN** el backend está disponible antes de la hora programada y aún no corrió
- **THEN** espera a la hora programada para disparar la corrida
