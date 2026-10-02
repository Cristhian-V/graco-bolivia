## MODIFIED Requirements

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, market share por proveedor y volumen por procedencia. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro, una tabla de operaciones por aduana por importador, dos tablas comparativas de tarifa de flete promedio por tramo (en USD/m³ y en Bs/m³) y una tabla de volumen por frontera. El sistema SHALL NOT presentar los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio, ni el gráfico de U$S CIF por país de origen, ni el gráfico de burbujas del cliente YPFB.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs, la tabla semanal, el gráfico de burbujas por empresa, la tabla de operaciones por aduana por importador y las tablas de tarifa de flete por tramo y de volumen por frontera

#### Scenario: KPIs acotados
- **WHEN** el usuario abre la sección Presentación
- **THEN** el panel muestra solo los KPIs de volumen total, número de operaciones e importadores, y no muestra los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio

#### Scenario: Sin gráfico de CIF por país
- **WHEN** el usuario abre la sección Presentación
- **THEN** no se presenta el gráfico de U$S CIF por país de origen

### Requirement: Fletes y tarifas en bolivianos

El sistema SHALL presentar la tarifa de flete por tramo en bolivianos como una tabla comparativa, usando la tarifa de flete en bolivianos (`tarifa_flete_bob_m3` o `flete_total_bs`).

#### Scenario: Flete en bolivianos visible
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** existe una tabla de tarifa de flete por tramo en bolivianos junto a la de USD/m³

### Requirement: Gráfico de Frecuencia de Operaciones en líneas múltiples

El sistema SHALL presentar el gráfico de Frecuencia de Operaciones de Importación como un gráfico de líneas múltiples donde el eje Y es la cantidad de operaciones y cada importador se dibuja como una línea independiente con un color distinto generado de forma procedural. Las líneas SHALL usar una interpolación suavizada (`curveMonotoneX`) que no desciende por debajo de cero. Cuando hay un único mes seleccionado, el eje X SHALL mostrar las semanas de ese mes de lunes a domingo, etiquetadas como en la tabla de precio promedio ponderado por semana; cuando no hay ningún mes seleccionado, el eje X SHALL mostrar los meses transcurridos del año. El sistema SHALL mostrar las etiquetas del eje inferior en una fila horizontal. El sistema SHALL mostrar por defecto los siete importadores con más operaciones del período y SHALL ofrecer un filtro para aumentar o disminuir esa cantidad, sin agrupar al resto en una categoría "Otros". El sistema SHALL identificar cada importador con una leyenda que usa el mismo color que su línea. El sistema SHALL NOT rotular los importadores sobre el eje X ni dibujar separadores punteados entre ellos.

#### Scenario: Una línea por importador
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones
- **THEN** cada importador incluido se representa con su propia línea a lo largo de los meses transcurridos del año seleccionado

#### Scenario: Color distinto y procedural
- **WHEN** se dibujan las líneas de los importadores
- **THEN** cada importador recibe un color diferente generado proceduralmente, y el mismo color se usa en la leyenda

#### Scenario: Siete importadores por defecto
- **WHEN** el usuario abre el gráfico de Frecuencia de Operaciones sin haber cambiado el filtro de cantidad
- **THEN** se muestran los siete importadores con más operaciones del período

#### Scenario: Filtro de cantidad de importadores
- **WHEN** el usuario cambia el filtro de cantidad de importadores
- **THEN** el gráfico muestra esa cantidad de importadores, de mayor a menor número de operaciones, sin agrupar a los restantes en "Otros"

#### Scenario: Leyenda de importadores
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones
- **THEN** una leyenda lista los importadores con el color de su línea

#### Scenario: Meses en horizontal
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones
- **THEN** las etiquetas del eje inferior se muestran en una fila horizontal

#### Scenario: Semanas del mes seleccionado
- **WHEN** hay un único mes seleccionado en el gráfico de Frecuencia de Operaciones
- **THEN** el eje X muestra las semanas de ese mes de lunes a domingo, con el formato de etiqueta de la tabla semanal (`dd Mmm - dd Mmm`)

#### Scenario: Vista anual sin mes seleccionado
- **WHEN** no hay ningún mes seleccionado en el gráfico de Frecuencia de Operaciones
- **THEN** el eje X muestra los meses transcurridos del año

#### Scenario: Semana sin operaciones
- **WHEN** un importador no tiene operaciones en una semana transcurrida
- **THEN** su línea desciende a cero en esa semana

#### Scenario: Mes transcurrido sin operaciones
- **WHEN** un importador no tiene operaciones en un mes transcurrido de la vista anual
- **THEN** su línea desciende a cero en ese mes

