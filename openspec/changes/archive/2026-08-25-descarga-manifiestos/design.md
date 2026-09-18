## Context

Sistema ya desplegado (ver specs de `prm-scraping`, `prm-ingestion`, `prm-dashboard`). El backend Node/Express ya autentica contra SUMA y descarga PRMs. El spike confirmó los endpoints de "Agrupación de PRM's" y la lógica exacta del botón "Ver Manifiesto" (ver `proposal.md`).

Puntos fijos descubiertos:
- Búsqueda: `POST https://suma.aduana.gob.bo/n-ingreso/api/json/pre/{nit_declarante}/criBus?page=<offset>&size=<n>` y `.../criBus/count`, body `{ aduRec, numDocCos }`.
- `nit_declarante` = NIT de CUMBRESYS (`perfilUsuario.nit` = `1015517026`), va en la URL; el NIT del cliente va en `numDocCos`.
- Detalle del manifiesto: `GET https://servicios.aduana.gob.bo/ssu-mim-ingreso-rest/manifiesto/{idMan}`.
- PDF: `GET .../reporte/visor/{id}` (blob PDF). Lógica "Ver Manifiesto": último `infTec.docFir[].id`; si no, `docSopMic` con `tip.cod ∈ {TR-007, BT}` → `arc.id`.
- Un manifiesto = un PDF (uno a uno). Nombre de archivo = `{nombre_cliente}_{correlativo}.pdf` con correlativo **por cliente**.

## Goals / Non-Goals

**Goals:**
- Descargar los PDFs de manifiestos por cliente (importador) y aduana de recepción, deduplicando por `numMan`.
- Guardar los PDFs en `downloads/` (volumen) con nombre legible.
- Reorganizar el frontend en secciones con barra lateral y añadir Aduanas (listar + alta) y Manifiestos.
- Encadenar la corrida de manifiestos después de la de PRMs el sábado.

**Non-Goals:**
- No se descarga el documento D/E ni el PRM (solo el manifiesto).
- No se gestionan ediciones/eliminación de aduanas (solo listar + alta).
- No se re-agrupan PRMs en SUMA; solo se consulta y descarga.

## Decisions

### Reutilizar el cliente de SUMA existente

- Se agrega `scraper/manifiestos.js` que reutiliza `login()` y los headers (`Auth-Token`, `User`, `charset`) ya implementados.
- Alternativa considerada: duplicar el flujo. Se descarta por mantenibilidad.

### NIT del declarante configurable

- `SUMA_DECLARANTE_NIT` (por defecto `1015517026`) en config/env; se usa en la URL de `criBus`.
- Se obtiene del `perfilUsuario.nit` (ya disponible vía `credentialPortal`), pero se parametriza para no depender de una llamada extra.

### Flujo de extracción por cliente + aduana

1. `SELECT DISTINCT aduana_recepcion_cod FROM prm WHERE nit = $1` (aduanas del cliente).
2. Por cada aduana: `count` → paginar `criBus` (offset `0, 100, 200…`) → filtrar `fecTra ∈ [desde, hasta]`.
3. `DISTINCT (datGen.idMan, datGen.numMan)` de los PRMs filtrados.
4. Por cada `numMan` no registrado: `GET manifiesto/{idMan}` → elegir id de PDF (último `docFir.id`, si no `docSopMic` TR-007/BT `arc.id`) → `GET reporte/visor/{id}` → escribir archivo → upsert en `manifiestos`.

### Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS manifiestos (
  id             bigserial PRIMARY KEY,
  num_man        text NOT NULL,
  id_man         text,
  nit            text NOT NULL REFERENCES clientes(nit),
  aduana         text,
  fecha          date,
  correlativo    integer NOT NULL,     -- correlativo por cliente
  nombre_archivo text,
  ruta_archivo   text,
  run_id         bigint REFERENCES ejecuciones(id),
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (num_man)
);
```

- Correlativo por cliente: `COALESCE(MAX(correlativo),0)+1` para el `nit`. Como las corridas son secuenciales no hay carrera.
- Nombre de archivo: sanitizar el nombre del cliente (espacios → `_`, quitar puntos finales y caracteres no seguros) y formatear el correlativo a 3 dígitos: `ABRENO_IMPORT_EXPORT_S_R_L__001.pdf`.

### Almacenamiento de archivos

- Carpeta `downloads/` montada como volumen en el backend (persistente), subcarpeta por cliente (`downloads/{nit}/`).
- `ruta_archivo` guarda la ruta relativa; el frontend la sirve vía un endpoint estático o `GET /api/manifiestos/:id/archivo`.

### Programación encadenada

- El scheduler del sábado ejecuta `executeRun` de PRMs y, al terminar, `executeManifiestosRun` (misma franja horaria, en secuencia). `POST /api/ejecutar-manifiestos` para disparo manual/backfill.

### Frontend en secciones

- `App.jsx` pasa a usar una barra lateral (lista de secciones) + área de contenido. Las vistas actuales (Registros, Resumen, Histórico) quedan dentro de la sección "PRMs".
- Nuevas secciones "Aduanas" (tabla + formulario de alta) y "Manifiestos" (selector de cliente + tabla con enlace al PDF).

### API de aduanas

- `GET /api/aduanas` (listar) y `POST /api/aduanas` (alta; rechaza código duplicado con 409).

## Risks / Trade-offs

- **La API de SUMA puede bloquear por volumen** → se mantiene espera entre peticiones y reintentos, igual que en PRMs; la corrida de manifiestos es más liviana (solo aduanas usadas por cada cliente).
- **`numDocCos` (consignatario) vs importador**: el spike mostró que con el NIT del importador devuelve los mismos resultados, pero puede diferir en casos puntuales → se usa el NIT del importador tal cual (decisión del usuario); si faltan manifiestos, revisar el campo en el spike de implementación.
- **Nombre de archivo largo o con caracteres raros** → sanitización determinística documentada.
- **Correlativo por cliente y dedupe**: si se borra un PDF manualmente, el correlativo no se reutiliza (seguro); el `UNIQUE(num_man)` evita re-descargas.

## Migration Plan

- Aditivo: nueva tabla `manifiestos` (aplicada de forma idempotente al arranque, igual que el esquema actual).
- Nuevo volumen `downloads` en `docker-compose.yml`.
- Rollback: detener servicios; el esquema es aditivo y la re-corrida es idempotente.
