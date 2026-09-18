## ADDED Requirements

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

## MODIFIED Requirements

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
