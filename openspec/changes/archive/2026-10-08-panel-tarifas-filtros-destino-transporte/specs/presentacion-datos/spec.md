## MODIFIED Requirements

### Requirement: Tabla comparativa de tarifa de flete por tramo

El sistema SHALL presentar la tarifa de flete promedio por tramo como una única tabla con una fila por tramo y columnas por mes para el mes en curso y los dos meses anteriores. La tarifa de cada tramo SHALL ser el promedio ponderado por volumen (`Σcosto / Σvolumen`) y SHALL mostrarse por tramo tal cual viene, sin separar origen y destino. El sistema SHALL ofrecer un filtro de unidad con las opciones `Bs`, `USD` y `Ambos`, con `Bs` seleccionado por defecto, y el título de la tarjeta SHALL reflejar la unidad elegida. En modo `Bs` SHALL mostrar solo las columnas Bs/m³; en modo `USD` SHALL mostrar USD/m³ y el T/C promedio del mes (tipo de cambio del BCB); en modo `Ambos` SHALL mostrar Bs/m³ y USD/m³. La tabla SHALL permitir segmentar por `Todos`, `YPFB` y `Privado`, SHALL incluir una columna de variación del mes en curso respecto del mes inmediatamente anterior expresada solo en valor (sin porcentaje) en la unidad mostrada, y SHALL ofrecer un filtro de origen que limita los tramos a los del origen seleccionado (el lugar de embarque, por ejemplo `ILO`, `IQUIQUE` o `DESAGUADERO`). La tabla SHALL NOT incluir una columna de transporte.

#### Scenario: Comparación mes actual vs anterior
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada fila compara el mes en curso con los dos meses anteriores

#### Scenario: Una fila por tramo y columnas por mes
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada fila es un tramo y las columnas son las de la unidad elegida agrupadas por mes, para el mes en curso y los dos anteriores

#### Scenario: Tarifa ponderada por volumen
- **WHEN** se calcula la tarifa de un tramo
- **THEN** se usa el promedio ponderado por volumen (`Σcosto / Σvolumen`) sobre las operaciones con costo mayor que cero

#### Scenario: Variante en USD y en Bs
- **WHEN** el usuario elige la unidad en el filtro de la tabla
- **THEN** se muestran las columnas de esa unidad (Bs/m³, USD/m³ o ambas)

#### Scenario: Tipo de cambio del mes
- **WHEN** la tabla está en modo `USD`
- **THEN** se muestra el T/C promedio del mes, que es el tipo de cambio del BCB de ese mes

#### Scenario: Segmentación por tipo
- **WHEN** el usuario elige `Todos`, `YPFB` o `Privado` en la cabecera
- **THEN** la tabla se recalcula solo con las operaciones de ese tipo

#### Scenario: Promedio general
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** incluye una fila de promedio general ponderado por mes

#### Scenario: Tramo sin variación
- **WHEN** un tramo no tiene operaciones en alguno de los meses
- **THEN** sus celdas de ese mes se muestran sin dato

#### Scenario: Sin variaciones
- **WHEN** un tramo no tiene tarifa en el mes inmediatamente anterior
- **THEN** su columna de variación se muestra como sin dato

#### Scenario: Tramo sin datos en el período
- **WHEN** un tramo no tiene flete en ninguno de los tres meses mostrados
- **THEN** no aparece en la tabla

#### Scenario: Filtro de unidad
- **WHEN** el usuario elige `Bs`, `USD` o `Ambos` en el filtro de unidad
- **THEN** la tabla muestra solo las columnas de la unidad elegida y el título refleja la selección

#### Scenario: Unidad por defecto
- **WHEN** se abre la tabla de tarifa de flete por tramo sin haber cambiado el filtro de unidad
- **THEN** la tabla muestra la unidad `Bs` por defecto

#### Scenario: T/C solo en modo USD
- **WHEN** la tabla no está en modo `USD`
- **THEN** no se muestra la columna de T/C

#### Scenario: Variación solo en valor
- **WHEN** se muestra la columna de variación
- **THEN** muestra solo el valor (sin porcentaje), con flecha y signo, en rojo si sube y en verde si baja, usando la unidad mostrada

#### Scenario: Variación en modo Ambos
- **WHEN** la tabla está en modo `Ambos`
- **THEN** la variación se muestra como un subvalor por unidad bajo un encabezado de variación (Bs y USD), sin porcentaje

#### Scenario: Filtro de origen
- **WHEN** el usuario elige un origen en el filtro de origen
- **THEN** la tabla muestra solo los tramos cuyo origen (lugar de embarque) coincide con el seleccionado

#### Scenario: Origen por defecto
- **WHEN** se abre la tabla de tarifa de flete por tramo sin haber cambiado el filtro de origen
- **THEN** se muestran los tramos de todos los orígenes

#### Scenario: Sin columna de transporte
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** no se muestra una columna de transporte
