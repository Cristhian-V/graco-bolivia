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

## REMOVED Requirements

### Requirement: Legibilidad de etiquetas en los ejes

**Reason**: el gráfico de Frecuencia de Operaciones deja de rotular los importadores sobre el eje X y sus etiquetas de mes pasan a mostrarse en una fila horizontal; el requisito queda reemplazado por la nueva presentación del gráfico y de la leyenda.

**Migration**: ver el requisito nuevo "Etiquetas del gráfico de Benchmarking" y el requisito "Gráfico de Frecuencia de Operaciones en líneas múltiples".

## ADDED Requirements

### Requirement: Gráfico de Frecuencia de Operaciones en líneas múltiples

El sistema SHALL presentar el gráfico de Frecuencia de Operaciones de Importación como un gráfico de líneas múltiples donde el eje X son los meses transcurridos del año seleccionado, el eje Y es la cantidad de operaciones del mes, y cada importador se dibuja como una línea independiente con un color distinto generado de forma procedural. El sistema SHALL mostrar las etiquetas de mes del eje inferior en una fila horizontal. El sistema SHALL mostrar por defecto los siete importadores con más operaciones del período y SHALL ofrecer un filtro para aumentar o disminuir esa cantidad, sin agrupar al resto en una categoría "Otros". El sistema SHALL identificar cada importador con una leyenda que usa el mismo color que su línea. El sistema SHALL NOT rotular los importadores sobre el eje X ni dibujar separadores punteados entre ellos.

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
- **THEN** las etiquetas de mes del eje inferior se muestran en una fila horizontal

#### Scenario: Mes transcurrido sin operaciones
- **WHEN** un importador no tiene operaciones en un mes transcurrido
- **THEN** su línea desciende a cero en ese mes

### Requirement: Etiquetas del gráfico de Benchmarking

El sistema SHALL alternar en dos alturas las etiquetas de nombres de cliente del gráfico de Benchmarking, para evitar el solapamiento.

#### Scenario: Nombres alternados en dos alturas
- **WHEN** se muestra el gráfico de Benchmarking
- **THEN** los nombres de cliente se distribuyen alternadamente en dos alturas

### Requirement: Tabla de Operaciones por Aduana por Importador

El sistema SHALL presentar, debajo del gráfico de Frecuencia de Operaciones, una tabla cuyas filas son los mismos importadores mostrados en el gráfico y cuyas columnas son las aduanas presentes en el período seleccionado. Cada celda SHALL mostrar la cantidad de operaciones de ese importador en esa aduana, coloreada con un mapa de calor proporcional al máximo del período, y las celdas sin operaciones SHALL mostrarse con el valor cero. La tabla SHALL incluir una columna de total por importador y una fila de totales por aduana, y SHALL mantener fija la primera columna al desplazarse horizontalmente.

#### Scenario: Filas según el gráfico
- **WHEN** se muestra la tabla de operaciones por aduana
- **THEN** sus filas son los mismos importadores que muestra el gráfico de Frecuencia de Operaciones

#### Scenario: Columnas de aduanas presentes
- **WHEN** se construye la tabla para un período
- **THEN** solo aparecen como columnas las aduanas con operaciones en ese período

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
