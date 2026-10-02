## Context

Ver `proposal.md` y el delta. `documentos_despacho` guarda la DIM como archivo local (`ruta_archivo`) y los documentos de soporte (`docSop`) como URL pública (`url`). El manifiesto de carga es el tipo `TR-007`. Los manifiestos descargados viven en la tabla `manifiestos` (con `ruta_archivo` relativa al volumen `downloads`).

## Goals / Non-Goals

**Goals:**
- Registrar a lo sumo un `TR-007` por DIM al procesar documentos.
- Limpiar los duplicados ya guardados.
- Completar el manifiesto de carga faltante desde la tabla `manifiestos`.

**Non-Goals:**
- No cambia la corrida de manifiestos ni el scraper.
- No se borran archivos del volumen `downloads`.
- No se afectan otros tipos de documento.

## Decisions

### D1 — Límite de `TR-007` al registrar documentos

En `downloadDocumentos`, antes del bucle se consulta si la DIM ya tiene un `TR-007`; en el bucle, al encontrar el primer `TR-007` se reserva el cupo (`manifiestoGuardado = true`) y se omiten los siguientes. Si ya existía uno, se omiten todos.

### D2 — Migración de limpieza

`db/init/013_manifiesto_unico.sql` borra los `TR-007` sobrantes conservando el de menor `id` por `dim_dam`. Es idempotente y se aplica en cada arranque (incluido el VPS tras el `git pull`).

```sql
DELETE FROM documentos_despacho
WHERE tipo = 'TR-007'
  AND id NOT IN (SELECT min(id) FROM documentos_despacho WHERE tipo = 'TR-007' GROUP BY dim_dam);
```

### D3 — Backfill desde `manifiestos`

`backfillManifiestos()` recorre los combustibles sin `TR-007`, toma el primer manifiesto vinculado (`manifiestos.di = dim_dam OR dam = dim_dam`, `ORDER BY correlativo LIMIT 1`), copia su PDF de `downloadsDir/<ruta_archivo>` a `documentosDespachoDir/<dim_dam>/<nombre>` y registra un `TR-007` con `ruta_archivo` (local) y `ON CONFLICT (dim_dam, tipo, num) DO NOTHING`. Devuelve un resumen (`total`, `copiados`, `sinManifiesto`, `errores`).

- Alternativa: registrar por URL. Descartada: el manifiesto es un PDF local (descargado con token), sin URL pública.

### D4 — Endpoint de backfill

`POST /api/combustibles/manifiestos-backfill` (admin) ejecuta `backfillManifiestos()` y devuelve el resumen. Se corre una vez en local y una vez en el VPS tras desplegar.

## Risks / Trade-offs

- [Copiar PDFs duplica almacenamiento] → son pocos (los combustibles sin manifiesto) y evita servir desde dos volúmenes.
- [Un DIM con varios manifiestos: se elige el primero] → es lo pedido; se ordena por `correlativo`.
- [Manifiesto sin PDF disponible] → se cuenta en `errores` y se omite.

## Migration Plan

1. `db/init/013_manifiesto_unico.sql` (limpieza idempotente).
2. Código: límite de `TR-007` + `backfillManifiestos` + endpoint.
3. Ejecutar el backfill en local y en el VPS.
4. Rollback: quitar el endpoint y la migración; lo ya copiado queda inerte.
