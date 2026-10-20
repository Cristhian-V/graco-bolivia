## Context

Ver `proposal.md` para la motivación. El estado actual y las restricciones que condicionan el enfoque son:

- `ypfb_proformas` guarda `nro_proforma`, `premio`, `flete` y `precio_unitario` por `dim_dam`; `detalles` aporta proveedor, país, incoterm, volumen y fecha. No existe almacenamiento de tarifas flete.
- El gráfico actual (`getDieselYpfb` + `YpfbComparacion`) filtra YPFB y producto DIESEL, agrupa por proveedor y país, y usa el flete de la proforma. Ya calcula promedios ponderados por volumen.
- El Excel `descargas/Tramos_Tarifas_por PAIS.xlsx` tiene una hoja `Consolidado` con 180 rutas y 10 columnas; las otras dos hojas son agregados derivados. La ruta completa es única; `lote + nro_documento` no lo es.
- El backend aplica todos los `.sql` de `db/init` de forma idempotente al arrancar. La última migración es `014_destinos.sql`.
- La API usa `guardApi` con una allowlist de lecturas para el rol `presentacion` (`lecturaPermitida` en `backend/src/middleware/auth.js`); las escrituras pasan por `requireAdmin`.
- Ya existe un patrón de carga de Excel con `express.raw` + SheetJS en Precio Marcador (preview y procesar), reutilizable.
- El tipo de cambio oficial se guarda en `tipo_cambio` (una fila por fecha, fuente `bcb`); hoy hay valor del día.
- Hoy hay 24 registros YPFB diésel; los números de proforma se completan desde el CM-003, pero solo uno tiene premio, flete y precio cargados, por lo que el desglose quedará mayormente sin precio hasta completar esos campos.

## Goals / Non-Goals

**Goals:**

- Almacenar las tarifas flete de YPFB con historial por vigencia y consulta de la tarifa aplicable a una fecha.
- Cargar el Excel con preview/diff, alta de rutas, actualización de montos y desactivación de ausentes.
- Exponer las tarifas y el tipo de cambio del día al gráfico de diésel YPFB y adaptar el gráfico al modelo `diesel_ypfb_precio_flete.html`.
- Mantener el acceso de lectura para `presentacion` y reservar la escritura para `admin`.

**Non-Goals:**

- Importar las hojas `Resumen por país` y `Por país y frontera`: se calculan.
- Editar tarifas manualmente fuera de la carga de Excel.
- Incluir importadores privados, filtro de modalidad o emparejar automáticamente cada `tramo_flete` con una tarifa.
- Sembrar las 180 rutas desde el repositorio: el Excel se sube por la interfaz y `descargas/` no se versiona.
- Modificar `detalles` o `ypfb_proformas`.

## Decisions

### 1. Tabla única con versionado por `vigente_desde`

Se crea `tarifas_flete_ypfb` con las columnas del Excel, `tarifa_bob_m3`, `vigente_desde`, `activo`, `creado_en` y `actualizado_en`. La unicidad es la ruta completa más `vigente_desde`.

Cada carga genera una **fotografía completa** de la versión:

- las rutas del Excel quedan activas con la tarifa nueva;
- las rutas activas de la versión anterior que no aparecen se copian como inactivas con su última tarifa;
- las rutas inactivas de versiones anteriores no se arrastran.

Alternativas consideradas:

- **Sobrescribir una sola fila por ruta**: más simple, pero los meses históricos usarían la tarifa nueva. Descartado.
- **Tabla de versiones + tabla de filas**: separa mejor la metadata de la versión, pero agrega una tabla y un join sin beneficio para 180 filas por versión. Se prefiere una sola tabla.

### 2. Consulta de la tarifa vigente

La sección puede consultar una fecha histórica: se toma la última `vigente_desde <= d` y, dentro de esa versión, solo las rutas `activo = true`. El gráfico, en cambio, usa siempre la **última versión cargada**, porque la tarifa rige desde su carga hasta que YPFB sube una nueva y no depende del mes que se esté mostrando. Si no hay ninguna versión, no se ofrecen tramos y el gráfico usa el flete de la proforma.

El preview muestra la versión anterior contra la que se calcula el diff y la fecha de vigencia propuesta (por defecto hoy, editable).

### 3. Parseo del Excel con SheetJS

Se reutiliza `xlsx` (ya presente) y el patrón de Precio Marcador: se lee la hoja `Consolidado`, se normalizan los encabezados (minúsculas, sin acentos, espacios colapsados) y se mapean las 10 columnas. Las filas sin ruta completa o con tarifa no numérica se reportan como error y se excluyen. El preview devuelve las filas parseadas más el diff; aplicar recibe esas filas y la fecha de vigencia, y escribe en una transacción.

Alternativa considerada: ExcelJS. Se prefiere SheetJS por el manejo directo de encabezados y porque ya se usa para cargas.

### 4. Tramo manual por país, no por registro

