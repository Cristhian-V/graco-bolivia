## Context

Ver `proposal.md` y los deltas de `presentacion-datos`. El panel vive en `frontend/src/DashboardSection.jsx` y usa d3 (sin Chart.js). Hoy `ChartCard` auto-gestiona su propio estado de filtros, y `useDashboardData` consulta `GET /api/dashboard/data` con parámetros de filtro y un `chart` opcional (`weekly`, `burbujas`). El backend `getDashboardData` devuelve `monthly_ops` (`importador → mes → operaciones`) pero no tiene ningún desglose por `aduana`. El gráfico de Frecuencia se dibuja con `d3Line`, que aplana `monthly_ops` en una sola línea con etiquetas de empresa sobre el eje X.

## Goals / Non-Goals

**Goals:**
- Recortar KPIs y quitar el donut de CIF por país.
- Convertir el gráfico de Frecuencia en líneas múltiples por importador, con color procedural y leyenda.
- Agregar la tabla importador × aduana con mapa de calor.
- Compartir filtros y resaltado entre gráfico y tabla.

**Non-Goals:**
- No tocar la base de datos ni agregar endpoints nuevos.
- No cambiar el resto de gráficos, ni introducir Chart.js u otra librería.
- No agregar el eje por día, el zoom por mes ni la barra de totales del prototipo `grafico-clientes.html`.
- No eliminar del backend los campos de KPI/`cif_pais` que dejan de mostrarse (solo se ocultan en la interfaz).

## Decisions

### D1 — Un solo fetch para gráfico y tabla (`chart=frecuencia`)

Se agrega un modo `chart=frecuencia` a `getDashboardData` que devuelve, con el mismo `where`:

```
{ monthly_ops, aduana_matrix: { importador: { aduana: n } }, aduanas: [ ... ] }
```

`monthly_ops` reutiliza la consulta actual; `aduana_matrix` y `aduanas` salen de una segunda consulta `GROUP BY importador, aduana`. Así ambas vistas comparten un único período y un único `useDashboardData`.

- Alternativa: un componente con dos `useDashboardData`. Descartada: duplicaría el fetch y podría desincronizar el período.
- Alternativa: `chart=aduanas` separado. Descartada: obliga a dos requests con el mismo filtro.

### D2 — Dos tarjetas conectadas con estado elevado

Se crea un contenedor `FrecuenciaAduanas` que posee el estado de filtros (`filters`, `filtro`) y el cliente resaltado (`highlight`), y renderiza dos tarjetas: la del gráfico y la de la tabla. Para eso `ChartCard` gana soporte de estado controlado (recibe `filters`/`filtro`/`setFiltro` desde el padre en vez de crearlos). La tarjeta de la tabla reutiliza `CardFrame` con la misma cabecera de año y filtros.

- Alternativa: fusionar todo en una sola tarjeta. Descartada por pedido explícito de "dos tarjetas conectadas".
- Alternativa: Context de React. Descartada por ser dos componentes: props directas es más simple y explícito.

### D3 — Colores procedurales y estables

Se seleccionan los top-N importadores por total de operaciones del período (N = filtro de cantidad, por defecto 7) y se les asigna color con una escala generada por d3, p. ej. `d3.quantize(d3.interpolateRainbow, N)` o `d3.schemeTableau10` extendida. El índice en el ranking fija el color, de modo que gráfico y tabla usan el mismo mapa `importador → color`. Sin tope: si N crece, se generan N colores; no existe la categoría "Otros".

- Alternativa: la constante `SERIES` actual. Descartada: solo cubre 15 y cicla, perdiendo unicidad con N alto.

### D4 — Gráfico de líneas múltiples reescrito en d3

`d3Line`/`renderLine` se reescriben: `x = d3.scalePoint` sobre los meses transcurridos, `y = d3.scaleLinear` de 0 al máximo de operaciones, una `d3.line` por importador coloreada con D3, puntos/path y una leyenda HTML o en SVG con los colores. Se eliminan las etiquetas de empresa sobre el eje X y los separadores punteados. `highlight` atenúa las líneas no resaltadas y engrosa la resaltada.

- Se mantiene la regla de solo meses transcurridos (`maxMes` según año) y que el gráfico usa solo el año, sin restringirse por los meses (sigue con `soloAnio`).

### D5 — Tabla de calor

La tabla se construye desde `aduana_matrix` y `aduanas` (columnas = aduanas presentes en el período). Cada celda calcula su fondo con `color-mix(in oklab, <azul> p%, <fondo>)` con `p` proporcional al máximo del período, como en `grafico-clientes.html`. Primera columna fija (`position: sticky; left: 0`) y `overflow-x: auto`. Fila y columna de totales. Se usa el mismo mapa de color de D3 para el cuadrito de cada importador.

- Aduana nula/vacía: se agrupa bajo la etiqueta `"Sin aduana"` para no perder operaciones.

### D6 — Interacción

El contenedor mantiene `highlight` (importador). `onMouseEnter`/`onMouseLeave` en las filas de la tabla y en las entradas de la leyenda lo actualizan; el gráfico se redibuja con `highlight` (vía `renderKey`/estado). Al salir, `highlight = null`.

### D7 — Recortes de KPIs y CIF

`kpiList` pasa a tres entradas (Volumen Total, Nº Operaciones, Importadores) y la rejilla `.dash-kgrid` usa `repeat(auto-fit, minmax(...))` en vez de 4 columnas fijas. Se elimina el `ChartCard` "U$S CIF por País de Origen" y su tercio en `.dash-row`. El backend sigue calculando esos campos; no se toca.

## Risks / Trade-offs

- [N alto produce demasiadas líneas/colores ilegibles] → es una decisión del usuario; el default 7 y colores procedurales mitigan el caso común.
- [Redibujar el gráfico en cada hover puede costar] → el conjunto es pequeño (≤ ~N×12 puntos); se puede usar una capa de highlights en vez de recrear el SVG si hace falta.
- [Aduanas como columnas dinámicas ensanchan la tabla] → contenedor con scroll horizontal y primera columna fija.
- [El estado compartido obliga a modificar `ChartCard`] → cambio acotado: prop opcional de estado controlado, conservando el comportamiento actual cuando no se pasa.
- [`monthly_ops` y la matriz pueden incluir importadores sin operaciones en el período] → se filtran y ordenan por total antes de aplicar N.

## Migration Plan

1. Backend: modo `chart=frecuencia` en `getDashboardData` (matriz de aduanas + lista de aduanas).
2. Frontend: recortar `kpiList` y el donut de CIF; ajustar `.dash-kgrid`.
3. Frontend: soporte de estado controlado en `ChartCard`; contenedor `FrecuenciaAduanas`; reescritura de `d3Line` a líneas múltiples con leyenda y `highlight`.
4. Frontend: tabla de calor y su interacción con el gráfico.
5. Verificar: recorte de KPIs, gráfico de líneas por importador, filtro de cantidad, tabla con aduanas del período, resaltado en ambos sentidos.
6. Rollback: revertir los archivos de frontend/backend; no hay cambios de BD.
