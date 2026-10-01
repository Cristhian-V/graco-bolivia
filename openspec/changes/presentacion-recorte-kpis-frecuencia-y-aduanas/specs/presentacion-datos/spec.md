## MODIFIED Requirements

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, volumen por importador, tarifa de flete promedio por tramo, market share por proveedor y volumen por procedencia. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro, un gráfico de burbujas del cliente YPFB y una tabla de operaciones por aduana por importador. El sistema SHALL NOT presentar los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio, ni el gráfico de U$S CIF por país de origen.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs y los gráficos calculados sobre `detalles`, incluida la tabla semanal, los gráficos de burbujas y la tabla de operaciones por aduana por importador

#### Scenario: KPIs acotados
- **WHEN** el usuario abre la sección Presentación
- **THEN** el panel muestra solo los KPIs de volumen total, número de operaciones e importadores, y no muestra los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio

#### Scenario: Sin gráfico de CIF por país
- **WHEN** el usuario abre la sección Presentación
- **THEN** no se presenta el gráfico de U$S CIF por país de origen

### Requirement: Fletes y tarifas en bolivianos

El sistema SHALL presentar la tarifa de flete en bolivianos usando `tarifa_flete_bob_m3` en el gráfico de tarifa de flete promedio por tramo.

#### Scenario: Flete en bolivianos visible
- **WHEN** se muestra el gráfico de tarifa de flete promedio por tramo
- **THEN** se usa la tarifa de flete en bolivianos (`tarifa_flete_bob_m3`)

### Requirement: Filtros y pestañas

El sistema SHALL presentar en la cabecera de cada gráfico un selector de año y una fila horizontal con los doce meses abreviados a tres letras (multiselección, salvo el gráfico de Frecuencia de Operaciones que es de selección única), con el año actual y el mes anterior seleccionados por defecto, y SHALL mantener además los filtros avanzados por gráfico (importador, proveedor, procedencia, aduana y rango de fechas) ocultos tras el botón de filtros de cada gráfico. SHALL permitir alternar entre Diésel y Gasolina 90. El gráfico de Frecuencia de Operaciones SHALL usar un solo mes a la vez, con el mes anterior seleccionado por defecto: al seleccionar un mes se deselecciona el anterior, y cuando no hay ningún mes seleccionado SHALL mostrar todos los meses transcurridos del año.

#### Scenario: Filtrado
- **WHEN** el usuario cambia el año o los meses en la cabecera de un gráfico
- **THEN** ese gráfico se recalcula con los registros del período seleccionado

#### Scenario: Año y meses por defecto
- **WHEN** el usuario abre la sección Presentación sin haber cambiado los filtros
- **THEN** cada gráfico muestra por defecto el año actual y el mes inmediatamente anterior

#### Scenario: Mes anterior en el año previo
- **WHEN** el mes inmediatamente anterior pertenece al año previo (por ejemplo, en enero)
- **THEN** el valor por defecto usa ese año previo y el mes 12

#### Scenario: Meses en fila horizontal
- **WHEN** se muestra la cabecera de un gráfico
- **THEN** los doce meses aparecen en una fila horizontal con nombres abreviados a tres letras

#### Scenario: Multiselección de meses
- **WHEN** el usuario pulsa uno o más meses en la fila horizontal
- **THEN** el gráfico se limita a los meses seleccionados

#### Scenario: Gráfico de frecuencia anual
- **WHEN** no hay ningún mes seleccionado en el gráfico de Frecuencia de Operaciones
- **THEN** incluye todos los meses transcurridos del año seleccionado

#### Scenario: Filtros independientes por gráfico
- **WHEN** el usuario cambia un filtro avanzado en la cabecera de un gráfico
- **THEN** solo ese gráfico se recalcula; los demás no se ven afectados

#### Scenario: Filtros minimizados con valor por defecto
- **WHEN** se muestra un gráfico
- **THEN** su panel de filtros avanzados aparece minimizado y sin filtros seleccionados

#### Scenario: Selección de importadores por checklist
- **WHEN** el usuario despliega el filtro de importadores
- **THEN** puede seleccionar los importadores mediante un checklist por NIT y nombre

#### Scenario: Rango de fechas manual
- **WHEN** el usuario selecciona un rango de fechas en el calendario del gráfico
- **THEN** el gráfico se limita a ese rango

#### Scenario: KPIs globales
- **WHEN** el usuario abre la sección Presentación
- **THEN** los KPIs se calculan con el período por defecto (año actual y mes anterior)

#### Scenario: Cambio de producto
- **WHEN** el usuario alterna la pestaña entre Diésel y Gasolina 90
- **THEN** el panel se limita al producto seleccionado

#### Scenario: Selección de un solo mes en Frecuencia
- **WHEN** el usuario selecciona un mes en la cabecera del gráfico de Frecuencia de Operaciones
- **THEN** ese mes reemplaza al anteriormente seleccionado, de modo que hay un solo mes a la vez

## REMOVED Requirements

### Requirement: Legibilidad de etiquetas en los ejes

