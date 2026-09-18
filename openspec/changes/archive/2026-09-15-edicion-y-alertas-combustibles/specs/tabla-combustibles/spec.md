## Purpose

Define la interfaz de la tabla de administración de la sección Combustibles: alertas visuales por fila, consulta de documentos en línea, edición por fila y marcado de revisión de la tarifa de flete.

## ADDED Requirements

### Requirement: Alertas visuales de fila

El sistema SHALL pintar la fila completa de un registro de combustible según el estado de su tarifa de flete y de su tipo de cambio de transporte.

#### Scenario: Tarifa de flete alta o nula
- **WHEN** el `tarifa_flete_usd_m3` de un registro es nulo o mayor a 150
- **THEN** la fila se muestra con fondo amarillo

#### Scenario: Tipo de cambio nulo
- **WHEN** el `tipo_cambio_trans` de un registro es nulo
- **THEN** la fila se muestra con fondo rojo suave

#### Scenario: Ambas condiciones coinciden
- **WHEN** un registro tiene `tipo_cambio_trans` nulo y a la vez `tarifa_flete_usd_m3` nulo o mayor a 150
- **THEN** la fila se muestra con fondo rojo suave, que prevalece sobre el amarillo

#### Scenario: Tarifa revisada
- **WHEN** el valor de `tarifa_flete_usd_m3` coincide con la marca de revisión del registro
- **THEN** la fila no se muestra con fondo amarillo, aunque la tarifa sea nula o mayor a 150

### Requirement: Documentos en línea

El sistema SHALL abrir los documentos de soporte de un despacho debajo del registro correspondiente al pulsar el botón "Docs", en lugar de mostrarlos al final de la tabla.

#### Scenario: Apertura de documentos
- **WHEN** el usuario pulsa "Docs" en un registro
- **THEN** se muestra la lista de documentos inmediatamente debajo de ese registro

#### Scenario: Alternar documentos
- **WHEN** el usuario vuelve a pulsar "Docs" o pulsa "Docs" en otro registro
- **THEN** se cierra la lista abierta y, en su caso, se abre la del registro seleccionado

#### Scenario: Registro sin documentos
- **WHEN** el registro no tiene documentos asociados
- **THEN** se muestra el aviso de que no hay documentos debajo de ese registro

### Requirement: Edición por fila

El sistema SHALL ofrecer un botón "Editar" en cada fila de la tabla de combustibles que permita modificar todas las columnas de negocio excepto `dim_dam`, y SHALL guardar los cambios.

#### Scenario: Botón de edición presente
- **WHEN** se muestra una fila de la tabla
- **THEN** aparece un botón "Editar" que habilita la modificación de los datos de esa fila

#### Scenario: Guardado de la edición
- **WHEN** el usuario confirma los cambios de un registro
- **THEN** el registro se actualiza en `combustibles` y sus cambios se replican a `detalles`

#### Scenario: Clave no editable
- **WHEN** se edita un registro
- **THEN** el campo `dim_dam` no es modificable

### Requirement: Marcado de revisión de tarifa

El sistema SHALL ofrecer un botón "Ignorar" que marque la tarifa de flete como revisada y quite la alerta amarilla, persistiendo la marca en la base de datos.

#### Scenario: Revisión de una tarifa
- **WHEN** el usuario pulsa "Ignorar" en un registro con alerta amarilla
- **THEN** se guarda el valor actual de `tarifa_flete_usd_m3` como revisado y la fila deja de mostrarse en amarillo

#### Scenario: Cambio posterior del valor
- **WHEN** el valor de `tarifa_flete_usd_m3` cambia y deja de coincidir con la marca de revisión
- **THEN** la alerta amarilla vuelve a mostrarse

#### Scenario: Persistencia de la revisión
- **WHEN** se recarga la página o se vuelve a consultar la tabla
- **THEN** la marca de revisión se conserva y la alerta amarilla sigue oculta mientras el valor no cambie
