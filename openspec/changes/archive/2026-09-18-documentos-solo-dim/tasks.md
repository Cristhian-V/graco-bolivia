## 1. Esquema

- [x] 1.1 `db/init/001_schema.sql`: `ALTER TABLE documentos_despacho ADD COLUMN IF NOT EXISTS url text;`. Verificar: la columna existe.

## 2. Backend

- [x] 2.1 `combustiblesService.js`: `downloadDocumentos` guarda solo la DIM y registra el soporte con su URL pública; se quitó `downloadArchivo` (y su import).
- [x] 2.2 `routes/api.js`: `/combustibles/:id/documentos/:docId/archivo` redirige si hay `url`, descarga si hay `ruta_archivo`.

## 3. Verificación

- [x] 3.1 Procesada declaración de `1013607029`: DIM local + 10 documentos de soporte con `url`; la ruta responde 302 → URL pública.
- [x] 3.2 La carpeta del despacho en disco contiene solo el PDF de la DIM.
