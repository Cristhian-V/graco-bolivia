## Context

`runCombustibles` (`combustiblesService.js`) seleccionaba manifiestos con `(di IS NOT NULL OR dam IS NOT NULL)` y usaba `numDecl = man.di || man.dam`. Para los DAM, `getDeclaracionPorNumero` llamaba a `/dim/nroDim/{num}`, que responde **202 con cuerpo vacío** → `res.json()` lanzaba "Unexpected end of JSON input". Se verificó además que el DAM no expone tipo de cambio ni flete (ver `descargas/mapeo_campos_DIM_vs_DAM.md`).

## Goals / Non-Goals

**Goals:**
- Extraer solo declaraciones DIM; omitir los manifiestos sin DIM.
- Eliminar los errores recurrentes de la corrida por DAM.

**Non-Goals:**
- No se implementa soporte de DAM (descartado por falta de datos).
- No se borran manifiestos, documentos ni registros existentes.

## Decisions

### 1. Filtrar por DIM en la consulta
La consulta de manifiestos pasa de `(di IS NOT NULL OR dam IS NOT NULL)` a `di IS NOT NULL`, de modo que la corrida nunca intente un DAM. Se usa `numDecl = man.di` (garantizado no nulo). *Alternativa*: mantener la consulta y saltar en JS; se descartó por hacer trabajo innecesario y ruido en logs.

### 2. Sin cambios en datos
Los manifiestos que solo tienen DAM permanecen en `manifiestos` y `declaraciones_procesadas`; simplemente no se procesan para combustibles. No hay migración.

## Risks / Trade-offs

- **Datos de DAM no extraídos**: se acepta; el DAM no aporta tipo de cambio ni flete, así que las filas habrían quedado incompletas. → Documentado.
- **`api/ejecutar-combustibles` seguirá leyendo manifiestos**: el filtro es en la consulta, no en la carga de manifiestos.
