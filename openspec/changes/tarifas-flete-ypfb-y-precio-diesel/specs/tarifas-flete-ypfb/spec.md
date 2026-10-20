## Purpose

Almacena y administra las tarifas flete que YPFB negocia con sus proveedores de transporte, con carga desde Excel y versionado por vigencia, y las expone para consulta y para el cálculo de flete del gráfico de diésel de YPFB.

## ADDED Requirements

### Requirement: Almacenamiento versionado de tarifas flete

El sistema SHALL mantener las tarifas flete de YPFB con las columnas `lote`, `nro_documento`, `pais_origen`, `origen`, `frontera`, `municipio_frontera`, `destino`, `municipio_destino`, `tarifa_bob_m3`, `vigente_desde`, `activo` y `actualizado_en`. La clave natural de una ruta SHALL ser la combinación de `pais_origen`, `origen`, `frontera`, `municipio_frontera`, `destino` y `municipio_destino` dentro de una misma vigencia.

Cada carga SHALL crear una versión identificada por `vigente_desde`. La versión SHALL ser una fotografía completa: las rutas incluidas en el Excel quedan activas con la tarifa cargada y las rutas activas de la versión anterior que no aparecen quedan inactivas conservando su última tarifa. Las versiones anteriores SHALL conservarse.

#### Scenario: Ruta con tarifa
- **WHEN** se consulta una ruta activa de una versión
- **THEN** el sistema devuelve sus diez columnas del Excel y su `tarifa_bob_m3`

#### Scenario: Rutas con la misma origen y destino pero distinta frontera
- **WHEN** existen dos rutas con el mismo país, origen y destino pero distinta frontera
- **THEN** se almacenan y consultan como rutas distintas

#### Scenario: Versión nueva sin perder historial
- **WHEN** se aplica una carga con una nueva `vigente_desde`
- **THEN** las versiones anteriores se conservan y siguen disponibles para consultas históricas

#### Scenario: Ruta ausente en la carga
- **WHEN** una ruta activa de la versión anterior no aparece en el Excel cargado
- **THEN** queda registrada como inactiva en la nueva versión y no se ofrece para el cálculo de flete

### Requirement: Carga de tarifas desde Excel

El sistema SHALL permitir al rol `admin` cargar un archivo `.xlsx` con la hoja `Consolidado`, cuyos encabezados son `ID`, `Lote`, `N° en documento`, `País de origen`, `Origen`, `Frontera`, `Municipio frontera`, `Destino`, `Municipio destino` y `Tarifa fija (Bs/m3)`.

Antes de aplicar, el sistema SHALL mostrar un preview con el resumen de rutas nuevas, actualizadas, sin cambio, a desactivar y con error. Al aplicar, SHALL pedir o recibir la fecha `vigente_desde` (por defecto el día de la carga), actualizar los montos de las rutas existentes, dar de alta las rutas nuevas y desactivar las ausentes.

El sistema SHALL rechazar el archivo si faltan columnas obligatorias o si no puede leerse. Las filas con datos inválidos SHALL reportarse y no aplicarse, sin impedir la carga de las filas válidas.

#### Scenario: Preview de una carga válida
- **WHEN** el administrador sube un Excel válido
- **THEN** el sistema muestra cuántas rutas son nuevas, cuántas se actualizan, cuántas no cambian, cuántas se desactivan y cuántas tienen error

#### Scenario: Aplicar una carga
- **WHEN** el administrador confirma el preview con una fecha de vigencia
- **THEN** el sistema crea la versión, actualiza montos, inserta rutas nuevas y desactiva las ausentes

#### Scenario: Archivo con columnas faltantes
- **WHEN** el archivo no contiene alguna de las columnas obligatorias
- **THEN** el sistema rechaza la carga con un mensaje que indica las columnas faltantes

#### Scenario: Fila inválida
- **WHEN** una fila no tiene ruta completa o su tarifa no es numérica
- **THEN** el sistema la reporta como error y no la aplica

### Requirement: Consulta de tarifas vigentes

El sistema SHALL permitir consultar las tarifas por país, origen, frontera, destino, lote y estado, y SHALL devolver la tarifa vigente para una fecha: la última versión cuya `vigente_desde` sea menor o igual a esa fecha, considerando solo las rutas activas. Si no existe una versión aplicable, la consulta SHALL devolver un conjunto vacío.

El sistema SHALL calcular, sin almacenarlas, las hojas resumen: cantidad de tramos, tarifa mínima, máxima y promedio por país, y cantidad de tramos y tarifas mínima y máxima por país y frontera.

#### Scenario: Consulta a la fecha actual
- **WHEN** se consultan las tarifas vigentes al día de hoy
- **THEN** el sistema devuelve las rutas activas de la última versión con `vigente_desde` menor o igual a hoy

#### Scenario: Consulta histórica
- **WHEN** se consultan las tarifas para una fecha anterior a la última versión
- **THEN** el sistema devuelve las rutas activas de la última versión aplicable a esa fecha

#### Scenario: Sin tarifas cargadas
- **WHEN** no existe ninguna versión de tarifas
- **THEN** la consulta devuelve un conjunto vacío

#### Scenario: Resúmenes calculados
- **WHEN** se consulta el resumen por país o por país y frontera
- **THEN** el sistema calcula los agregados a partir de las rutas activas de la versión consultada

### Requirement: Sección de tarifas flete YPFB

El sistema SHALL presentar una sección **Tarifas Flete YPFB** con una tabla que replica las columnas de la hoja `Consolidado`, filtros por país de origen, origen, frontera, destino, lote y estado, y los resúmenes por país y por país y frontera. El rol `admin` SHALL ver la carga y actualización; el rol `presentacion` SHALL ver la sección en modo solo lectura, sin acciones de carga ni edición.

#### Scenario: Administrador en la sección
- **WHEN** un administrador abre Tarifas Flete YPFB
- **THEN** ve la tabla, los resúmenes y las acciones para cargar un Excel y aplicar una nueva vigencia

#### Scenario: Presentación en la sección
- **WHEN** un usuario con rol `presentacion` abre Tarifas Flete YPFB
- **THEN** ve la tabla y los resúmenes, sin acciones de carga ni edición

#### Scenario: Filtros de la tabla
- **WHEN** el usuario filtra por país, origen, frontera, destino, lote o estado
- **THEN** la tabla y los resúmenes se recalculan con las rutas que cumplen el filtro
