## Context

Ver `proposal.md` y el delta. El panel vive en `DashboardSection.jsx`; las tarjetas usan `CardFrame` (con `singleMonth` y `headerExtra` ya soportados) y `useDashboardData`, que llama a `GET /api/dashboard/data?chart=...`. Hoy existen los `chart` `weekly`, `burbujas` y `frecuencia`; los gráficos de tarifa por tramo y volumen usan las agregaciones del caso por defecto (`flete_tramo`, `flete_tramo_bob`, `vol_empresa`).

## Goals / Non-Goals

**Goals:**
- Reemplazar los 3 gráficos por 3 tablas ricas (comparativa de tarifas ×2 y matriz de volumen).
- Quitar el gráfico de burbujas YPFB.
- Suavizar las líneas de Frecuencia sin que bajen de cero.

**Non-Goals:**
- No cambiar la base de datos ni el scraper.
- No estimar fletes inexistentes: se muestra solo lo que hay.
- No separar origen/destino del tramo.

## Decisions

### D1 — Dos nuevos `chart` en el endpoint existente

Se agregan ramas al dispatch de `getDashboardData` en `presentacionService.js`:

- `chart=tarifas`: recibe `producto`, `anio`, `mes` (un solo mes), `tipo` (`todos|ypfb|privado`), `unidad` (`usd|bs`) y los filtros avanzados. Devuelve `{ tarifas: [{ tramo, ant, act }] }` con la tarifa ponderada (`Σcosto/Σvolumen`, ignorando costo 0) del mes anterior y del elegido. El mes anterior se calcula en el backend (si el mes es enero, cae en diciembre del año anterior).
- `chart=volumen-frontera`: recibe `producto`, `anio`, `mes` (uno o varios), `tipo` y filtros. Devuelve `{ volumen_frontera: [{ importador, aduana, volumen }] }`.

Alternativa: dos endpoints nuevos. Descartada: seguir el patrón `chart=` existente mantiene el frontend y el guard de roles sin cambios.

### D2 — Reutilizar la cabecera de tarjeta

Las tres tablas usan `CardFrame` con `singleMonth` (mes único; necesario para el comparativo mes vs anterior) y pasan el segmentado **Todos/YPFB/Privado** por `headerExtra`. Así se reutiliza el selector de año, la fila de meses y el panel de filtros avanzados existentes, sin portar los controles del HTML.

### D3 — Filtro de tipo

`tipo = ypfb` → `importador = 'YPFB'`; `privado` → `importador <> 'YPFB'`; `todos` → sin filtro. Se implementa en el backend a partir de `query.tipo`.

### D4 — Tramo tal cual

La tabla usa `tramo_flete` como texto de la primera columna (sin parsear origen/destino), porque los formatos son irregulares (`IQUIQUE - POTOSI`, `Mollendo -SCZ`).

### D5 — Variación como el HTML

La tabla de tarifas calcula `dif = round(act) - round(ant)` sobre los valores mostrados (para que la resta "cuadre" con lo que se ve) y `pct = (act/ant - 1) × 100`; se pinta con flecha (▲/▼) y color (sube rojo, baja verde), y sin dato si falta el mes anterior.

### D6 — Matriz de volumen con heat

Las columnas son las aduanas con volumen > 0 en el período; las celdas se colorean con escala raíz (`sqrt`) para que los valores pequeños no queden en blanco. Primera columna fija; total por fila y por columna.

### D7 — Curva monótona

En `d3MultiLine` se cambia `d3.curveLinear` por `d3.curveMonotoneX` (suaviza sin sobrepasar, no baja de cero).

## Risks / Trade-offs

- [Históricos sin `flete_total_bs` y con `tarifa_flete_usd_m3 = 0`] → se ignoran los costos cero; las tablas de flete muestran solo lo que existe (según lo acordado).
- [Mes sin mes anterior comparable (enero del primer año)] → la celda de variación se muestra sin dato.
- [Matriz con muchas fronteras] → scroll horizontal con primera columna fija.
- [Tipo por nombre "YPFB"] → se usa el nombre normalizado del importador que ya está en `detalles`.

## Migration Plan

1. Backend: agregar las ramas `tarifas` y `volumen-frontera` a `getDashboardData`.
2. Frontend: quitar la tarjeta de burbujas YPFB; agregar los componentes `TarifasTable` y `VolumenFronteraTable`; cambiar la curva.
3. Verificar: tablas con datos reales, segmentado, comparativo y heatmap; gráfico de Frecuencia suavizado.
4. Rollback: quitar los componentes y las ramas; los gráficos anteriores se restauran desde git.
