## 1. Extracción solo DIM

- [x] 1.1 En `combustiblesService.js`, cambiar la consulta de manifiestos a `WHERE di IS NOT NULL`. Verificar: la consulta no devuelve manifiestos sin DIM.
- [x] 1.2 Usar `numDecl = man.di` (sin fallback a `dam`). Verificar: no se arma ninguna declaración con código DAM.

## 2. Verificación

- [x] 2.1 `node --check` del backend OK. Verificar en una corrida: no aparecen intentos ni errores de DAM (`Unexpected end of JSON input`).
