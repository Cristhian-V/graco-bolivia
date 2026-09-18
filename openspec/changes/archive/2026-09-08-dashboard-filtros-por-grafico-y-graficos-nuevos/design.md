## Context

Ver `proposal.md` para la motivación. Estado actual relevante:

- El panel vive en `frontend/src/DashboardSection.jsx` con gráficos D3 puros y un único estado `filters` global que se envía a `GET /dashboard/data`.
- El backend (`backend/src/services/presentacionService.js`) construye una sola cláusula `WHERE` (`buildWhere`) y devuelve todos los agregados en una sola llamada. Hoy soporta `mes`, `importador`, `proveedor`, `procedencia`, `aduana`, `producto` — sin rango de fechas.
- Los datos vienen de la tabla `detalles` (1.875 filas, 2026-01 → 2026-09). Columnas usadas: `us_unitario` (USD/m³), `cantidad_m3`, `tarifa_flete_usd_m3`, `tipo_cambio_dim`, `us_precio_marcador` (constante 1120), `importador`, `importador_nit`, `fecha`.
- Sin migración de esquema: la fórmula de precio ponderado usa columnas existentes.

## Goals / Non-Goals

**Goals:**
- Filtros independientes por gráfico, con estado de filtros por gráfico en el frontend.
- KPIs calculados una sola vez por pestaña de producto (globales, sin filtros).
- Agregaciones semanales y de burbujas resueltas en SQL, no en el navegador.
- Reutilizar el patrón D3 existente; la tabla semanal se renderiza como tabla HTML (no SVG).

**Non-Goals:**
- No se cambia el esquema de `detalles` ni la captura de combustibles.
- No se persisten los filtros elegidos (no hay preferencias guardadas).
- No se toca la fuente del `us_precio_marcador` (sigue siendo 1120).

## Decisions

### D1 — Datos por gráfico + KPIs globales separados

Cada gráfico tendrá su propio estado de filtros y pedirá sus datos; los KPIs se piden aparte.

- **Backend**: `GET /dashboard/kpis?producto=…` → devuelve los KPIs globales (sin filtros de gráfico). `GET /dashboard/data?chart=<id>&…filtros&desde=…&hasta=…` → devuelve solo el agregado del gráfico pedido (`weekly`, `burbujas`, o los agregados ya existentes).
- **Frontend**: `DashboardSection` mantiene `tab` (producto) y carga KPIs una vez por cambio de pestaña; cada tarjeta de gráfico gestiona su propio estado de filtros y dispara su propia petición.
- **Alternativa considerada**: una sola llamada con objetos de filtros por gráfico (payload anidado). Descartada: complica el contrato sin beneficio real con ~2.000 filas; la independencia se modela más simple con peticiones separadas.

### D2 — Rango de fechas en `buildWhere`

Se agregan `desde` y `hasta` (YYYY-MM-DD) a `buildWhere`:

```
desde → fecha >= desde
hasta → fecha <= hasta
```

Cuando hay rango de fechas, se **ignora** el parámetro `mes` (regla "el rango manual desactiva el mes"). El frontend, al elegir rango, limpia `mes` de ese gráfico antes de enviar.

### D3 — Agrupación semanal (lunes a domingo)

En Postgres, `date_trunc('week', fecha)::date` devuelve el lunes de la semana ISO (lunes→domingo), que es exactamente el ciclo pedido. Etiqueta `dd Mmm - dd Mmm` construida con la fecha de inicio y `inicio + 6 días`, usando abreviaturas es-BO (p. ej. `27 Jul - 02 Ago`). Las semanas parciales de borde se desbordan al mes vecino de forma natural con esta agrupación.

### D4 — Fórmula de precio ponderado en SQL

```
precio_op_usd_m3 = us_unitario + COALESCE(tarifa_flete_usd_m3, 0)

Tabla semanal (USD/m³):
  importacion = ROUND( SUM(precio_op_usd_m3 * cantidad_m3) / NULLIF(SUM(cantidad_m3),0), 2 )
  marcador    = ROUND( AVG(us_precio_marcador), 2 )
  spread      = importacion - marcador  (calculado en el frontend)

Burbujas (Bs/litro), por fila:
  precio_bs_litro = precio_op_usd_m3 / 1000 * tipo_cambio_dim
  precio empresa  = SUM(precio_bs_litro * cantidad_m3) / NULLIF(SUM(cantidad_m3),0)
```

- `tarifa_flete_usd_m3` nula se trata como 0 (flete desconocido → se usa solo `us_unitario`).
- Filas con `tipo_cambio_dim` nulo se **excluyen** del agregado en Bs/litro (no se puede convertir); en USD/m³ sí participan.

### D5 — Checklist de importadores por NIT

`GET /dashboard/filters` pasa a devolver los importadores como objetos `{ value, label, nit }` con `value = importador_nit` cuando existe y `value = nombre` cuando no. `buildWhere` filtra por `importador_nit = ANY(...)` para valores NIT y por `importador = ANY(...)` para nombres, desambiguando importadores con nombre repetido.

### D6 — Identificación del cliente YPFB

El gráfico 4 filtra por el NIT canónico del cliente YPFB en `clientes` (`1020269020`), con caída a coincidencia por nombre (`importador = 'YPFB'`) si el NIT no está en `detalles`. Si no hay registros, el gráfico se muestra vacío conservando las líneas de referencia.

### D7 — Render

- **Tabla semanal**: HTML `<table>` (no D3), con la columna `importadores` colapsada por defecto; al hacer clic en la fila se expande mostrando los importadores separados por `|`.
- **Burbujas**: función D3 nueva (`d3Bubble`), eje X categórico (empresa), eje Y precio Bs/litro, radio ∝ volumen, líneas horizontales fijas en 18 y 16.5 Bs/litro.
- **Filtros por gráfico**: componente reutilizable `<ChartCard>` con cabecera minimizada (desplegable): checklist de importadores, multiselects de mes/procedencia/proveedor/aduana y calendario de rango. Cada tarjeta nace sin filtros.

## Risks / Trade-offs

- **N peticiones por gráfico** (una por gráfico + KPIs) → trivial con el volumen actual (~2.000 filas); se acepta por simplicidad. Mitigación si creciera: consolidar en una petición por pestaña con bloques por gráfico.
- **`tipo_cambio_dim` nulo** deja burbujas sin valor → se excluyen; el usuario verá menos burbujas. Mitigación: documentado en el spec; no se interpola.
- **`us_precio_marcador` constante (1120)** hace que `spread` sea siempre importación−1120 → es el comportamiento actual del dato; no se corrige en este cambio.
- **YPFB sin datos** (0 filas en `detalles`) → el gráfico 4 saldrá vacío hasta que se importe su data. Riesgo de percepción; se muestra vacío con las líneas de referencia.
- **Duplicados aparentes** (operaciones idénticas el mismo día) inflan volumen y ponderan igual; son operaciones reales distintas (`dim_dam` único), no se deduplican.

## Migration Plan

1. Desplegar backend (nuevos endpoints y agregaciones, `buildWhere` con rango) — aditivo, no rompe el contrato actual de `/dashboard/filters` salvo el formato de importadores (objetos en vez de strings).
2. Desplegar frontend (refactor de `DashboardSection` a tarjetas con filtros propios).
3. Sin migración de datos. Rollback: revertir frontend; el backend mantiene compatibilidad de los campos existentes.

## Open Questions

Ninguna que cambie specs, enfoque o tareas.
