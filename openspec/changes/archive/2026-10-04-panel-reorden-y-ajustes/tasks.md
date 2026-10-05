## 1. Backend

- [x] 1.1 Reescribir `chart=tarifas` para devolver `{ periodos, tc, tarifas }` con 3 meses (en curso y dos anteriores), tarifa ponderada `usd`/`bs` por tramo y T/C promedio del mes (BCB); verificar con `curl`
- [x] 1.2 Aceptar el filtro `tipo` (`todos|ypfb|privado`) en las agregaciones `share_proveedor` y `vol_procedencia`; verificar con `curl`

## 2. Frontend — burbujas y tabla

- [x] 2.1 Reescribir `d3Bubble` como gráfico combinado (barras de volumen en eje log derecho + línea de precio Bs/litro, mínimo del eje izquierdo = mínimo − 2, etiquetas de volumen y precio, empresas en vertical)
- [x] 2.2 Reemplazar las dos `TarifasTable` por una única tabla fusionada (fila por tramo, columnas por mes: Bs/m³, USD/m³, T/C) con segmentado Todos/YPFB/Privado; verificar `vite build`

## 3. Frontend — donuts y orden

- [x] 3.1 En `d3Donut`, mostrar el porcentaje en la porción y el nombre con una línea guía (callout) hacia afuera, con el color de la porción; agregar el filtro Todos/YPFB/Privados (headerExtra) a las dos tarjetas de donut
- [x] 3.2 Reordenar las secciones del panel según el orden pedido
- [x] 3.3 Normalizar los proveedores: agrupar las variantes de TRAFIGURA en una sola porción (`share_proveedor`); verificar con `curl`
- [x] 3.4 Verificar que el donut se ve con etiquetas de línea guía y porcentaje en el centro de la porción

## 4. Validación

- [x] 4.1 Verificar visualmente y validar con `openspec validate panel-reorden-y-ajustes`
