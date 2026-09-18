## 1. Base de datos

- [x] 1.1 Crear `db/init/009_precio_marcador.sql` con la tabla `precio_marcador (fecha date PRIMARY KEY, precio numeric, origen text NOT NULL, creado_en, actualizado_en)` de forma idempotente. Verificar: al arrancar el backend `\d precio_marcador` muestra la tabla.

## 2. Backend — filtros globales y KPIs

- [x] 2.1 Añadir el filtro `anio` en `buildWhere` (`presentacionService.js`) como `EXTRACT(YEAR FROM fecha)::int`. Verificar: una consulta con `anio` y `mes` devuelve solo ese período.
- [x] 2.2 Añadir `anio` a `getDashboardFilters` (años distintos de `detalles`). Verificar: `/api/dashboard/filters` incluye `anio`.
- [x] 2.3 Hacer que `getDashboardKpis` acepte y aplique `anio` y `mes` además de `producto`. Verificar: los KPIs varían al cambiar el período.

## 3. Backend — precio marcador

- [x] 3.1 Crear `precioMarcadorService.js` con: lectura del Excel (`.xlsx` y `.xls` vía SheetJS; hoja `Precio Marcador`, columnas `fecha`/`precio`), upsert por `fecha`, relleno de faltantes (promedio de 3 anteriores + 3 posteriores) y aplicación a `combustibles` y `detalles`. Verificar: subir, rellenar y aplicar actualiza las tablas esperadas.
- [x] 3.2 Añadir endpoints en `routes/api.js`: leer archivo para vista previa (`express.raw`, sin persistir), procesar los registros confirmados, rellenar faltantes y aplicar. Verificar: la lectura no escribe en la base; el procesamiento sí.
- [x] 3.3 Exponer el listado del precio marcador para la pestaña de historial. Verificar: el endpoint devuelve las filas de `precio_marcador` con su origen.

## 4. Backend — extracción con marcador por fecha

- [x] 4.1 En `combustiblesService.js`, reemplazar `us_precio_marcador: 1120` por una búsqueda por `fecha` en `precio_marcador` con valor por defecto 1120. Verificar: una extracción con fecha con marcador usa ese valor; sin marcador usa 1120.

## 5. Frontend — filtros globales y KPIs

- [x] 5.1 Añadir en la cabecera (`DashboardSection.jsx`) los filtros globales de año (único) y meses (multiselección) con default año actual + mes anterior (mes 12 del año previo si aplica). Verificar: al abrir, se muestran esos valores.
- [x] 5.2 Pasar el filtro global a todos los `ChartCard`, al `WeeklyTable` y a los KPIs. Verificar: cambiar el período recalcula todos los gráficos y KPIs.
- [x] 5.3 Hacer que el gráfico de Frecuencia use solo el año (ignore el mes). Verificar: con un mes seleccionado, el gráfico sigue mostrando los meses del año.

## 6. Frontend — etiquetas de ejes

- [x] 6.1 Mostrar las etiquetas de mes del gráfico de Frecuencia en vertical. Verificar: no se solapan.
- [x] 6.2 Alternar en dos alturas los nombres de cliente en Frecuencia y Benchmarking. Verificar: los nombres no se solapan.

## 7. Frontend — sección Precio Marcador

- [x] 7.1 Añadir la sección Precio Marcador en `App.jsx` con dos pestañas: carga (subir archivo, vista previa, procesar) e historial (fechas subidas), más rellenar faltantes y aplicar, visible para `admin` y `presentacion`. Verificar: ambos roles la ven y las acciones funcionan.
- [x] 7.2 Añadir las llamadas `api.js` para leer/previsualizar, procesar, rellenar, aplicar y listar. Verificar: el build compila y las llamadas apuntan a los endpoints nuevos.

## 8. Verificación integral

- [ ] 8.1 Levantar el stack y verificar el flujo completo: filtros globales por defecto (año actual + mes anterior), KPIs y gráficos filtrados, Frecuencia anual, etiquetas legibles, subida/relleno/aplicación del marcador y su reflejo en los gráficos. Verificar: los valores del benchmark y del KPI de precio marcador cambian tras aplicar.
