## Why

La tabla de tarifa de flete por tramo muestra en cada mes las columnas Bs/m³, USD/m³ y T/C a la vez, lo que la hace ancha y difícil de leer, y perdió la variación respecto del mes anterior. Además no permite ver por departamento de destino ni qué empresas de transporte operan cada tramo. Se necesita acotar la unidad mostrada, recuperar la variación en valor, filtrar por destino y ver el transporte.

## What Changes

- **Filtro de unidad** en la tabla de tarifas: segmentado **Bs · USD · Ambos**, con **default `Bs`**, y el título de la tarjeta cambia según el modo. La columna **T/C solo se muestra en modo `USD`**.
- **Variación recuperada, solo en valor**: una sola columna de variación (mes actual vs mes inmediatamente anterior), en la unidad mostrada, con flecha y signo (▲ sube = rojo, ▼ baja = verde) y `–` sin mes anterior. En modo `Ambos` la variación se agrupa bajo un encabezado con un subvalor por unidad (Bs y USD). **BREAKING** respecto de la spec vigente, que prohíbe columnas de variación.
- **Filtro por origen**: nuevo selector con los orígenes (lugares de embarque, por ejemplo `ILO`, `IQUIQUE`, `DESAGUADERO`). Al elegir uno, la tabla lista los tramos de ese origen. Aplica **solo a la tabla de tarifas**.
- **Nueva tabla de referencia `destinos`** (`destino`, `departamento`) editable desde Referencias, con la carga inicial desde la base (9 destinos actuales, todos mapeados).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `presentacion-datos`: la tabla comparativa de tarifa de flete por tramo suma el filtro de unidad, la variación en valor, el filtro de destino y la columna de transporte.
- `referencias`: se agrega la tabla de referencia `destinos` (`destino`, `departamento`), editable y sembrada.

## Impact

- **Frontend**: `DashboardSection.jsx` (`TarifasTable`: filtro de unidad, variación, filtro de destino, columna y expansión de transporte), `index.css` (estilos del segmentado, variación y expansión), `App.jsx` (alta de `destinos` en la lista de Referencias).
- **Backend**: `services/presentacionService.js` (`getTarifasTramo`: agregación de transportes y filtro por departamento de destino vía `destinos`), `routes/api.js` (registrar `destinos` en `TABLAS_REFERENCIA` y en el export de referencias).
- **Base de datos**: nueva tabla `destinos` (`db/init/014_destinos.sql`) con el seed de los 9 departamentos.
- **API**: se amplía la respuesta de `GET /api/dashboard/data?chart=tarifas` (transportes por tramo) y se agrega `destinos` a `/api/referencias/:tabla`.
