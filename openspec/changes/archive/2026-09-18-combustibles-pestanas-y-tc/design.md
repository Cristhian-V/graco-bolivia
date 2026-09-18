## Context

Ver `proposal.md`. Hoy `CombustiblesSection` (`App.jsx:333`) es una tabla única sin paginación, alimentada por `GET /combustibles` con `SELECT *`, que incluye `raw` (**~7.8 KB/fila, 20 MB en total**). Las alertas son rojo (`tipo_cambio_trans` nulo) y amarillo (tarifa), definidas en `filaClase` (`App.jsx:302`). El `tipo_cambio` se mantiene solo con la carga inicial y el botón manual; la tabla quedó en `2026-09-07` y el proceso diario no lo actualiza, por eso hay 86 registros con `tipo_cambio_trans` nulo (fechas 2026-09-08 a 2026-09-14).

## Goals / Non-Goals

**Goals:**
- Separar Historial y Pendientes, con paginación server-side de 100/página sin `raw`.
- Alertas por prioridad rojo > violeta > amarillo, incluida `us_unitario` > 5000.
- Sincronizar el tipo de cambio faltante y mantenerlo al día con la corrida diaria.

**Non-Goals:**
- No se agrega "Ignorar" para `us_unitario` (se corrige editando).
- No se cambia el cálculo del flete ni la tabla semanal.
- No se pagina la pestaña Pendientes con una tabla aparte (usa el mismo componente; ver Decisiones).

## Decisions

### 1. Paginación server-side
`GET /combustibles` pasa a aceptar `pagina` (1-based), `limite` (default 100) y `tipo` (`historial` | `pendientes`), y devuelve `{ total, pagina, limite, filas }`. El `SELECT` **excluye `raw`** (ninguna vista lo usa). Orden `fecha DESC NULLS LAST, dim_dam`. *Alternativa*: paginar en el front sobre todo el dataset; descartada por el peso de `raw` (~20 MB).

### 2. Predicado de Pendientes (en SQL)
Un registro está pendiente si:
```
tipo_cambio_trans IS NULL
OR us_unitario > 5000
OR ((tarifa_flete_usd_m3 IS NULL OR tarifa_flete_usd_m3 > 150)
    AND NOT (tarifa_revisada AND tarifa_revisada_valor IS NOT DISTINCT FROM tarifa_flete_usd_m3))
```
Se reutiliza el orden de fecha desc. La pestaña Historial es el complemento (sin filtro).

### 3. Colores y prioridad
- rojo suave (`#fdecea`): `tipo_cambio_trans` nulo.
- violeta (`#ede9fe`): `us_unitario` > 5000 (clase nueva `soft-violet`).
- amarillo (`#fef9c3`): tarifa sin revisar.
La clase de la fila se resuelve en el front con la prioridad **rojo > violeta > amarillo**.

### 4. Acciones por fila
Se mantienen Docs y Editar. "Ignorar" solo aparece para la validación de tarifa (amarillo). Para `us_unitario` no hay "Ignorar".

### 5. Presentación
Las pestañas usan el mismo componente de tabla; la barra (cliente, Procesar, mes, Excel) queda arriba de las pestañas. Los contadores por pestaña salen del `total` de cada consulta.

### 6. Sincronización del tipo de cambio
- **Diaria**: la cadena de `programacion-corridas` actualiza `tipo_cambio` desde el BCB para el período en curso (`actualizarTipoCambioRango`), y luego ejecuta la sincronización de combustibles.
- **Sincronización**: `sincronizarTipoCambioCombustibles()` toma las `fecha_factura_trans` distintas de registros con `tipo_cambio_trans` nulo, asegura la cotización en `tipo_cambio` (consulta al BCB si falta) y actualiza cada registro: `tipo_cambio_trans`, `flete_total_bs = flete_total_usd × tc`, `tarifa_flete_bob_m3 = flete_total_bs / cantidad_m3`, replicando a `detalles`.
- Se expone un endpoint manual para dispararla desde la UI.

### 7. Filtro y refresco por mes
`GET /combustibles` acepta `mes` (`YYYY-MM`) y filtra por `to_char(fecha, 'YYYY-MM') = mes`. El frontend separa el valor del selector (`mes`) del mes aplicado (`mesFiltro`); el botón **Refrescar** copia `mes` → `mesFiltro`, reinicia a la página 1 y fuerza un refetch. El mismo selector se usa para la descarga de Excel. *Alternativa*: filtrar al cambiar el selector; se descartó para que el usuario decida cuándo recargar.

## Risks / Trade-offs

- **Quitar `raw` del listado**: ninguna vista lo usa; se conserva en la base. → Verificado contra el front actual.
- **Backfill pisa ediciones manuales de `flete_total_bs`**: al recalcular, sobreescribe el valor. → Solo aplica a filas con `tipo_cambio_trans` nulo (que no se pudieron derivar bien); se documenta.
- **BCB sin cotización** en alguna fecha (fin de semana/feriado): esas fechas quedan nulas y el registro permanece en Pendientes. → Esperado.
- **Peso de la consulta de Pendientes**: el predicado usa columnas sin índice; con ~2654 filas es despreciable.

## Migration Plan

1. Backend: paginación en `GET /combustibles` (sin `raw`), sincronización de tipo de cambio y paso en la cadena diaria.
2. Frontend: pestañas, paginación, alertas (violeta) y acciones.
3. Ejecutar la sincronización para resolver los 86 registros actuales.
4. Rollback: revertir código; no hay cambios de esquema.
