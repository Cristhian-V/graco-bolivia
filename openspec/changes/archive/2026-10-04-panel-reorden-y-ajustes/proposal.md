## Why

Ajustes de contenido y orden del panel de Presentación: mostrar el precio junto al volumen en las burbujas, fusionar las dos tablas de tarifa de flete en una sola con tres meses y el tipo de cambio, identificar por nombre las porciones de los donuts con su filtro YPFB/Privado, y reordenar las secciones.

## What Changes

- **Burbujas (Precio Promedio por Empresa)**: la etiqueta sobre cada burbuja muestra el volumen y, en una segunda línea, el precio en Bs/litro.
- **Tabla de fletes fusionada**: se unifican las tablas USD y Bs en una sola, de **una fila por tramo y columnas por mes** (Bs/m³, USD/m³ y T/C promedio del mes), para los **tres meses** (en curso y dos anteriores). Se quitan las columnas de variación.
- **Donuts (Market Share por Proveedor y Volumen por Procedencia)**: cada porción muestra su porcentaje y una etiqueta con el nombre (proveedor / país) unida por una **línea guía (callout)** a la porción, con el color de la porción; se **agrupan las variantes de un mismo proveedor** (por ejemplo, TRAFIGURA) en una sola porción; y ambos incorporan el filtro **Todos / YPFB / Privados** (YPFB por NIT `1020269020`).
- **Orden del panel**: 1) Diésel YPFB, 2) Volumen por Frontera, 3) Market Share + Volumen por Procedencia, 4) tabla de fletes fusionada, 5) Benchmarking, 6) Precio Promedio Ponderado por Semana, 7) Frecuencia de Operaciones, 8) Operaciones por Aduana, 9) Precio Promedio por Empresa (burbujas).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `presentacion-datos`: ajustes de las burbujas, la tabla de fletes, los donuts y el orden del panel.

## Impact

- **Backend**: `presentacionService.js` (agregación `chart=tarifas` con 3 meses y T/C; filtro `tipo` en `share_proveedor` y `vol_procedencia`).
- **Frontend**: `DashboardSection.jsx` (burbujas, tabla fusionada, donuts, orden), `index.css`.
- Sin cambios de base de datos ni del scraper.