#### Scenario: Línea suavizada
- **WHEN** se dibuja la línea de un importador
- **THEN** se traza con una curva suavizada que no desciende por debajo de cero

## REMOVED Requirements

### Requirement: Gráfico de burbujas del cliente YPFB

**Reason**: el gráfico de Precio Promedio YPFB (Bs/litro) es redundante con el gráfico por empresa importadora; la segmentación YPFB/Privado pasa a las tablas de tarifa de flete y de volumen.

**Migration**: la información de YPFB se consulta en las tablas nuevas mediante el segmentado "YPFB".

## ADDED Requirements

### Requirement: Tabla comparativa de tarifa de flete por tramo

El sistema SHALL presentar la tarifa de flete promedio por tramo como una tabla comparativa con las columnas `tramo`, mes anterior, mes actual y variación (en valor y en porcentaje), con una fila final de promedio general ponderado. La tarifa de cada tramo SHALL ser el promedio ponderado por volumen (`Σcosto / Σvolumen`) y SHALL mostrarse por tramo tal cual viene, sin separar origen y destino. La tabla SHALL tener una variante en USD/m³ y otra en Bs/m³, SHALL permitir segmentar por `Todos`, `YPFB` y `Privado`, y SHALL mostrar la variación respecto del mes inmediatamente anterior con flecha y signo.

#### Scenario: Comparación mes actual vs anterior
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** cada fila compara el mes elegido con el mes inmediatamente anterior y muestra la variación en valor y en porcentaje

#### Scenario: Tarifa ponderada por volumen
- **WHEN** se calcula la tarifa de un tramo
- **THEN** se usa el promedio ponderado por volumen (`Σcosto / Σvolumen`) sobre las operaciones con costo mayor que cero

#### Scenario: Variante en USD y en Bs
- **WHEN** se muestran las tablas de tarifa de flete por tramo
- **THEN** hay una tabla en USD/m³ y otra en Bs/m³

#### Scenario: Segmentación por tipo
- **WHEN** el usuario elige `Todos`, `YPFB` o `Privado` en la cabecera
- **THEN** la tabla se recalcula solo con las operaciones de ese tipo

#### Scenario: Promedio general
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** incluye una fila de promedio general ponderado de ambos meses

#### Scenario: Tramo sin variación
- **WHEN** un tramo no tiene operaciones en el mes anterior
- **THEN** su variación se muestra como sin dato

### Requirement: Tabla de volumen por frontera

El sistema SHALL presentar el volumen por importador como una tabla matriz cuyas filas son los importadores, cuyas columnas son las fronteras (aduanas) con volumen en el período, cuyas celdas muestran el volumen en m³ coloreado con un mapa de calor proporcional al máximo, e incluye una columna de total por importador y una fila de totales por frontera. La tabla SHALL mostrar por defecto los siete importadores con mayor volumen y SHALL ofrecer un control para aumentar o disminuir esa cantidad, mostrando siempre los de mayor a menor volumen. La tabla SHALL permitir segmentar por `Todos`, `YPFB` y `Privado`, y SHALL mantener fija la primera columna al desplazarse horizontalmente.

#### Scenario: Matriz importador × frontera
- **WHEN** se muestra la tabla de volumen por frontera
- **THEN** las filas son los importadores, las columnas las fronteras presentes en el período y las celdas el volumen en m³

#### Scenario: Cantidad de importadores
- **WHEN** el usuario cambia el control de cantidad de importadores
- **THEN** la tabla muestra esa cantidad de importadores, de mayor a menor volumen, y recalcula sus columnas y totales sobre los importadores mostrados

#### Scenario: Siete importadores por defecto
- **WHEN** se muestra la tabla de volumen por frontera sin haber cambiado el control de cantidad
- **THEN** se muestran los siete importadores con mayor volumen del período

#### Scenario: Mapa de calor
- **WHEN** se muestran las celdas de la tabla
- **THEN** el color de cada celda es proporcional al volumen respecto al máximo del período

#### Scenario: Totales
- **WHEN** se muestra la tabla
- **THEN** incluye una columna con el total por importador y una fila con el total por frontera

#### Scenario: Segmentación por tipo
- **WHEN** el usuario elige `Todos`, `YPFB` o `Privado` en la cabecera
- **THEN** la tabla se recalcula solo con las operaciones de ese tipo

#### Scenario: Sin volumen
- **WHEN** no hay operaciones para el período y el tipo elegidos
- **THEN** la tabla se muestra vacía con un mensaje
