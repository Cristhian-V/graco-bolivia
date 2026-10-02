## Why

La sección Presentación muestra hoy 8 KPIs y un gráfico de U$S CIF por país que no se usan, y el gráfico de Frecuencia de Operaciones se dibuja como una sola línea quebrada que agrupa empresas en segmentos del eje X, lo que impide comparar la evolución mensual de cada importador. Además falta la vista de operaciones por aduana, que permite ver por qué frontera ingresa cada cliente.

## What Changes

- **BREAKING**: se quitan de los KPIs las tarjetas **Precio Marcador, Precio Promedio, Total U$S CIF, Flete Total y Tarifa Flete Prom.**; solo quedan **Volumen Total, Nº Operaciones e Importadores** (rejilla a 3 columnas / auto-fit).
- Se quita el gráfico **U$S CIF por País de Origen** (solo en la interfaz).
- El gráfico **Frecuencia de Operaciones de Importación** pasa a ser un gráfico de **líneas múltiples**: eje X con los meses transcurridos del año seleccionado (Ene–Dic), una línea por importador con color procedural distinto, y eje Y = cantidad de operaciones. Muestra por defecto los 7 importadores con más operaciones, con un filtro para subir o bajar ese número (sin agrupar "Otros"). Se eliminan las etiquetas de empresa en el eje X y los separadores punteados; en su lugar va una leyenda.
- Se agrega, debajo, la tarjeta **Operaciones por Aduana por Importador**: tabla con una fila por importador y una columna por cada aduana **presente en el período**, celdas con **mapa de calor** según la cantidad de operaciones, columna y fila de totales.
- La tabla y el gráfico de Frecuencia **comparten los mismos filtros** (año + filtros avanzados, sin meses) y quedan **conectados**: al pasar el cursor sobre un cliente en la tabla se resalta su línea en el gráfico (y en la leyenda), y viceversa.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `presentacion-datos`: cambian los KPIs y los gráficos del panel (se eliminan tarjetas y el CIF por país), el gráfico de Frecuencia pasa a líneas múltiples por importador, se agrega la tabla de operaciones por aduana por importador y la interacción cruzada entre tabla y gráfico.

## Impact

- **Frontend**: `DashboardSection.jsx` (`d3Line`/`renderLine`, `kpiList`, eliminación del donut de CIF, nueva tabla de aduanas y estado compartido de filtros/resaltado), `index.css` (rejilla de KPIs a 3 columnas, estilos de la tabla de calor).
- **Backend**: `services/presentacionService.js` y `routes/api.js` — nuevo modo de `GET /api/dashboard/data` (`chart=frecuencia`) que devuelve en una sola consulta `monthly_ops`, la matriz importador × aduana y la lista de aduanas del período.
- **API**: no se agregan endpoints nuevos; se amplía la respuesta de `/api/dashboard/data`.
- **Sin cambios de base de datos.**
