## Why

El panel de Presentación muestra la tarifa de flete por tramo y el volumen por importador como gráficos de barras, que dan poco detalle para la operación (no comparan mes a mes, no segmentan YPFB/Privado ni desglosan por frontera). Además el gráfico de "Precio Promedio YPFB (Bs/litro)" es redundante con el de Empresa. Se reemplazan esos gráficos por tablas siguiendo las plantillas `tabla-tarifas.html` y `tabla-volumen.html`, y se suavizan las líneas del gráfico de Frecuencia.

## What Changes

- Se elimina el gráfico **"Precio Promedio YPFB (Bs/litro)"**.
- Se reemplazan **"Tarifa Flete Prom. por Tramo ($/M³)"** y **"(Bs/M³)"** por **dos tablas comparativas** por tramo (mes actual vs. mes anterior, tarifa ponderada, variación), con segmentación **Todos/YPFB/Privado**.
- Se reemplaza **"Volumen Total por Importador (M³)"** por una **tabla matriz importador × frontera** con mapa de calor, total por importador y totales por frontera.
- Las líneas del gráfico **"Frecuencia de Operaciones"** pasan a una interpolación suavizada (`curveMonotoneX`).
- Las tablas nuevas usan la cabecera de tarjeta existente (año + un mes único) y agregan el segmentado YPFB/Privado en su cabecera.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `presentacion-datos`: se quita el gráfico de burbujas YPFB, se reemplazan los gráficos de tarifa de flete por tramo y de volumen por importador por tablas, y se suaviza la línea del gráfico de Frecuencia.

## Impact

- **Frontend**: `DashboardSection.jsx` (layout, dos componentes de tabla nuevos, segmented de tipo, cambio de curva del gráfico de Frecuencia), `index.css` (estilos de las tablas/heatmap).
- **Backend**: `presentacionService.js` (nuevas agregaciones `tarifas` y `volumen-frontera` en `/api/dashboard/data`).
- **Sin cambios de base de datos** (se usan columnas existentes de `detalles`).
- **Datos**: la tabla en Bs/m³ y el comparativo solo muestran lo que exista (los históricos sin `flete_total_bs` o con `tarifa_flete_usd_m3 = 0` no aportan).
