## 1. Manifiestos sin aduana

- [x] 1.1 `manifiestosService.js`: `processCliente` usa `countCriBus(token, null, nit)` y `fetchCriBusPage(token, null, nit, ...)`; la aduana se toma de `datGen.aduRec.cod`. Verificar: no quedan referencias a `prm` en el servicio.
- [x] 1.2 `runManifiestos`: llamar `processCliente` una vez por cliente (sin el bucle de aduanas).

## 2. Cadena diaria sin PRMs

- [x] 2.1 `index.js`: quitar el paso `executeRun` de `correrCadena` y su import. Verificar: la cadena arranca con manifiestos.

## 3. Verificación

- [x] 3.1 Desplegado; manifiestos de `1013607029` descargó 1 con aduana 721 (del registro); corrida por cliente sin desglose de aduanas, 0 errores.
