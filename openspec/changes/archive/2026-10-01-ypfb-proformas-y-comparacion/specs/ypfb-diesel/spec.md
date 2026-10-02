## Purpose

Gestiona y presenta la comparación de precios de importación de diésel de YPFB: la tabla de proformas con datos que ingresa el usuario y la sección de comparación de precio unitario por proveedor.

## ADDED Requirements

### Requirement: Tabla de proformas de YPFB

El sistema SHALL mantener una tabla `ypfb_proformas` con `dim_dam` (único, enlace al combustible), `nro_proforma`, `premio`, `flete` y `precio_unitario`, correspondiente solo a registros de YPFB (NIT `1020269020`).

#### Scenario: Registro de proforma por declaración
- **WHEN** existe una declaración de importación de YPFB
- **THEN** puede tener a lo sumo una fila en `ypfb_proformas`, identificada por su `dim_dam`

#### Scenario: Datos reutilizados
- **WHEN** se necesita proveedor, incoterm, volumen (`cantidad_m3`) o país de procedencia
- **THEN** se toman del combustible (`combustibles`/`detalles`), no se duplican en `ypfb_proformas`

### Requirement: Edición de campos de proforma YPFB

El sistema SHALL mostrar y guardar `nro_proforma`, `premio`, `flete` y `precio_unitario` (en USD/m³) al editar un registro cuyo importador es YPFB, y NO SHALL mostrar ni guardar esos campos para otros clientes. El `nro_proforma` SHALL precargarse desde el número de la factura comercial (documento `CM-003`) de la sección Documentos cuando exista.

#### Scenario: Editar un registro de YPFB
- **WHEN** el usuario pulsa Editar en un registro de YPFB
- **THEN** el formulario muestra, además de los campos actuales, `nro_proforma`, `premio`, `flete` y `precio_unitario`, y al guardar se persisten en `ypfb_proformas`

#### Scenario: Editar un registro de otro cliente
- **WHEN** el usuario pulsa Editar en un registro que no es de YPFB
- **THEN** no se muestran ni se guardan los campos de proforma

#### Scenario: Precarga del número de proforma
- **WHEN** se edita un registro de YPFB que tiene una factura comercial asociada
- **THEN** el campo `nro_proforma` se precarga con el número de esa factura comercial

### Requirement: Comparación de precio unitario por proveedor (Diésel YPFB)

El sistema SHALL presentar, después de la tabla de tarifa de flete por tramo en Bs/m³, una sección de comparación de diésel de YPFB por proveedor cuyas columnas son Proveedor, N.º proforma, Volumen (m³), Premio (USD/m³), Flete (USD/m³) y Precio unitario (USD/m³), agrupadas por proveedor con sub-filas por `pais_procedencia`, con una fila final de promedio YPFB ponderado por volumen. La sección SHALL ofrecer filtros de Incoterm, Suministro (país de procedencia), mes y año, y SHALL ordenar los proveedores del precio unitario más bajo al más alto. Los valores SHALL ser el promedio ponderado por volumen.

#### Scenario: Estructura de la comparación
- **WHEN** se muestra la sección
- **THEN** las filas son los proveedores de YPFB del período, con sub-filas por país de procedencia y las columnas Proveedor, N.º proforma, Volumen, Premio, Flete y Precio unitario

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
