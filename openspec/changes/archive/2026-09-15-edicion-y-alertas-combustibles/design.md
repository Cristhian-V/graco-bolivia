## Context

La sección **Combustibles** (`frontend/src/App.jsx`, `CombustiblesSection`) muestra la tabla admin de la tabla `combustibles` (23 columnas + botón Docs). Hay dos tablas espejo: `combustibles` (origen, editable) y `detalles` (presentación, solo lectura), sincronizadas por `upsertDetalle` (`presentacionService.js`). Hoy no existe endpoint de edición para combustibles (solo `PUT /usuarios/:id` como patrón de update dinámico), los documentos se muestran en un panel al final de la tabla, y las tres corridas (PRMs, manifiestos, combustibles) reprocesan todos los registros en cada ejecución programada.

Ver `proposal.md` para la motivación y `specs/` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Alertar visualmente tarifas de flete anómalas o nulas y tipo de cambio nulo, con marca de revisión persistente.
- Abrir documentos y edición debajo de cada registro, sin romper la tabla.
- Permitir editar manualmente todos los campos de negocio excepto la clave, manteniendo coherentes los campos derivados y reflejando los cambios en `detalles`.
- Que cada corrida procese solo registros nuevos.

**Non-Goals:**
- No cambia la sección Presentación (sigue de solo lectura).
- No reordena ni renombra columnas; no altera la deduplicación por `dim_dam`.
- No reintroduce ningún mecanismo de reprocesamiento masivo.

## Decisions

### 1. Alertas de fila calculadas en el cliente

La lógica de color se calcula en el render de la fila a partir de columnas ya devueltas por `SELECT *` (la nueva columna `tarifa_revisada_valor` llega automáticamente).

- Clases CSS: se añade `tr.soft-yellow td { background: #fef9c3; }` junto a `soft-red` (`index.css`).
- Precedencia: `tipo_cambio_trans == null` → `soft-red` (gana); si no, `tarifa_flete_usd_m3` nula o `> 150` y no revisada → `soft-yellow`.
- Comparación de revisión: `pg` devuelve `numeric` como string, así que la igualdad entre `tarifa_revisada_valor` y `tarifa_flete_usd_m3` se compara con `Number(...)` cuando ambos son no nulos, y con `== null` cuando ambos son nulos (equivalente a `IS NOT DISTINCT FROM`).
- *Alternativa considerada*: colorear en backend (SQL `CASE`). Descartada: duplicaría la lógica en un endpoint de lectura que hoy devuelve filas crudas.

### 2. Documentos y edición mediante fila expandida

Se reutiliza el patrón de expansión de `WeeklyTable` (`DashboardSection.jsx`): una fila extra `<tr><td colSpan>` debajo del registro.

- **Docs**: estado `expandedId`; al pulsar "Docs" se renderiza `<DocsRow>` justo debajo, que hace `getDocumentos(c.id)` al montarse. Solo una fila abierta a la vez. `colSpan = COLUMNAS_COMBUSTIBLES.length + 2` (Docs + Editar).
- **Editar**: un botón "Editar" por fila abre un formulario en una fila expandida (misma mecánica). Los 22 campos editables se disponen como inputs (text/number/date) en esa celda expandida.
- *Alternativa considerada*: modal. Descartada: el codebase no usa modales y la fila expandida reutiliza la mecánica que ya se introduce para Docs, sin CSS nuevo.

### 3. Endpoint de edición `PUT /combustibles/:id`

Sigue el patrón de update dinámico de `PUT /usuarios/:id` (`routes/api.js:95`):

- **Whitelist** de columnas editables = columnas de negocio menos `dim_dam` (y sin `id`, `nit`, `run_id`, `raw`). Se ignoran campos no permitidos.
- **Recálculo de derivadas** al guardar, con las fórmulas de la spec (`flete_total_usd/cantidad_m3`, `flete_total_usd×tipo_cambio_trans`, `flete_total_bs/cantidad_m3`); si falta divisor o tipo de cambio, la derivada queda nula. Todo se redondea a 2 decimales (reutilizando `r2`).
- Tras el `UPDATE`, se relee la fila completa (`SELECT *`) y se llama a `upsertDetalle(fila)` para replicar a `detalles`.
- Devuelve la fila actualizada para refrescar la tabla sin refetch completo (o se refresca la lista como en las demás secciones).

