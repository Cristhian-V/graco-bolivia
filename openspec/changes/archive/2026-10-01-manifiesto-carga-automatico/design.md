## Context

Ver `proposal.md` y el delta. `backfillManifiestos()` y el endpoint `POST /api/combustibles/manifiestos-backfill` ya existen (change anterior). Solo falta llamarlo automáticamente y exponer un botón.

## Goals / Non-Goals

**Goals:**
- Completar los manifiestos de carga automáticamente al terminar la corrida de combustibles.
- Ofrecer un botón para dispararlo a mano.

**Non-Goals:**
- No cambia la lógica del backfill ni el orden manifiestos → combustibles.

## Decisions

### D1 — Llamada automática

En `executeCombustiblesRun`, después de `runCombustibles`, se llama `backfillManifiestos()` y su resumen se agrega al resultado/log. Es seguro: solo procesa los combustibles sin `TR-007`, que tras la primera vez suelen ser pocos o ninguno.

### D2 — Botón

En `CombustiblesSection` (solo `admin`), un botón "Completar manifiestos" llama `backfillManifiestos()` (nuevo helper en `api.js`) y muestra el resumen (`copiados`, `sinManifiesto`, `errores`).

## Risks / Trade-offs

- [Escanear todos los combustibles cada corrida] → después del primer backfill el conjunto a completar es mínimo.
- [Manifiesto sin PDF] → se cuenta en `errores` sin romper la corrida.
