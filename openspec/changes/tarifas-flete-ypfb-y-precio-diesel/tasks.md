## 1. Base de datos

- [x] 1.1 Crear `db/init/015_tarifas_flete_ypfb.sql` con la tabla `tarifas_flete_ypfb`, la unicidad de ruta + `vigente_desde` y los índices por vigencia y ruta; verificar que el backend la aplica al arrancar y que `\d tarifas_flete_ypfb` muestra las columnas esperadas
- [x] 1.2 Reiniciar el backend dos veces y verificar que la migración es idempotente (sin errores y sin duplicar la tabla)

## 2. Servicio de tarifas flete

- [x] 2.1 Implementar el parseo de la hoja `Consolidado` con SheetJS, normalizando encabezados y validando las 10 columnas; verificar con un script sobre `descargas/Tramos_Tarifas_por PAIS.xlsx` que lee 180 rutas y 0 errores
- [x] 2.2 Implementar el diff contra la última versión (nuevas, actualizadas, sin cambio, a desactivar y con error); verificar con el Excel de ejemplo que la primera carga reporta 180 nuevas y una segunda carga idéntica reporta 180 sin cambio
- [x] 2.3 Implementar la aplicación transaccional de una versión (fotografía completa, altas, actualizaciones y desactivación de ausentes); verificar que tras aplicar dos versiones se conservan ambas y la ausente queda `activo = false`
- [x] 2.4 Implementar la consulta de tarifas por filtros y la tarifa vigente para una fecha (última versión `<= fecha`, solo activas), más los resúmenes por país y por país y frontera; verificar con consultas SQL que una fecha anterior a la primera versión devuelve vacío y una posterior devuelve la versión correcta

## 3. API y acceso

- [x] 3.1 Agregar los endpoints `GET /tarifas-flete-ypfb`, `POST /tarifas-flete-ypfb/preview` y `POST /tarifas-flete-ypfb/aplicar`, con lectura del cuerpo `.xlsx` hasta 50 MB; verificar con `curl` el preview y la aplicación sobre el Excel de ejemplo
- [x] 3.2 Incorporar `/tarifas-flete-ypfb` a `lecturaPermitida` y exigir `requireAdmin` en los POST; verificar que `presentacion` recibe 403 al aplicar y 200 al consultar
- [x] 3.3 Ampliar `getDieselYpfb` para devolver `tarifas` de la última versión cargada, `tc` oficial del día y `vigente_desde`; verificar con `curl /dashboard/data?chart=diesel-ypfb` que la respuesta incluye las tres claves

## 4. Sección Tarifas Flete YPFB

- [x] 4.1 Agregar las funciones de API en `frontend/src/api.js`; verificar que `npm run build` compila sin errores
- [x] 4.2 Implementar la sección con tabla de 10 columnas, filtros por país/origen/frontera/destino/lote/estado y resúmenes por país y por país y frontera; verificar visualmente que los totales coinciden con las hojas del Excel
- [x] 4.3 Implementar la carga para `admin` con preview/diff y fecha de vigencia editable, y el modo solo lectura para `presentacion`; verificar con ambos roles que la tabla se ve y que los botones de carga no aparecen para `presentacion`

## 5. Adecuación del gráfico Diésel YPFB

- [x] 5.1 Agregar al encabezado los controles de Incoterm, Suministro, Flete por país con selector de tramo, tipo de cambio y vista, persistiendo tramo y TC en `localStorage`; verificar que al recargar se conservan
- [x] 5.2 Implementar el cálculo de flete DAP/DPU con `tarifa_bob_m3 / tc`, el uso del flete de proforma en FCA y sin tramo, y los promedios ponderados; verificar que cambiar el tramo modifica el flete y el desglose de la tabla
- [x] 5.3 Implementar la vista **Premio y flete** con métricas agregadas y barras producto/premio/flete por proveedor y punto; verificar que producto = precio − premio − flete y que un precio nulo muestra “sin precio”
- [x] 5.4 Implementar el aviso de registros sin precio y la opción incluir/excluir, con el efecto en el promedio; verificar que al excluir cambia el promedio y el aviso lo describe
- [x] 5.5 Mantener el panel global de filtros avanzados y omitir los filtros de importador y modalidad; verificar que el gráfico solo muestra registros de YPFB y que los filtros globales siguen afectando la sección

## 6. Verificación e integración

- [x] 6.1 Ejecutar `openspec validate tarifas-flete-ypfb-y-precio-diesel` y `npm run build` en `frontend`; verificar que ambos terminan sin errores
- [x] 6.2 Probar el flujo completo con `descargas/Tramos_Tarifas_por PAIS.xlsx`: cargar, revisar el diff, aplicar una vigencia y comprobar que el gráfico ofrece los tramos y recalcula el flete
- [x] 6.3 Verificar que los demás gráficos del panel, Manifiestos, Combustibles y las secciones existentes no cambian su comportamiento, y que `presentacion` sigue en solo lectura

## 7. Correcciones de visualización

- [x] 7.1 Agrupar el selector por `Origen → Frontera` (subtítulo) y mostrar `Destino · Tarifa` en cada opción; usar País de procedencia como único filtro, omitir países sin registros y deshabilitar el tramo en países sin rutas; verificar Argentina (55 rutas, 12 grupos), Brasil omitido y Estados Unidos deshabilitado
- [x] 7.2 Completar `nro_proforma` desde el CM-003 para los registros de YPFB sin proforma, con botón en Combustibles y ejecución en la corrida; verificar que el gráfico muestre los números
- [x] 7.3 Calcular el Precio unitario como premio + flete en la tabla y en la vista Premio y flete; verificar con el registro 300444 (189 + 140 = 329.00)
- [x] 7.4 Usar flete 0 por defecto para países de procedencia sin tarifas YPFB (por ejemplo Estados Unidos), manteniendo el flete de la proforma para países con tarifas sin tramo seleccionado

## 8. Enlaces de proforma

- [x] 8.1 Agregar `combustible_id`, `doc_id`, `doc_nombre`, `doc_disponible` y el respaldo del número desde `CM-003` en `getDieselYpfb`; verificar la respuesta de `/dashboard/data?chart=diesel-ypfb`
- [x] 8.2 Validar en `/combustibles/:id/documentos/:docId/archivo` que el documento pertenezca al combustible; verificar 404 con un id incorrecto y 302/200 con el correcto
- [x] 8.3 Renderizar los números de proforma como enlaces en una pestaña nueva y como texto si no hay archivo; verificar en la UI
- [x] 8.4 Ejecutar `openspec validate` y `npm run build`; verificar que ambos terminan sin errores
