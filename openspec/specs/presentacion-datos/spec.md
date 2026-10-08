# presentacion-datos Specification

## Purpose

Presenta los datos de importación de combustibles en un panel de visualización de solo lectura, alimentado por una tabla de presentación propia (`detalles`) que combina el histórico cargado desde Excel con los datos que replica el scraper en vivo.

## Requirements

### Requirement: Tabla de presentación detalles

El sistema SHALL mantener una tabla `detalles` con las mismas columnas de negocio que `combustibles` y una clave única sobre `dim_dam`.

#### Scenario: Estructura de la tabla
- **WHEN** se crea la tabla `detalles`
- **THEN** contiene las columnas `crt`, `uso`, `fecha`, `aduana`, `dim_dam`, `incoterm`, `producto`, `proveedor`, `importador`, `transporte`, `cantidad_m3`, `tipo_cambio_dim`, `tramo_flete`, `us_unitario`, `importador_nit`, `pais_procedencia`, `modalidad_despacho`, `us_precio_marcador`, `fecha_factura_trans`, `flete_total_usd`, `flete_total_bs`, `tipo_cambio_trans`, `tarifa_flete_usd_m3` y `tarifa_flete_bob_m3`

#### Scenario: Deduplicación
- **WHEN** se inserta un registro cuyo `dim_dam` ya existe en `detalles`
- **THEN** el registro se actualiza en lugar de duplicarse

### Requirement: Carga de datos históricos

El sistema SHALL cargar en `detalles` los datos históricos desde el Excel de referencia (hoja `detalles`), desde enero del año en curso.

#### Scenario: Carga del histórico
- **WHEN** se ejecuta la carga inicial del histórico
- **THEN** los registros con `fecha` desde enero del año en curso se insertan en `detalles` sin duplicar `dim_dam`

### Requirement: Importador normalizado por NIT

El sistema SHALL almacenar el importador en `detalles` usando el nombre canónico de la tabla `clientes` cuando coincide por NIT, y SHALL mostrar el nombre junto con el NIT.

#### Scenario: Importador con NIT conocido
- **WHEN** el `importador_nit` coincide con un cliente
- **THEN** se guarda el nombre normalizado del cliente junto con su NIT

#### Scenario: Importador sin NIT conocido
- **WHEN** el `importador_nit` no existe en `clientes`
- **THEN** se conserva el nombre del importador tal como viene del combustible

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

### Requirement: Fletes y tarifas en bolivianos

El sistema SHALL presentar la tarifa de flete por tramo en bolivianos como una tabla comparativa, usando la tarifa de flete en bolivianos (`tarifa_flete_bob_m3` o `flete_total_bs`).

#### Scenario: Flete en bolivianos visible
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** existe una tabla de tarifa de flete por tramo en bolivianos junto a la de USD/m³

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

### Requirement: Solo lectura

El sistema SHALL presentar el panel como de solo lectura, sin importar ni exportar los datos de `detalles` desde esta sección.

#### Scenario: Sin edición desde el panel
- **WHEN** el usuario usa la sección Presentación
- **THEN** no se ofrecen acciones de importar ni exportar; los datos solo se consultan

### Requirement: Precio de importación ponderado con flete

El sistema SHALL calcular el precio promedio ponderado de importación incluyendo el flete, tanto en USD/m³ como en Bs/litro usando el tipo de cambio de la DIM (`tipo_cambio_dim`).

#### Scenario: Precio ponderado en USD/m³
- **WHEN** se calcula el precio promedio ponderado de una agrupación (semana o empresa)
- **THEN** se usa la fórmula `Σ((us_unitario + tarifa_flete_usd_m3) × cantidad_m3) / Σ(cantidad_m3)`

#### Scenario: Conversión a Bs/litro con tipo de cambio de la DIM
- **WHEN** se convierte el precio de importación a Bs/litro
- **THEN** se divide por 1000 y se multiplica por el `tipo_cambio_dim` de cada fila, sin usar el tipo de cambio del BCB

#### Scenario: Flete incluido en el precio
- **WHEN** una operación tiene `tarifa_flete_usd_m3` disponible
- **THEN** el flete se suma al `us_unitario` dentro del precio ponderado

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

### Requirement: Marcadores de referencia configurables

El sistema SHALL permitir configurar, de forma independiente para cada gráfico de burbujas, una cantidad arbitraria de marcadores de referencia con el valor que el usuario indique, y SHALL persistirlos en la base de datos al pulsar Aplicar.

#### Scenario: Agregar y quitar marcadores
- **WHEN** el usuario agrega o quita marcadores y les asigna un valor
- **THEN** puede definir cuántos marcadores quiere y el valor de cada uno

#### Scenario: Persistencia
- **WHEN** el usuario pulsa Aplicar
- **THEN** los marcadores vigentes se guardan en la base de datos y los que se quitaron se eliminan, de modo que se conservan al recargar

