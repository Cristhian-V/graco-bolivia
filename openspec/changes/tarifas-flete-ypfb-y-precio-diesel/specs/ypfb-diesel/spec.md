## MODIFIED Requirements

### Requirement: Comparación de precio unitario por proveedor (Diésel YPFB)

El sistema SHALL presentar, después de la tabla de tarifa de flete por tramo en Bs/m³, una sección de comparación de diésel de YPFB por proveedor cuyas columnas son Proveedor, N.º proforma, Volumen (m³), Premio (USD/m³), Flete (USD/m³) y Precio unitario (USD/m³), agrupadas por proveedor con sub-filas por `pais_procedencia`, con una fila final de promedio YPFB ponderado por volumen. La sección SHALL ofrecer filtros de Incoterm, Suministro (país de procedencia), mes y año, y SHALL ordenar los proveedores del precio unitario más bajo al más alto. Los valores SHALL ser el promedio ponderado por volumen. La sección SHALL limitarse a registros de YPFB (NIT `1020269020`) y producto `DIESEL`. El número de proforma SHALL mostrarse como enlace para descargar la factura `CM-003` cuando exista el documento con archivo; si no existe o no tiene archivo, SHALL mostrarse como texto. Si no hay `nro_proforma` guardado y existe un `CM-003`, SHALL usarse el número del `CM-003`.

Además, el sistema SHALL:

- permitir seleccionar, para cada país de suministro, un tramo de las tarifas flete YPFB activas y vigentes;
- calcular el flete de los registros DAP y DPU como la tarifa del tramo en Bs/m³ dividida por el tipo de cambio, mostrando la tarifa y el tipo de cambio usados;
- usar el flete de la proforma para los registros FCA de países con tarifas y cuando un país con tarifas no tenga un tramo seleccionado; usar 0 cuando el país no tenga tramos en las tarifas YPFB;
- usar por defecto el tipo de cambio oficial del día y permitir editarlo;
- ofrecer una vista **Precio unitario** y una vista **Premio y flete** que muestre, por proveedor y punto de suministro y en agregado, el producto, el premio y el flete, calculando el producto como precio unitario menos premio menos flete;
- identificar los registros sin precio (precio nulo o cero), avisar su efecto en el promedio ponderado y permitir incluirlos o excluirlos del cálculo;
- conservar los filtros avanzados globales (importador, proveedor, procedencia, aduana y rango de fechas) y agregar en el encabezado los controles de tramo, tipo de cambio y vista;
- NO ofrecer filtro de modalidad ni incluir importadores distintos de YPFB.

#### Scenario: Estructura de la comparación
- **WHEN** se muestra la sección
- **THEN** las filas son los proveedores de YPFB del período, con sub-filas por país de procedencia y las columnas Proveedor, N.º proforma, Volumen, Premio, Flete y Precio unitario

#### Scenario: Proforma completada desde la factura comercial
- **WHEN** un registro de YPFB no tiene `nro_proforma` y existe una factura comercial `CM-003` asociada
- **THEN** el sistema completa el número de proforma desde el `CM-003` y el gráfico lo muestra

#### Scenario: Número de proforma enlazado a la factura
- **WHEN** un registro del gráfico tiene número de proforma y un documento `CM-003` con archivo
- **THEN** el número se muestra como enlace para descargar la factura en una pestaña nueva

#### Scenario: Proforma sin archivo
- **WHEN** el número de proforma no tiene un `CM-003` asociado o el documento no tiene archivo
- **THEN** el número se muestra como texto, sin enlace

#### Scenario: Respaldo del número desde CM-003
- **WHEN** `ypfb_proformas.nro_proforma` está vacío y existe un `CM-003` para el registro
- **THEN** el gráfico muestra el número del `CM-003` y lo enlaza a su factura

#### Scenario: Precio unitario como premio más flete
- **WHEN** se muestra la columna Precio unitario
- **THEN** el valor es la suma de premio y flete, usando el flete del tramo o de la proforma según corresponda

#### Scenario: Filtros
- **WHEN** el usuario cambia el Incoterm, el Suministro, el mes o el año
- **THEN** la sección se recalcula con los registros del período, Incoterm y suministro seleccionados

#### Scenario: Orden por precio
- **WHEN** se muestran los proveedores
- **THEN** se ordenan del precio unitario más bajo al más alto

#### Scenario: Promedio YPFB
- **WHEN** se muestra la sección
- **THEN** incluye una fila de promedio YPFB del Incoterm seleccionado, ponderado por volumen

#### Scenario: Sin entregas
- **WHEN** no hay entregas del Incoterm, mes o suministro seleccionados
- **THEN** la sección se muestra vacía con un mensaje

#### Scenario: Flete calculado desde el tramo
- **WHEN** se selecciona un tramo para un país y el Incoterm es DAP o DPU
- **THEN** el flete de esos registros es la tarifa del tramo en Bs/m³ dividida por el tipo de cambio, y la tabla muestra la tarifa y el tipo de cambio usados

#### Scenario: Flete de la proforma en FCA
- **WHEN** el Incoterm es FCA
- **THEN** el flete mostrado es el de la proforma y el tramo y el tipo de cambio no se aplican

#### Scenario: País con tarifas sin tramo seleccionado
- **WHEN** un país tiene tarifas YPFB pero no tiene un tramo seleccionado
- **THEN** se usa el flete de la proforma para sus registros

#### Scenario: País sin tarifas YPFB
- **WHEN** un país de procedencia no tiene tramos en las tarifas YPFB
- **THEN** el flete por defecto es 0 para sus registros

#### Scenario: La última tarifa rige para todos los meses
- **WHEN** se muestra un mes anterior o posterior a la fecha de la última versión cargada
- **THEN** se usan las rutas de la última versión cargada y la nota indica desde cuándo rigen

#### Scenario: Tipo de cambio por defecto
- **WHEN** se abre la sección
- **THEN** el tipo de cambio es el oficial del día y el usuario puede modificarlo

#### Scenario: Vista premio y flete
- **WHEN** el usuario cambia a la vista Premio y flete
- **THEN** se muestra el desglose producto, premio y flete por proveedor y punto de suministro, y el total, con producto = precio unitario menos premio menos flete

#### Scenario: Registros sin precio
- **WHEN** existen registros con precio nulo o cero
- **THEN** la sección los señala, informa su efecto en el promedio ponderado y permite incluirlos o excluirlos

#### Scenario: Solo YPFB
- **WHEN** se muestra la sección
- **THEN** solo incluye registros del importador YPFB y no ofrece filtro de importador ni de modalidad
