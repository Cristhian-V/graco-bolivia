## MODIFIED Requirements

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, market share por proveedor y volumen por procedencia. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro, una tabla de operaciones por aduana por importador, una tabla de tarifa de flete promedio por tramo, una tabla de volumen por frontera y una comparación de precio unitario por proveedor de diésel de YPFB. El sistema SHALL NOT presentar los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio, ni el gráfico de U$S CIF por país de origen, ni el gráfico de burbujas del cliente YPFB.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs y las secciones del panel

#### Scenario: Orden del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** las secciones se muestran en este orden: comparación de diésel de YPFB, volumen por frontera, market share y volumen por procedencia, tabla de tarifa de flete por tramo, benchmarking, precio promedio ponderado por semana, frecuencia de operaciones, operaciones por aduana por importador y precio promedio por empresa (burbujas)

#### Scenario: KPIs acotados
- **WHEN** el usuario abre la sección Presentación
- **THEN** el panel muestra solo los KPIs de volumen total, número de operaciones e importadores, y no muestra los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio

#### Scenario: Sin gráfico de CIF por país
- **WHEN** el usuario abre la sección Presentación
- **THEN** no se presenta el gráfico de U$S CIF por país de origen

### Requirement: Gráfico de burbujas por empresa importadora

El sistema SHALL presentar, a ancho completo de la pantalla, un gráfico combinado por empresa importadora donde las **barras** representan el volumen (m³) sobre un eje derecho de **escala logarítmica** y una **línea** conecta el **precio promedio** (Bs/litro) sobre el eje izquierdo. El eje izquierdo SHALL comenzar en dos unidades por debajo del menor precio. Cada barra SHALL mostrar su volumen encima y cada punto de la línea su precio en Bs/litro. Las empresas SHALL rotularse horizontalmente bajo cada barra, alternando en dos alturas.

#### Scenario: Ejes y tamaño de burbuja
- **WHEN** se muestra el gráfico
- **THEN** el eje izquierdo es el precio en Bs/litro (con mínimo dos unidades por debajo del menor precio), el eje derecho es el volumen en m³ en escala logarítmica, y las barras son el volumen y la línea el precio por empresa

#### Scenario: Etiqueta de volumen y precio
- **WHEN** se muestra una empresa
- **THEN** su barra muestra el volumen encima y su punto de la línea el precio en Bs/litro

#### Scenario: Líneas horizontales de referencia
- **WHEN** se muestra el gráfico
- **THEN** se dibujan los marcadores de referencia configurados para ese gráfico

#### Scenario: Ancho completo
- **WHEN** se muestran los gráficos combinados
- **THEN** cada uno ocupa el ancho completo y se apilan en filas separadas

### Requirement: Tabla comparativa de tarifa de flete por tramo

El sistema SHALL presentar la tarifa de flete promedio por tramo como una única tabla con una fila por tramo y columnas por mes: Bs/m³, USD/m³ y T/C promedio del mes, para el mes en curso y los dos meses anteriores. La tarifa de cada tramo SHALL ser el promedio ponderado por volumen (`Σcosto / Σvolumen`) y SHALL mostrarse por tramo tal cual viene, sin separar origen y destino. El T/C promedio del mes SHALL ser el tipo de cambio del BCB. La tabla SHALL permitir segmentar por `Todos`, `YPFB` y `Privado`, y SHALL NOT mostrar columnas de variación.

#### Scenario: Comparación mes actual vs anterior
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada fila compara el mes en curso con los dos meses anteriores

#### Scenario: Una fila por tramo y columnas por mes
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada fila es un tramo y las columnas están agrupadas por mes (Bs/m³, USD/m³ y T/C), para el mes en curso y los dos anteriores

#### Scenario: Tarifa ponderada por volumen
- **WHEN** se calcula la tarifa de un tramo
- **THEN** se usa el promedio ponderado por volumen (`Σcosto / Σvolumen`) sobre las operaciones con costo mayor que cero

#### Scenario: Variante en USD y en Bs
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada mes tiene columnas en USD/m³ y en Bs/m³, en la misma tabla

#### Scenario: Tipo de cambio del mes
- **WHEN** se muestra el T/C de un mes
- **THEN** es el tipo de cambio del BCB de ese mes

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
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** no se muestran columnas de variación

## ADDED Requirements

### Requirement: Gráficos de dona de proveedor y procedencia

El sistema SHALL presentar el market share por proveedor y el volumen por procedencia como gráficos de torta que muestran el porcentaje en cada porción y los nombres (proveedor o país) en una lista a la derecha del gráfico, con el color de la porción. El sistema SHALL agrupar las variantes de un mismo proveedor con la misma razón social (por ejemplo, las variantes de TRAFIGURA) en una sola porción. El sistema SHALL ofrecer en ambos un filtro `Todos`, `YPFB` y `Privados` (YPFB por NIT `1020269020`).

#### Scenario: Nombres a la derecha
- **WHEN** se muestra un gráfico de torta
- **THEN** cada porción muestra su porcentaje y los nombres se listan a la derecha del gráfico con el color de su porción

#### Scenario: Normalización de proveedores
- **WHEN** hay varias variantes del nombre de un mismo proveedor (por ejemplo, TRAFIGURA)
- **THEN** se agrupan en una sola porción

#### Scenario: Filtro por tipo
- **WHEN** el usuario elige `Todos`, `YPFB` o `Privados` en la cabecera de un donut
- **THEN** el donut se recalcula solo con las operaciones de ese tipo