#### Scenario: Marcadores por gráfico
- **WHEN** el usuario cambia los marcadores de un gráfico
- **THEN** los del otro gráfico de burbujas no se ven afectados

### Requirement: Meses transcurridos en el gráfico de Frecuencia

El sistema SHALL mostrar en el gráfico de Frecuencia de Operaciones solo los meses ya transcurridos del año seleccionado, incluyendo con valor 0 los meses pasados sin operaciones, y SHALL omitir los meses que aún no han transcurrido.

#### Scenario: Mes futuro
- **WHEN** el año seleccionado es el año en curso y un mes es posterior al mes actual
- **THEN** ese mes no aparece en el gráfico

#### Scenario: Mes transcurrido sin operaciones
- **WHEN** un mes ya transcurrió y no tiene operaciones
- **THEN** se muestra en el gráfico con valor 0

### Requirement: Nombres de importadores en la tabla semanal

El sistema SHALL mostrar los nombres de importadores de una fila expandida de la tabla semanal ajustados al ancho disponible, pasando a las líneas siguientes los que no entren.

#### Scenario: Expansión de importadores
- **WHEN** el usuario expande una fila de la tabla semanal con muchos importadores
- **THEN** los nombres se muestran dentro del ancho de la ventana y el resto pasa a líneas siguientes, sin ensanchar la página

### Requirement: Gráfico de Frecuencia de Operaciones en líneas múltiples

El sistema SHALL presentar el gráfico de Frecuencia de Operaciones de Importación como un gráfico de líneas múltiples donde el eje Y es la cantidad de operaciones y cada importador se dibuja como una línea independiente con un color distinto generado de forma procedural. Las líneas SHALL usar una interpolación suavizada (`curveMonotoneX`) que no desciende por debajo de cero. Cuando hay un único mes seleccionado, el eje X SHALL mostrar las semanas de ese mes de lunes a domingo, etiquetadas como en la tabla de precio promedio ponderado por semana; cuando no hay ningún mes seleccionado, el eje X SHALL mostrar los meses transcurridos del año. El sistema SHALL mostrar las etiquetas del eje inferior en una fila horizontal. El sistema SHALL mostrar por defecto los siete importadores con más operaciones del período y SHALL ofrecer un filtro para aumentar o disminuir esa cantidad, sin agrupar al resto en una categoría "Otros". El sistema SHALL identificar cada importador con una leyenda que usa el mismo color que su línea. El sistema SHALL permitir fijar el resaltado de una línea mediante una casilla "Fijar selección": con la casilla activa, un clic sobre el nombre de un importador en la leyenda SHALL mantener su línea resaltada hasta que se haga clic en otro nombre (o en el mismo, para despinnar); con la casilla inactiva, el resaltado SHALL ser solo temporal al pasar el cursor. El sistema SHALL NOT rotular los importadores sobre el eje X ni dibujar separadores punteados entre ellos.

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

### Requirement: Tabla comparativa de tarifa de flete por tramo

El sistema SHALL presentar la tarifa de flete promedio por tramo como una única tabla con una fila por tramo y columnas por mes para el mes en curso y los dos meses anteriores. La tarifa de cada tramo SHALL ser el promedio ponderado por volumen (`Σcosto / Σvolumen`) y SHALL mostrarse por tramo tal cual viene, sin separar origen y destino. El sistema SHALL ofrecer un filtro de unidad con las opciones `Bs`, `USD` y `Ambos`, con `Bs` seleccionado por defecto, y el título de la tarjeta SHALL reflejar la unidad elegida. En modo `Bs` SHALL mostrar solo las columnas Bs/m³; en modo `USD` SHALL mostrar USD/m³ y el T/C promedio del mes (tipo de cambio del BCB); en modo `Ambos` SHALL mostrar Bs/m³ y USD/m³. La tabla SHALL permitir segmentar por `Todos`, `YPFB` y `Privado`, SHALL incluir una columna de variación del mes en curso respecto del mes inmediatamente anterior expresada solo en valor (sin porcentaje) en la unidad mostrada, y SHALL ofrecer un filtro de país de origen que limita los tramos a los del país seleccionado (`pais_procedencia`). La tabla SHALL NOT incluir una columna de transporte.

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

#### Scenario: Filtro de país de origen
- **WHEN** el usuario elige un país en el filtro de país de origen
- **THEN** la tabla muestra solo los tramos cuyo `pais_procedencia` coincide con el seleccionado

#### Scenario: País de origen por defecto
- **WHEN** se abre la tabla de tarifa de flete por tramo sin haber cambiado el filtro de país de origen
- **THEN** se muestran los tramos de todos los países

#### Scenario: Sin columna de transporte
- **WHEN** se muestra la tabla de tarifa de flete por tramo
- **THEN** no se muestra una columna de transporte

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
