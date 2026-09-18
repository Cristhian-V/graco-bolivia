## ADDED Requirements

### Requirement: Pestañas Historial y Pendientes

El sistema SHALL dividir la sección Combustibles en dos pestañas con la barra de acciones compartida arriba: **Historial** (todos los registros) y **Pendientes** (registros con alguna validación pendiente). En ambas los registros SHALL ordenarse de la fecha más reciente a la más antigua.

#### Scenario: Pestaña Historial
- **WHEN** el usuario abre la sección Combustibles
- **THEN** ve la pestaña Historial con todos los registros ordenados de fecha más reciente a más antigua

#### Scenario: Pestaña Pendientes
- **WHEN** el usuario abre la pestaña Pendientes
- **THEN** solo se listan los registros con al menos una validación pendiente

#### Scenario: Validaciones pendientes
- **WHEN** un registro tiene `tipo_cambio_trans` nulo, o `us_unitario` mayor a 5000, o `tarifa_flete_usd_m3` nula o mayor a 150 sin revisar
- **THEN** el registro aparece en Pendientes

#### Scenario: Salida de Pendientes
- **WHEN** se edita un registro y deja de tener validaciones pendientes
- **THEN** el registro deja de aparecer en Pendientes

#### Scenario: Barra de acciones compartida
- **WHEN** se muestra la sección
- **THEN** el selector de cliente, el botón de procesar, el mes y la descarga de Excel están disponibles arriba de las pestañas

### Requirement: Paginación del historial

El sistema SHALL paginar la tabla de la pestaña Historial del lado del servidor con 100 registros por página.

#### Scenario: Primera página
- **WHEN** el usuario abre el Historial
- **THEN** se muestran los primeros 100 registros y el total de registros disponibles

#### Scenario: Navegación entre páginas
- **WHEN** el usuario avanza o retrocede de página
- **THEN** se solicitan y muestran los 100 registros correspondientes a esa página

### Requirement: Refresco por mes

El sistema SHALL ofrecer un botón de refresco que tome el mes elegido en el selector y cargue los registros de ese mes en la pestaña activa.

#### Scenario: Refresco de un mes
- **WHEN** el usuario elige un mes y pulsa el botón de refresco
- **THEN** la tabla carga los registros de ese mes (paginados) en la pestaña activa

#### Scenario: Sin mes seleccionado
- **WHEN** el usuario deja el selector vacío y pulsa refrescar
- **THEN** la tabla vuelve a mostrar todos los registros

## MODIFIED Requirements

### Requirement: Alertas visuales de fila

El sistema SHALL pintar la fila completa de un registro de combustible según sus validaciones pendientes, aplicando la prioridad **rojo suave > violeta > amarillo**: rojo suave si `tipo_cambio_trans` es nulo; violeta si `us_unitario` es mayor a 5000; amarillo si `tarifa_flete_usd_m3` es nula o mayor a 150 y no está revisada.

#### Scenario: Tarifa de flete alta o nula
- **WHEN** el `tarifa_flete_usd_m3` de un registro es nulo o mayor a 150 y no está revisado
- **THEN** la fila se muestra con fondo amarillo

#### Scenario: Tipo de cambio nulo
- **WHEN** el `tipo_cambio_trans` de un registro es nulo
- **THEN** la fila se muestra con fondo rojo suave

#### Scenario: Ambas condiciones coinciden
- **WHEN** un registro cumple más de una validación pendiente
- **THEN** la fila se muestra con el color de mayor prioridad (rojo suave > violeta > amarillo)

#### Scenario: Tarifa revisada
- **WHEN** el valor de `tarifa_flete_usd_m3` coincide con la marca de revisión del registro
- **THEN** la fila no se muestra con fondo amarillo por esa validación

#### Scenario: Precio unitario alto
- **WHEN** el `us_unitario` de un registro es mayor a 5000
- **THEN** la fila se muestra con fondo violeta, salvo que también tenga `tipo_cambio_trans` nulo (rojo suave)

#### Scenario: Precio unitario sin ignorar
- **WHEN** un registro tiene `us_unitario` mayor a 5000
- **THEN** no se ofrece la acción "Ignorar" para esa validación; se corrige editando el registro
