## Context

Ver `proposal.md`. La cadena diaria corría PRMs → manifiestos → combustibles. El único uso automatizado de la tabla `prm` era obtener las aduanas de recepción (`manifiestosService.js`), y `runService` hacía un scrape completo (horas en un cliente nuevo como YPFB con 475.856 PRMs). Verificado en vivo: `countCriBus(token, null, nit)` devuelve **todas** las aduanas del cliente (ej. 3330) y `fetchCriBusPage(token, null, nit, ...)` trae los registros con `datGen.aduRec.cod`.

## Goals / Non-Goals

**Goals:**
- Extraer manifiestos/combustibles sin depender de los PRMs.
- Sacar el scrape de PRMs de la cadena automática (evitar el backfill de horas).

**Non-Goals:**
- No se elimina la capacidad de PRMs (sigue disponible de forma manual y su tabla).
- No se cambia la extracción de combustibles.

## Decisions

### 1. Manifiestos por cliente sin aduana
`processAduana` pasa a `processCliente`: `countCriBus(token, null, nit)` y `fetchCriBusPage(token, null, nit, ...)`. La aduana de cada manifiesto se toma del registro (`datGen.aduRec.cod`) al insertarlo. El corte incremental consciente de huecos ahora usa `min(fecha)` por cliente (sin aduana).

### 2. Cadena diaria sin PRMs
`correrCadena` (`index.js`) deja de llamar a `executeRun`; queda manifiestos → tipo de cambio → combustibles. La extracción de PRMs sigue disponible por su endpoint manual, pero ya no es necesaria para el flujo.

*Alternativa considerada*: PRMs livianos (solo la primera página para las aduanas). Descartada porque `criBus` sin aduana lo hace innecesario.

## Risks / Trade-offs

- **Sección "PRMs" sin datos automáticos**: la UI de PRMs queda con lo que ya había. → Aceptado; si se necesita, se corre manualmente.
- **Búsqueda sin aduana devuelve más registros**: la paginación por cliente cubre todas las aduanas; con el filtro de fecha y el corte incremental queda acotada. → Ya probado (el conteo y la paginación funcionan con `aduana = null`).
- **Datos de `prm` existentes**: no se borran.
