## MODIFIED Requirements

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: precio marcador, precio promedio, total CIF, volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, volumen por importador, tarifa de flete promedio por tramo, market share por proveedor, volumen por procedencia y valor CIF por país. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro y un gráfico de burbujas del cliente YPFB.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs y los gráficos calculados sobre `detalles`, incluida la tabla semanal y los gráficos de burbujas

### Requirement: Filtros y pestañas

El sistema SHALL permitir filtrar cada gráfico de forma independiente por importador, mes, proveedor, procedencia, aduana y rango de fechas, y SHALL permitir alternar entre Diésel y Gasolina 90. El panel SHALL no presentar filtros globales que afecten a todos los gráficos a la vez.

#### Scenario: Filtrado
- **WHEN** el usuario selecciona uno o más filtros en la cabecera de un gráfico
- **THEN** ese gráfico se recalcula con los registros que cumplen el filtro, sin afectar a los demás gráficos ni a los KPIs

#### Scenario: Filtros independientes por gráfico
- **WHEN** el usuario cambia un filtro en la cabecera de un gráfico
- **THEN** solo ese gráfico se recalcula; los demás gráficos no se ven afectados

#### Scenario: Filtros minimizados con valor por defecto
- **WHEN** se muestra un gráfico
- **THEN** su panel de filtros aparece minimizado y sin filtros seleccionados, mostrando todos los datos

#### Scenario: Selección de importadores por checklist
- **WHEN** el usuario despliega el filtro de importadores
- **THEN** puede seleccionar los importadores mediante un checklist por NIT y nombre

#### Scenario: Rango de fechas manual
- **WHEN** el usuario selecciona un rango de fechas en el calendario del gráfico
- **THEN** el gráfico se limita a ese rango y, si había un mes seleccionado, este se desactiva

#### Scenario: KPIs globales
- **WHEN** el usuario cambia los filtros de un gráfico
- **THEN** los KPIs mantienen los promedios y totales globales de todos los clientes, sin aplicar los filtros de los gráficos

#### Scenario: Cambio de producto
- **WHEN** el usuario alterna la pestaña entre Diésel y Gasolina 90
- **THEN** el panel se limita al producto seleccionado

## ADDED Requirements

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

El sistema SHALL presentar un gráfico de burbujas donde el eje X es la empresa importadora, el eje Y es el precio promedio de importación en Bs/litro, el tamaño de la burbuja es el volumen importado y cada burbuja representa una empresa.

#### Scenario: Ejes y tamaño de burbuja
- **WHEN** se muestra el gráfico de burbujas
- **THEN** el eje X es la empresa importadora, el eje Y es el precio ponderado en Bs/litro y el tamaño de cada burbuja es proporcional al volumen importado de esa empresa

#### Scenario: Líneas horizontales de referencia
- **WHEN** se muestra el gráfico de burbujas
- **THEN** se dibujan líneas horizontales de referencia en 18 Bs/litro y en 16.5 Bs/litro

### Requirement: Gráfico de burbujas del cliente YPFB

El sistema SHALL presentar un gráfico de burbujas con los mismos ejes, tamaño y líneas de referencia del gráfico por empresa importadora, pero limitado a los registros del cliente YPFB.

#### Scenario: Datos de YPFB
- **WHEN** se muestra el gráfico de YPFB
- **THEN** solo se incluyen los registros cuyo importador corresponde al cliente YPFB

#### Scenario: Sin registros de YPFB
- **WHEN** el cliente YPFB no tiene registros en `detalles`
- **THEN** el gráfico se muestra sin burbujas, conservando las líneas de referencia
