## 1. Base de datos

- [x] 1.1 Crear `db/init/013_manifiesto_unico.sql` que deja un solo `TR-007` por `dim_dam` (borra los sobrantes conservando el de menor `id`); verificar que el arranque aplica 13 archivos y que la consulta de duplicados queda en 0

## 2. Backend — límite de manifiesto

- [x] 2.1 En `downloadDocumentos` (`combustiblesService.js`), registrar solo el primer `TR-007` por DIM; verificar que al procesar una declaración con varios `TR-007` se guarda uno solo

## 3. Backend — backfill

- [x] 3.1 Agregar `backfillManifiestos()` (copiar el primer manifiesto vinculado de la tabla `manifiestos` al folder de documentos y registrar el `TR-007`) y el endpoint `POST /api/combustibles/manifiestos-backfill` (admin); verificar con `curl` el resumen (`total`, `copiados`, `sinManifiesto`, `errores`)

## 4. Validación

- [x] 4.1 Ejecutar el backfill y verificar que los registros antes sin manifiesto ya tienen un `TR-007`, y que ninguno tiene más de uno; validar con `openspec validate manifiesto-carga-unico`
