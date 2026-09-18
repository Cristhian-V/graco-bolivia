## Why

La descarga de documentos consume **12,5 GB** en el servidor, de los cuales la DIM es solo **224 MB** y los documentos de soporte ~**12,3 GB**. Se verificó que el PDF de la DIM contiene los **links públicos** a cada documento (`https://suma.aduana.gob.bo/b-oce/rest/downloadFile/{arcId}`, sin token), por lo que no hace falta guardar los documentos de soporte.

## What Changes

- La extracción de combustibles **solo descarga y guarda el PDF de la DIM**.
- Los documentos de soporte se **registran con su URL pública de la aduana** (`b-oce/rest/downloadFile/{arcId}`) y **no** se guardan en el servidor.
- La descarga de un documento sirve el archivo local (DIM) o **redirige** a la URL pública (soporte).

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `combustibles`: la descarga de documentos guarda solo la DIM; los documentos de soporte se referencian por su URL pública.

## Impact

- **Backend**: `backend/src/services/combustiblesService.js` (`downloadDocumentos`), `backend/src/routes/api.js` (redirección en la descarga), `db/init/001_schema.sql` (columna `url` en `documentos_despacho`).
- **Frontend**: sin cambios (la ruta de descarga resuelve DIM local o redirección).
- **Espacio**: de ~12,5 GB a ~224 MB (los documentos de soporte ya descargados se pueden borrar aparte).
- **Sin dependencias nuevas.**
