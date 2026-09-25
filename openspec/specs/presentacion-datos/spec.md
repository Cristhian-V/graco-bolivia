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

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: precio marcador, precio promedio, total CIF, volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, volumen por importador, tarifa de flete promedio por tramo, market share por proveedor, volumen por procedencia y valor CIF por país. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro y un gráfico de burbujas del cliente YPFB.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs y los gráficos calculados sobre `detalles`, incluida la tabla semanal y los gráficos de burbujas

### Requirement: Fletes y tarifas en bolivianos

El sistema SHALL presentar los valores de flete y tarifa en bolivianos usando `flete_total_bs` y `tarifa_flete_bob_m3`.

#### Scenario: Flete en bolivianos visible
- **WHEN** se muestran los indicadores de flete
- **THEN** se incluye la tarifa de flete en bolivianos (`tarifa_flete_bob_m3`) y el flete total en bolivianos (`flete_total_bs`)

### Requirement: Filtros y pestañas

El sistema SHALL presentar en la cabecera de cada gráfico un selector de año y una fila horizontal con los doce meses abreviados a tres letras (multiselección), con el año actual y el mes anterior seleccionados por defecto, y SHALL mantener además los filtros avanzados por gráfico (importador, proveedor, procedencia, aduana y rango de fechas) ocultos tras el botón de filtros de cada gráfico. SHALL permitir alternar entre Diésel y Gasolina 90. El gráfico de Frecuencia de Operaciones SHALL usar solo el año, sin restringirse por los meses.

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
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones
- **THEN** incluye todos los meses del año seleccionado, sin aplicar los meses elegidos

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

El sistema SHALL presentar una tabla agrupada por semana con las columnas `semana`, `importadores`, `importacion`, `marcador` y `spread`.

#### Scenario: Agrupación por semana
- **WHEN** se agrupan los registros por semana
- **THEN** las semanas van de lunes a domingo, se etiquetan con el formato `dd Mmm - dd Mmm` y las semanas parciales de los bordes del mes se extienden al mes vecino

#### Scenario: Columnas de la tabla
- **WHEN** se muestra la tabla semanal
- **THEN** `importacion` es el precio promedio ponderado en USD/m³, `marcador` es el promedio de `us_precio_marcador` y `spread` es la diferencia `importacion − marcador`

#### Scenario: Importadores ocultos y expandibles
- **WHEN** se muestra una fila de la tabla
- **THEN** la columna `importadores` está oculta por defecto y, al hacer clic, se expande mostrando los importadores involucrados separados por `|`

### Requirement: Gráfico de burbujas por empresa importadora

El sistema SHALL presentar, a ancho completo de la pantalla, un gráfico de burbujas donde el eje X es la empresa importadora, el eje Y es el precio promedio de importación en Bs/litro, cada burbuja representa una empresa, el tamaño de la burbuja es fijo y aplanado, y el volumen importado se muestra como número sobre cada burbuja.

#### Scenario: Ejes y tamaño de burbuja
- **WHEN** se muestra el gráfico de burbujas
- **THEN** el eje X es la empresa importadora, el eje Y es el precio ponderado en Bs/litro, cada burbuja tiene tamaño fijo aplanado (50% de alto) y muestra su volumen como número encima

#### Scenario: Líneas horizontales de referencia
- **WHEN** se muestra el gráfico de burbujas
- **THEN** se dibujan los marcadores de referencia configurados para ese gráfico

#### Scenario: Ancho completo
- **WHEN** se muestran los gráficos de burbujas
- **THEN** cada uno ocupa el ancho completo y se apilan en filas separadas

### Requirement: Gráfico de burbujas del cliente YPFB

El sistema SHALL presentar, a ancho completo de la pantalla, un gráfico de burbujas con los mismos ejes, presentación aplanada, volumen visible y marcadores configurables del gráfico por empresa importadora, pero limitado a los registros del cliente YPFB.

#### Scenario: Datos de YPFB
- **WHEN** se muestra el gráfico de YPFB
- **THEN** solo se incluyen los registros cuyo importador corresponde al cliente YPFB

#### Scenario: Sin registros de YPFB
- **WHEN** el cliente YPFB no tiene registros en `detalles`
- **THEN** el gráfico se muestra sin burbujas, conservando los marcadores de referencia

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

### Requirement: Legibilidad de etiquetas en los ejes

El sistema SHALL mostrar en vertical las etiquetas de mes del gráfico de Frecuencia de Operaciones y SHALL alternar en dos alturas las etiquetas de nombres de cliente del gráfico de Frecuencia de Operaciones y del gráfico de Benchmarking, para evitar el solapamiento.

#### Scenario: Meses en vertical
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones
- **THEN** las etiquetas de mes del eje inferior se muestran rotadas en vertical

#### Scenario: Nombres alternados en dos alturas
- **WHEN** se muestra el gráfico de Frecuencia de Operaciones o el de Benchmarking
- **THEN** los nombres de cliente se distribuyen alternadamente en dos alturas

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