El gráfico replica el modelo: el usuario elige **un tramo por país de suministro** entre las rutas activas vigentes. Para DAP/DPU, el flete de todos los registros de ese país se recalcula como `tarifa_bob_m3 / tipo_cambio`; para FCA, o si el país no tiene tramo, se usa el flete de la proforma. La tabla muestra la tarifa y el TC usados.

Se usa un **único tipo de cambio global**, por defecto el oficial del día (`tipo_cambio` más reciente), editable. El modelo lo maneja por país; se simplifica porque todas las tarifas están en Bs y el usuario pidió el TC del día. La selección de tramo y el TC se persisten en `localStorage` como en el modelo.

Alternativa considerada: emparejar cada registro por su `tramo_flete`. Se descarta porque los nombres del Excel (origen → frontera → destino) no coinciden de forma estable con los de `detalles` (origen → departamento) y el modelo no lo hace.

### 5. Ampliación de la respuesta del gráfico

`getDieselYpfb` seguirá devolviendo las filas actuales y agregará:

- `tarifas`: rutas activas de la última versión cargada, con país, origen, frontera, destino y tarifa;
- `tc`: valor y fecha del tipo de cambio oficial más reciente;
- `vigente_desde`: fecha de la versión usada (o `null`).

Se evita un endpoint adicional para que el gráfico tenga todo en una sola petición.

### 6. Registros sin precio

En el gráfico, “sin precio” es `premio + flete <= 0`. El campo `precio_unitario` de la proforma se conserva para la edición, pero no se usa en la columna Precio unitario. Por defecto los registros sin precio se incluyen en el promedio como 0, igual que el modelo, y se muestra un aviso con el efecto en el promedio y la opción de excluirlos.

### 7. Vista premio y flete

Se agrega la vista del modelo con métricas agregadas (premio y flete promedio, costo total en premio y flete) y, por proveedor/punto, una barra de composición premio/flete y sus valores. El Precio unitario mostrado es la suma `premio + flete` (con el flete del tramo o de la proforma); por eso el producto de la barra resulta 0 y la vista se concentra en premio y flete. Si `premio + flete` es 0, se muestra “sin precio” y no se calcula el desglose.

### 8. Sección, API y roles

- Nueva sección `Tarifas Flete YPFB` en `SECTIONS` con roles `admin` y `presentacion`.
- Endpoints: `GET /tarifas-flete-ypfb` (tabla, filtros, resúmenes y versiones), `POST /tarifas-flete-ypfb/preview` y `POST /tarifas-flete-ypfb/aplicar`.
- `lecturaPermitida` incorpora `/tarifas-flete-ypfb` para GET de `presentacion`; los POST quedan bajo `requireAdmin`.
- La interfaz oculta la carga y la edición a `presentacion`.

### 9. Migración

Se agrega `db/init/015_tarifas_flete_ypfb.sql`, idempotente, con la tabla y sus índices (`vigente_desde`, ruta). No se siembran datos.

## Risks / Trade-offs

- **Poca data de premio/flete (1 de 24 registros)** → el gráfico mostrará promedios basados en pocos registros y muchos “sin precio”. Mitigación: aviso explícito, vista de desglose y la carga de premio/flete sigue por la edición existente.
- **Crecimiento por fotografía completa** → 180 filas por versión. Con cargas mensuales es marginal; los índices por `vigente_desde` mantienen las consultas rápidas. Si crece, se puede purgar historial antiguo.
- **Un tramo por país** → en países con varias rutas, el flete calculado no distingue registro por registro. Es el comportamiento del modelo y se acepta; la alternativa sería un emparejamiento automático que hoy no es fiable.
- **Sin tarifas cargadas** → el gráfico cae al flete de la proforma. Mitigación: la interfaz indica que no hay tarifas y la sección permite cargarlas.
- **La última tarifa se aplica a meses históricos** → la tarifa rige desde su carga hasta la siguiente, así que el análisis de meses anteriores usa la vigencia actual. Es la decisión del usuario; la nota indica desde cuándo rige.
- **TC del día para meses históricos** → el TC no corresponde al mes mostrado. Es la decisión del usuario; se muestra el TC usado junto con la vigencia de la tarifa.
- **Allowlist de lectura** → ampliar `lecturaPermitida` es sensible. Se limita a GET y los POST siguen exigiendo `admin`.
- **Encabezados del Excel con variantes** → se normalizan, pero un cambio de estructura puede fallar. Mitigación: validación explícita de columnas y errores por fila.

## Migration Plan

1. Agregar `db/init/015_tarifas_flete_ypfb.sql`; el backend la aplica al arrancar.
2. Desplegar backend y frontend.
3. Cargar el Excel desde la nueva sección, indicando la fecha de vigencia real de la tarifa.
4. Verificar que el gráfico muestre los tramos y recalcule el flete.
5. Rollback: revertir el código y eliminar la tabla; el gráfico vuelve al flete de la proforma.

## Open Questions

- ¿La selección de tramo y TC debe ser por usuario (localStorage) o compartida? Se implementará localStorage, que es local al navegador.
- ¿Se necesita purgar versiones antiguas en el futuro? Se deja para una evolución posterior; no cambia el enfoque ni las tareas.