**Reason**: el gráfico de Frecuencia de Operaciones deja de rotular los importadores sobre el eje X y sus etiquetas de mes pasan a mostrarse en una fila horizontal; el requisito queda reemplazado por la nueva presentación del gráfico y de la leyenda.

**Migration**: ver el requisito nuevo "Etiquetas del gráfico de Benchmarking" y el requisito "Gráfico de Frecuencia de Operaciones en líneas múltiples".

## ADDED Requirements

### Requirement: Gráfico de Frecuencia de Operaciones en líneas múltiples

El sistema SHALL presentar el gráfico de Frecuencia de Operaciones de Importación como un gráfico de líneas múltiples donde el eje Y es la cantidad de operaciones y cada importador se dibuja como una línea independiente con un color distinto generado de forma procedural. Cuando hay un único mes seleccionado, el eje X SHALL mostrar las semanas de ese mes de lunes a domingo, etiquetadas como en la tabla de precio promedio ponderado por semana; cuando no hay ningún mes seleccionado, el eje X SHALL mostrar los meses transcurridos del año. El sistema SHALL mostrar las etiquetas del eje inferior en una fila horizontal. El sistema SHALL mostrar por defecto los siete importadores con más operaciones del período y SHALL ofrecer un filtro para aumentar o disminuir esa cantidad, sin agrupar al resto en una categoría "Otros". El sistema SHALL identificar cada importador con una leyenda que usa el mismo color que su línea. El sistema SHALL NOT rotular los importadores sobre el eje X ni dibujar separadores punteados entre ellos.

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

### Requirement: Etiquetas del gráfico de Benchmarking

El sistema SHALL alternar en dos alturas las etiquetas de nombres de cliente del gráfico de Benchmarking, para evitar el solapamiento.

#### Scenario: Nombres alternados en dos alturas
- **WHEN** se muestra el gráfico de Benchmarking
- **THEN** los nombres de cliente se distribuyen alternadamente en dos alturas

### Requirement: Tabla de Operaciones por Aduana por Importador

El sistema SHALL presentar, debajo del gráfico de Frecuencia de Operaciones, una tabla cuyas filas son los mismos importadores mostrados en el gráfico y cuyas columnas son las aduanas presentes en el período seleccionado que tengan al menos una operación entre esos importadores. Cada celda SHALL mostrar la cantidad de operaciones de ese importador en esa aduana, coloreada con un mapa de calor proporcional al máximo del período, y las celdas sin operaciones SHALL mostrarse con el valor cero. La tabla SHALL incluir una columna de total por importador y una fila de totales por aduana, y SHALL mantener fija la primera columna al desplazarse horizontalmente.

#### Scenario: Filas según el gráfico
- **WHEN** se muestra la tabla de operaciones por aduana
- **THEN** sus filas son los mismos importadores que muestra el gráfico de Frecuencia de Operaciones

#### Scenario: Columnas de aduanas presentes
- **WHEN** se construye la tabla para un período
- **THEN** solo aparecen como columnas las aduanas con operaciones en ese período

#### Scenario: Columna sin operaciones oculta
- **WHEN** una aduana no tiene operaciones entre los importadores mostrados en la tabla
- **THEN** esa aduana no aparece como columna, de modo que no se muestran columnas con total cero

#### Scenario: Mapa de calor
- **WHEN** se muestran las celdas de la tabla
- **THEN** el color de cada celda es proporcional a la cantidad de operaciones respecto al máximo del período

#### Scenario: Totales
- **WHEN** se muestra la tabla
- **THEN** incluye una columna con el total de operaciones por importador y una fila con el total por aduana

#### Scenario: Celda sin operaciones
- **WHEN** un importador no tiene operaciones en una aduana del período
- **THEN** la celda muestra el valor cero

### Requirement: Interacción entre el gráfico de Frecuencia y la tabla de aduanas

El sistema SHALL compartir el mismo período y los mismos filtros entre el gráfico de Frecuencia de Operaciones y la tabla de operaciones por aduana, de modo que ambos se recalculen juntos. El sistema SHALL resaltar la línea de un importador al pasar el cursor sobre su fila en la tabla, y SHALL resaltar la línea correspondiente al pasar el cursor sobre su entrada en la leyenda.

#### Scenario: Filtros compartidos
- **WHEN** el usuario cambia el año, el filtro de cantidad de importadores o un filtro avanzado en la cabecera
- **THEN** el gráfico de Frecuencia de Operaciones y la tabla de operaciones por aduana se recalculan juntos con ese filtro

#### Scenario: Resaltado desde la tabla
- **WHEN** el usuario pasa el cursor sobre la fila de un importador en la tabla de aduanas
- **THEN** la línea de ese importador se resalta en el gráfico de Frecuencia de Operaciones

#### Scenario: Resaltado desde la leyenda
- **WHEN** el usuario pasa el cursor sobre la entrada de un importador en la leyenda del gráfico
- **THEN** la línea de ese importador se resalta en el gráfico

#### Scenario: Fin del resaltado
- **WHEN** el cursor deja de estar sobre la fila o la entrada de leyenda
- **THEN** las líneas vuelven a su presentación normal
