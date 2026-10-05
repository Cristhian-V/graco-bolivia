## Context

Ver `proposal.md` y el delta. El panel vive en `DashboardSection.jsx`; las tarjetas usan `CardFrame`/`ChartCard` y `useDashboardData` → `GET /api/dashboard/data?chart=...`. Hoy: `chart=tarifas` devuelve `{ tarifa, ant, act }` (2 meses, una unidad); `share_proveedor` y `vol_procedencia` se calculan en el caso por defecto sin filtro de tipo.

## Goals / Non-Goals

**Goals:**
- Etiqueta de burbuja con volumen + precio.
- Tabla de fletes única con 3 meses y T/C.
- Donuts con nombres por porción y filtro Todos/YPFB/Privados.
- Reordenar el panel.

**Non-Goals:**
- No cambia la base de datos ni el scraper.
- No cambia el resto de los gráficos.

## Decisions

### D1 — Gráfico combinado de precio y volumen

`d3Bubble` se reescribe como un gráfico combinado: **barras** de volumen (m³) sobre un eje derecho de **escala logarítmica** y una **línea** de precio (Bs/litro) sobre el eje izquierdo, cuyo mínimo es dos unidades menos que el menor precio. Cada barra rotula su volumen encima y cada punto de la línea su precio; las empresas se rotulan en vertical bajo cada barra.

### D2 — Tabla de fletes fusionada (3 meses + T/C)

Se reemplaza `chart=tarifas` por una variante que devuelve, para el mes elegido y los dos anteriores, por tramo: `usd` y `bs` (promedio ponderado por volumen) y el T/C promedio del mes (BCB, `AVG(tipo_cambio_trans)`). Respuesta:

```json
{
  "periodos": ["2026-07","2026-08","2026-09"],
  "tc": { "2026-07": 6.96, "2026-08": 6.96, "2026-09": 6.96 },
  "tarifas": [{ "tramo": "...", "usd": {"2026-07": 88.2, ...}, "bs": {"2026-07": 614, ...} }]
}
```

El frontend renderiza una fila por tramo y columnas agrupadas por mes (Bs/m³, USD/m³, T/C). Se elimina el antiguo par de tablas y las columnas de variación.

- Alternativa: dos llamadas (una por unidad). Descartada: mejor una sola.

### D3 — Donuts: nombres + filtro

`d3Donut` dibuja, para cada porción, el porcentaje sobre la porción y una **etiqueta con el nombre unida por una línea guía (polyline)** desde el borde de la porción hacia afuera, con el color de la porción. Las agregaciones `share_proveedor` y `vol_procedencia` aceptan `tipo` (`todos|ypfb|privado`), con YPFB = `importador_nit = '1020269020'`. El `share_proveedor` normaliza las variantes de un mismo proveedor: `proveedor ILIKE '%TRAFIGURA%'` se agrupa como `TRAFIGURA`. La cabecera de cada donut incluye el segmentado Todos/YPFB/Privados (reutilizando `TipoSeg`).

### D4 — Orden

Se reordenan las tarjetas en `DashboardSection` según el orden pedido (ver el escenario "Orden del panel").

## Risks / Trade-offs

- [3 meses × 3 columnas = tabla ancha] → scroll horizontal con la primera columna fija.
- [T/C promedio simple del mes] → se usa `AVG(tipo_cambio_trans)`; puede diferir del ratio de tarifas.
- [Muchas porciones en el donut] → nombres cortos junto a la porción; leyenda se mantiene.
