## MODIFIED Requirements

### Requirement: Tabla semanal de importación

El sistema SHALL presentar una tabla agrupada por semana con las columnas `semana`, `importadores`, `importacion`, `marcador` y `spread`. El valor del `spread` SHALL colorearse rojo cuando sea positivo y verde cuando sea negativo.

#### Scenario: Agrupación por semana
- **WHEN** se agrupan los registros por semana
- **THEN** las semanas van de lunes a domingo, se etiquetan con el formato `dd Mmm - dd Mmm` y las semanas parciales de los bordes del mes se extienden al mes vecino

#### Scenario: Columnas de la tabla
- **WHEN** se muestra la tabla semanal
- **THEN** `importacion` es el precio promedio ponderado en USD/m³, `marcador` es el promedio de `us_precio_marcador` y `spread` es la diferencia `importacion − marcador`

#### Scenario: Importadores ocultos y expandibles
- **WHEN** se muestra una fila de la tabla
- **THEN** la columna `importadores` está oculta por defecto y, al hacer clic, se expande mostrando los importadores involucrados separados por `|`

#### Scenario: Color del spread
- **WHEN** se muestra el valor del spread de una semana
- **THEN** se colorea rojo si es positivo y verde si es negativo

### Requirement: Gráfico de Frecuencia de Operaciones en líneas múltiples

El sistema SHALL presentar el gráfico de Frecuencia de Operaciones de Importación como un gráfico de líneas múltiples donde el eje Y es la cantidad de operaciones y cada importador se dibuja como una línea independiente con un color distinto generado de forma procedural. Cuando hay un único mes seleccionado, el eje X SHALL mostrar las semanas de ese mes de lunes a domingo, etiquetadas como en la tabla de precio promedio ponderado por semana; cuando no hay ningún mes seleccionado, el eje X SHALL mostrar los meses transcurridos del año. El sistema SHALL mostrar las etiquetas del eje inferior en una fila horizontal. El sistema SHALL mostrar por defecto los siete importadores con más operaciones del período y SHALL ofrecer un filtro para aumentar o disminuir esa cantidad, sin agrupar al resto en una categoría "Otros". El sistema SHALL identificar cada importador con una leyenda que usa el mismo color que su línea. El sistema SHALL permitir fijar el resaltado de una línea mediante una casilla "Fijar selección": con la casilla activa, un clic sobre el nombre de un importador en la leyenda SHALL mantener su línea resaltada hasta que se haga clic en otro nombre (o en el mismo, para despinnar); con la casilla inactiva, el resaltado SHALL ser solo temporal al pasar el cursor. El sistema SHALL NOT rotular los importadores sobre el eje X ni dibujar separadores punteados entre ellos.

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

#### Scenario: Resaltado fijado con la casilla activa
- **WHEN** la casilla "Fijar selección" está activa y el usuario hace clic en el nombre de un importador
- **THEN** la línea de ese importador permanece resaltada hasta que se haga clic en otro nombre, o en el mismo para despinnar

#### Scenario: Resaltado temporal con la casilla inactiva
- **WHEN** la casilla "Fijar selección" está inactiva
- **THEN** el resaltado de una línea solo ocurre mientras el cursor está sobre su nombre o su fila en la tabla
