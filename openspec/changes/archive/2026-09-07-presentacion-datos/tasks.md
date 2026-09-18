## 1. Base de datos

- [x] 1.1 Crear `db/init/006_detalles.sql` con la tabla `detalles` (las 24 columnas de negocio de `combustibles`, `UNIQUE (dim_dam)`, índice por `fecha`) y verificar con `docker compose up -d` que el init reporta 6 archivos y la tabla existe con sus columnas
- [x] 1.2 Verificar en la BD que `detalles` tiene las 24 columnas y el `UNIQUE (dim_dam)` (consulta a `information_schema`)

## 2. Backend — replicación a detalles

- [x] 2.1 En `combustiblesService.js`, agregar `INSERT ... ON CONFLICT (dim_dam) DO UPDATE` en `upsertCombustible` y `reprocesarCombustibles`; verificar con `node --check` y que una extracción inserta también en `detalles`
- [x] 2.2 Resolver el `importador` por NIT contra `clientes` antes de insertar (nombre + NIT); verificar que un combustible con NIT conocido guarda el nombre normalizado y uno sin NIT conserva el nombre crudo

## 3. Backend — API de presentación y carga histórica

- [x] 3.1 Agregar `GET /api/dashboard/data` y `GET /api/dashboard/filters` en `api.js` leyendo `detalles`; verificar con `curl` que devuelven KPIs, series para los gráficos y valores de filtros
- [x] 3.2 Agregar servicio `seedDetallesDesdeExcel` que lea la hoja `detalles` con `exceljs` y haga upsert; verificar la carga del histórico (desde enero del año en curso) sin duplicar `dim_dam`

## 4. Frontend — sección Presentación

- [x] 4.1 Agregar `d3` como dependencia, crear `DashboardSection.jsx` y `getDashboard` en `api.js`, y registrar la sección en `SECTIONS`; verificar que `vite build` compila
- [x] 4.2 Portar las funciones D3 del original (línea de frecuencia, benchmarking, barras horizontales, donuts y KPIs) montadas con `useRef`/`useEffect`; verificar que renderizan con datos reales de `/api/dashboard/data`
- [x] 4.3 Implementar los filtros (mes, importador, proveedor, procedencia, aduana) y las pestañas Diésel/Gasolina 90 como estado de React; verificar que al filtrar se recalculan KPIs y gráficos
- [x] 4.4 Re-temar el CSS del dashboard a colores claros; verificar visualmente la coherencia con el resto de la app

## 5. Integración y validación

- [x] 5.1 Verificar end-to-end: histórico cargado + datos en vivo visibles en la sección, y confirmar que la sección es de solo lectura (sin import/export)
- [x] 5.2 Marcar las tareas completadas y validar los deltas con `openspec validate --change presentacion-datos`
