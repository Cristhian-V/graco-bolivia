## 1. Backend — agregaciones

- [x] 1.1 Agregar la rama `chart=tarifas` en `getDashboardData` (`presentacionService.js`) que devuelve `{ tarifas: [{ tramo, ant, act }] }` con tarifa ponderada por volumen del mes y del anterior, filtrando por `tipo` (`todos|ypfb|privado`) y `unidad` (`usd|bs`) e ignorando costo cero; verificar con `curl` contra un mes con datos (ej. `chart=tarifas&anio=2026&mes=9&producto=DIESEL&unidad=bs`)
- [x] 1.2 Agregar la rama `chart=volumen-frontera` que devuelve `{ volumen_frontera: [{ importador, aduana, volumen }] }` para el período y `tipo`; verificar con `curl`

## 2. Frontend — quitar YPFB y tabla de tarifas

- [x] 2.1 Quitar la tarjeta "Precio Promedio YPFB (Bs/litro)" del layout; verificar que la burbuja de Empresa queda sola
- [x] 2.2 Crear el componente `TarifasTable` (comparativa mes vs anterior, `singleMonth`, segmentado Todos/YPFB/Privado, tramo tal cual, promedio general) y usarlo en dos tarjetas: `$/M³` y `Bs/M³`; verificar `vite build` y datos reales
- [x] 2.3 Agregar el segmentado de tipo como `headerExtra` compartido y los estilos CSS de las tablas (variación ▲/▼, columna fija)

## 3. Frontend — tabla de volumen y curva

- [x] 3.1 Crear el componente `VolumenFronteraTable` (matriz importador × frontera, heat `sqrt`, totales, segmentado) y reemplazar el gráfico "Volumen Total por Importador (M³)"
- [x] 3.2 Cambiar la interpolación de `d3MultiLine` a `d3.curveMonotoneX`
- [x] 3.3 Verificar que las tres tablas respetan `singleMonth`, filtros avanzados y el segmentado

## 4. Validación

- [x] 4.1 Verificar end-to-end en el navegador (tarifas $ y Bs, volumen por frontera, segmentado, comparativo, heatmap) y el gráfico de Frecuencia suavizado
- [x] 4.2 Validar con `openspec validate panel-tablas-logistica-y-volumen`
