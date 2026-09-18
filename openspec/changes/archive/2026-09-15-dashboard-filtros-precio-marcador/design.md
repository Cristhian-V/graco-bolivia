## Context

Ver `proposal.md` para la motivación. Hoy cada gráfico del panel tiene su propio estado de filtros (`ChartCard` → `FilterPanel`, `DashboardSection.jsx:432`), los KPIs se calculan solo por producto (`getDashboardKpis`, `presentacionService.js:266`) y `us_precio_marcador` se graba como 1120 fijo (`combustiblesService.js:140`). No existe tabla ni sección de precio marcador, ni filtro por año en `buildWhere` (`presentacionService.js:153`).

## Goals / Non-Goals

**Goals:**
- Filtros globales de año (único) y meses (multiselección) en la cabecera, por defecto año actual + mes anterior, que afecten a todos los gráficos y KPIs.
- Mantener los filtros avanzados por gráfico ocultos tras el botón actual.
- Resolver el solapamiento de etiquetas en Frecuencia y Benchmarking.
- Cargar el precio marcador desde Excel, completar faltantes y aplicarlo a `combustibles` y `detalles`.

**Non-Goals:**
- No se cambia la sección a editable ni se expone la tabla `precio_marcador` para edición manual celda a celda.
- No se modifican los cálculos de precio ponderado ni de la tabla semanal.
- No se automatiza la subida del Excel (es manual por botón).

## Decisions

### 1. Filtros globales vs. avanzados
Se mantiene el estado de filtros por gráfico (avanzados) y se añade un estado global `{ anio, meses }` en `DashboardSection`, pasado a cada `ChartCard`, `WeeklyTable` y a los KPIs. En `buildWhere` (backend) se añade el filtro de año (`EXTRACT(YEAR FROM fecha)::int`) y se conserva `mes`; el rango de fechas del gráfico sigue teniendo prioridad sobre los meses (comportamiento actual). *Alternativa considerada*: reemplazar todo por un filtro global único. Descartada porque el usuario quiere conservar los filtros avanzados por gráfico.

### 2. Frecuencia usa solo el año
El gráfico de Frecuencia no debe quedar con un solo punto cuando el filtro global tiene un mes. El `ChartCard` de Frecuencia recibe `soloAnio` y omite `mes` en la consulta; `renderLine` usa los 12 meses del año. *Alternativa*: multiselección obligatoria de meses. Descartada por simplicidad.

### 3. Default del filtro global
El frontend calcula el mes anterior a partir de `new Date()`; si cae en el año previo, usa ese año y mes 12. La lista de años disponibles viene de `getDashboardFilters` (nuevo campo `anio`).

### 4. KPIs con filtro
`getDashboardKpis` recibe `anio` y `mes` además de `producto` y reutiliza `buildWhere`. Los KPIs dejan de ser globales "sin filtros" y pasan a seguir el período.

### 5. Etiquetas de ejes
- Frecuencia: etiquetas de mes rotadas en vertical (`rotate(-90)`), con más margen inferior.
- Frecuencia y Benchmarking: nombres de cliente alternados en dos alturas (`y` base + desplazamiento según índice par/impar).

### 6. Tabla `precio_marcador` y carga en dos pasos
Nueva tabla `precio_marcador (fecha date PRIMARY KEY, precio numeric, origen text NOT NULL)`. La carga es en dos pasos para poder revisar antes de escribir:
1. **Lectura/vista previa**: el endpoint recibe el archivo (patrón `express.raw` de `/dashboard/seed`, `routes/api.js:658`) y lo lee con **SheetJS (`xlsx`)**, que soporta `.xlsx` y `.xls` (ExcelJS solo lee `.xlsx`); devuelve los pares `fecha`/`precio` **sin tocar la base de datos**. El frontend los muestra en la pestaña de carga.
2. **Procesamiento**: el frontend envía los registros revisados y el backend hace upsert por `fecha` con `origen = 'EXCEL'`.

Re-procesar un archivo actualiza los precios de sus fechas e inserta las nuevas, sin duplicar (idempotente). El estado de la vista previa vive en el frontend hasta confirmar; refrescar la página descarta la vista previa.

### 7. Relleno de faltantes (recalculable)
Con las fechas de `origen = 'EXCEL'` ordenadas, para cada día del rango `[min, max]` sin precio de archivo se toma el promedio de los 3 registros anteriores y los 3 posteriores más cercanos (hasta 6 valores); si hay menos de 3 de un lado, se usan los disponibles. El resultado se guarda con `origen = 'RELLENO'`. Cada ejecución **borra los registros `RELLENO` previos y los recalcula** desde los `EXCEL`, de modo que re-subir el archivo y volver a rellenar refleje los datos nuevos.

### 8. Aplicación a `combustibles` y `detalles`
`UPDATE ... FROM precio_marcador` por `fecha` en ambas tablas. Al usar `FROM`, las filas sin coincidencia quedan intactas. Es idempotente.

### 9. Extracción con marcador por fecha
En `runCombustibles`, tras mapear la declaración, se busca el precio marcador por `rec.fecha`; si no existe se usa 1120. Esto cubre las extracciones nuevas y deja de hardcodear el valor.

### 10. Visibilidad de la sección
Nueva entrada en `SECTIONS` (`App.jsx:634`) con `rol: null`, de modo que la vean `admin` y `presentacion`. Las acciones de subida/relleno/aplicación quedan accesibles desde esa sección.

## Risks / Trade-offs

- **KPIs dejan de ser "globales sin filtros"**: cambia el comportamiento actual y la spec. → Es lo pedido; se documenta en la spec.
- **Re-subida tras rellenar**: un archivo nuevo con una fecha rellenada sobrescribe el valor rellenado de esa fecha. → Aceptable (el dato real manda); las fechas solo-rellenadas se conservan.
- **Marcador desactualizado en extracciones nuevas**: si el Excel no está cargado, las filas nuevas quedan en 1120 hasta aplicar el marcador. → Mitigación: el botón de aplicar es idempotente y se puede re-ejecutar.
- **Rendimiento del relleno**: iterar el rango día a día puede ser costoso en rangos muy largos. → Se opera sobre el rango real del archivo y con inserts por lote.
- **Formato del Excel**: hoja o encabezados distintos rompen la carga. → Se valida y se devuelve error claro.

## Migration Plan

1. `db/init/009_precio_marcador.sql` (tabla, idempotente).
2. Backend: filtros por año, endpoints de precio marcador, marcador por fecha en la extracción.
3. Frontend: cabecera global, etiquetas, sección Precio Marcador.
4. Rollback: revertir código; la tabla nueva es inocua.
