## Context

Ver `proposal.md`. El corte incremental se introdujo en la capacidad de "procesamiento incremental": parar al primer registro existente asumiendo API date-desc sin duplicados. Evidencia en vivo para YPFB (NIT 1020269020): la extracción de PRMs procesó **401** (400 nuevos + 1 existente) y se detuvo; el registro `PRM-2026-241-291498` ya estaba en la BD y la API volvió a devolverlo en una página posterior. La paginación por offset (0 vs 400) no mostró solapamiento directo, pero el orden no es del todo estable entre requests, por lo que aparecen repetidos/desplazados.

## Goals / Non-Goals

**Goals:**
- No truncar la extracción cuando hay huecos (registros antiguos sin guardar).
- Mantener el corte rápido cuando los datos están completos sin huecos.

**Non-Goals:**
- No se elimina el `upsert`/deduplicación.
- No se cambia la paginación por offset de la API.

## Decisions

### 1. Corte consciente de huecos
Antes de paginar, se consulta el registro más antiguo guardado del cliente (`min(fecha)`):
- `prm-scraping`: `SELECT min(fecha) FROM prm WHERE nit = $1`.
- `manifiestos`: `SELECT min(fecha) FROM manifiestos WHERE nit = $1 AND aduana = $2`.

Si `minFecha <= desde` → no hay hueco → se activa el corte al primer existente. Si `minFecha > desde` (o no hay registros) → hay hueco → **no** se corta por existentes; se recorre hasta `desde`.

*Alternativa descartada*: eliminar el corte siempre (simple, pero reprocesa todo el rango en cada corrida). El corte consciente de huecos conserva la rapidez en el caso normal.

*Alternativa descartada*: cortar cuando una página completa no aporta nuevos. Falla para YPFB: su página 0 son los 400 recientes ya guardados → `nuevos = 0` → cortaría igual.

## Risks / Trade-offs

- **Heurística de "sin huecos"**: `minFecha <= desde` no garantiza que no haya huecos internos. → En la práctica, las corridas diarias son continuas; un hueco interno se rellenaría si el rango se amplía. Se documenta.
- **Con hueco, se reprocesa el rango completo** (upserts de existentes) hasta `desde`. → Es el precio de llenar el hueco; una vez completo, el corte vuelve a activarse.
