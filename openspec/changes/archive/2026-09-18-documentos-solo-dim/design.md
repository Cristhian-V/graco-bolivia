## Context

Ver `proposal.md`. `downloadDocumentos` (`combustiblesService.js`) baja la DIM y **todos** los documentos de soporte. Medido: `documentos-despacho` = 12,5 GB; la DIM = 224 MB y el soporte ~12,3 GB. El PDF de la DIM tiene hipervínculos `https://suma.aduana.gob.bo/b-oce/rest/downloadFile/{arcId}` que **responden 200 sin token** (probado), y el `arcId` coincide con `dim.docSop[].arc.id`.

## Goals / Non-Goals

**Goals:**
- Guardar solo la DIM; referenciar el soporte por URL pública.

**Non-Goals:**
- No se cambia la UI (la ruta de descarga resuelve ambos casos).
- No se abordan los manifiestos (impacto chico) ni el orden del T/C.

## Decisions

### 1. Solo la DIM se descarga
En `downloadDocumentos` se mantiene el guardado de la DIM y se **quita** la descarga de `dim.docSop`; en su lugar se inserta una fila por documento con su URL pública (`${config.suma.baseUrl}/b-oce/rest/downloadFile/{arc.id}`).

### 2. Nueva columna `url`
`ALTER TABLE documentos_despacho ADD COLUMN IF NOT EXISTS url text;`. Los registros de soporte llevan `url` y `ruta_archivo` nulo; la DIM lleva `ruta_archivo` y `url` nulo.

### 3. Descarga: archivo local o redirección
La ruta `/combustibles/:id/documentos/:docId/archivo` responde: si hay `url` → `res.redirect(url)`; si hay `ruta_archivo` → `res.download(...)`; si no → 404. El frontend no cambia.

### 4. `downloadArchivo` deja de usarse
El helper del scraper queda sin uso al no bajar el soporte. Se elimina.

## Risks / Trade-offs

- **Dependencia del link de la aduana**: si el documento se elimina en la aduana, el link deja de funcionar. → Antes se guardaba copia; se acepta el trade-off por el espacio.
- **Documentos ya descargados (12,3 GB)**: no se borran en este cambio. → Se pueden eliminar aparte para liberar espacio.
- **`tam`/tipo del soporte**: se conservan `tipo`, `tipo_des`, `num`, `emi` y `nombre_archivo` desde `docSop`.
