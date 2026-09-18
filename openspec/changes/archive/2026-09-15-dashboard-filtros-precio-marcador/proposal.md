## Why

El panel de Presentación muestra etiquetas de ejes solapadas en los gráficos de Frecuencia y Benchmarking, y hoy no tiene filtros globales de tiempo: cada gráfico se filtra por separado y los KPIs quedan fijos. Además, `us_precio_marcador` está hardcodeado en 1120 al extraer cada despacho, cuando en realidad es un precio de referencia que varía por fecha y se publica en un Excel aparte (faltando fines de semana y feriados).

## What Changes

- **Gráfico de Frecuencia**: mostrar las etiquetas de mes en vertical y alternar los nombres de cliente en dos alturas.
- **Gráfico de Benchmarking**: alternar los nombres de cliente en dos alturas para evitar el solapamiento.
- **Filtros globales en la cabecera**: año (único) y meses (multiselección) que afectan a todos los gráficos y a los KPIs, con **año actual y mes anterior por defecto** (si el mes anterior cae en el año previo, se usa ese año y mes). Los filtros avanzados por gráfico (importador, proveedor, procedencia, aduana, rango de fechas) se mantienen ocultos tras el botón de filtros actual. El gráfico de Frecuencia usa **solo el año**, sin restringirse por el mes.
- **Nueva sección Precio Marcador con dos pestañas**: en la primera se sube el Excel (hoja `Precio Marcador`, columnas `fecha` y `precio`), se muestran los registros en una **vista previa** para revisarlos y recién ahí se procesan/sincronizan a la base de datos; en la segunda se muestra el **historial** de las fechas ya cargadas. Incluye rellenar todos los días faltantes dentro del rango del archivo promediando **3 registros anteriores y 3 posteriores** de cada lado, y aplicar el marcador.
- **Aplicar el marcador**: un botón actualiza `us_precio_marcador` en `combustibles` y `detalles` según la fecha, dejando intactas las filas sin coincidencia. La sección es visible para los roles `admin` y `presentacion`.
- **Extracción con marcador por fecha**: al extraer un combustible, `us_precio_marcador` se busca por `fecha` en `precio_marcador`; si no existe, se usa el valor por defecto (1120).

## Capabilities

### New Capabilities

- `precio-marcador`: carga del precio marcador desde Excel, relleno de días faltantes y aplicación a `combustibles`/`detalles`, con su sección en la interfaz.

### Modified Capabilities

- `presentacion-datos`: filtros globales de año y meses en la cabecera (reemplaza la regla de "sin filtros globales"), KPIs que siguen ese filtro, gráfico de Frecuencia anual y etiquetas de ejes legibles.
- `combustibles`: `us_precio_marcador` se obtiene de la tabla `precio_marcador` por fecha en lugar de ser 1120 fijo.

## Impact

- **Frontend**: `frontend/src/DashboardSection.jsx` (gráficos `d3Line`/`d3Benchmark`, cabecera, filtros, KPIs), `frontend/src/App.jsx` (sección Precio Marcador, menú y roles), `frontend/src/api.js`, `frontend/src/index.css`.
- **Backend**: `backend/src/services/presentacionService.js` (filtro por `anio`, opciones de años, KPIs con filtro), `backend/src/routes/api.js` (endpoints de precio marcador), `backend/src/services/combustiblesService.js` (marcador por fecha), nuevo `backend/src/services/precioMarcadorService.js`.
- **Base de datos**: `db/init/009_precio_marcador.sql` (tabla `precio_marcador`, idempotente).
- **Dependencias**: nueva `xlsx` (SheetJS) en el backend para leer archivos Excel `.xlsx` y `.xls`.
