## 1. Backend — backfill automático

- [x] 1.1 En `executeCombustiblesRun` (`combustiblesService.js`), llamar a `backfillManifiestos()` al terminar la corrida e incluir su resumen; verificar que una corrida de combustibles deja 0 registros sin `TR-007`

## 2. Frontend — botón

- [x] 2.1 Agregar `backfillManifiestos()` en `api.js` y un botón "Completar manifiestos" (solo `admin`) en `CombustiblesSection` que muestre el resumen; verificar `vite build`

## 3. Validación

- [x] 3.1 Verificar el botón (ejecuta y refresca) y validar con `openspec validate manifiesto-carga-automatico`