### 4. Endpoint `POST /combustibles/:id/ignorar`

Guarda la marca de revisión con el valor actual:

```
UPDATE combustibles SET tarifa_revisada = true, tarifa_revisada_valor = tarifa_flete_usd_m3 WHERE id = $1
```

Se usan **dos columnas**: `tarifa_revisada` (booleana) para registrar que se revisó, y `tarifa_revisada_valor` para el valor en ese momento. El booleano es necesario porque una tarifa nula revisada no podría distinguirse de una nunca revisada solo con el valor (`NULL` en ambos casos). La alerta amarilla se oculta en el cliente mientras `tarifa_revisada` sea verdadera y el valor actual coincida con la marca; si el valor cambia (edición o futura corrida), el amarillo reaparece solo, sin lógica de reset.

### 5. Procesamiento incremental

Las APIs de SUMA devuelven resultados por fecha descendente, así que "detenerse al primer registro existente" es seguro:

- **PRMs** (`runService.js`): en `scrapeCliente`, si `upsert(...)` devuelve `is_new === false`, se interrumpe la paginación de ese cliente (los siguientes son más antiguos y ya existen).
- **Manifiestos** (`manifiestosService.js`): en `processAduana`, al encontrar un `numMan` ya registrado se interrumpe la paginación de esa aduana (además de la omisión actual por `manifestExists`).
- **Combustibles** (`combustiblesService.js`): antes de procesar cada manifiesto, se omite si su `dim_dam` (`di || dam`) ya fue procesado. Para ello se registra cada declaración evaluada en la tabla `declaraciones_procesadas` (con `estado` `COMBUSTIBLE` o `NO_COMBUSTIBLE`), con un backfill idempotente desde `combustibles` en `db/init/008_declaraciones_procesadas.sql`. Así, las declaraciones no-combustible (antes "ignoradas" y re-consultadas cada corrida) también se saltan. Las que fallan con error no se marcan, para reintentarlas en la siguiente corrida.
- *Alternativa considerada*: watermark por NIT (fecha máxima guardada). Descartada por complejidad; el stop temprano cubre el caso de uso (corridas diarias sobre datos recientes).

### 6. Eliminación de "Reprocesar" y "Normalizar"

Se quitan los botones del panel, sus funciones (`reprocesarCombustibles`, `normalizarCombustibles`), sus rutas y las funciones de API del frontend. Con el flujo incremental, su barrido completo dejaba de tener sentido y pisaba las ediciones manuales.

### 7. Esquema

En `db/init/001_schema.sql` (idempotente, se aplica en cada arranque):

```
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada boolean NOT NULL DEFAULT false;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada_valor numeric;
```

No requiere migración de datos.

## Risks / Trade-offs

- **Backfill tardío**: detenerse al primer registro existente no detecta un registro con fecha vieja que llegue después. → Mitigación: es el caso de uso declarado (solo nuevos); si se necesita, se haría una corrida puntual con rango explícito.
- **Sin reproceso masivo**: si el BCB publica tardíamente un tipo de cambio, las filas con `tipo_cambio_trans` nulo ya no se re-derivan solas. → Mitigación: quedan marcadas en rojo suave y se corrigen por edición manual.
- **Comparación numérica de `numeric` como string**: riesgo de `"150.00" !== "150"`. → Mitigación: normalizar con `Number(...)` en la comparación de revisión y en el cálculo del umbral.
- **Ruido de alertas**: muchas filas podrían quedar amarillas si abundan tarifas nulas. → Mitigación: botón Ignorar persistente; es la señal deseada.
- **Cadena de derivadas**: editar `flete_total_bs` directamente solo persiste si no cambia `flete_total_usd` ni `tipo_cambio_trans` (que lo recalculan). → Se documenta en la interfaz (campo recalculado).

## Migration Plan

1. Desplegar backend: esquema nuevo (`tarifa_revisada_valor`), endpoints nuevos (`PUT /combustibles/:id`, `POST /combustibles/:id/ignorar`), procesamiento incremental y eliminación de endpoints reprocesar/normalizar.
2. Desplegar frontend: alertas de fila, Docs inline, Editar por fila, botón Ignorar; se retiran los botones Reprocesar y Normalizar y sus llamadas de API.
3. Sin migración de datos. Rollback: revertir el código; la columna nueva es inocua si queda.
