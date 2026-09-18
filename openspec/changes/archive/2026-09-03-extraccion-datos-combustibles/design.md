## Context

El sistema ya extrae PRMs y descarga manifiestos (ver specs de `manifiestos` y `prm-scraping`). Los PRMs se obtienen completos vía `criBus` (incluyen `detIte` con `tipEmb`). El spike confirmó que la DIM/DAM se expone como **JSON estructurado** en el módulo `ingreso/dim`, no solo como PDF.

Puntos fijos:
- Filtro de embalaje: `detIte[].tipEmb.cod === "VL" && tipEmb.des === "LIQUIDO A GRANEL"`.
- El PRM referencia la declaración: `datGen.numDocAso2` = DIM (`DI-...`), `datGen.numDocAso` = DAM (`DAM-...`).
- API de DIM: `POST /n-ingreso/api/json/dim/nit/{nit}/{tipo}/declaraciones`, `GET /ssu-mim-ingreso-rest/dim/consultas/micrelacionado/{id}`, `GET .../dim/obtener/parterecepcion?numDim=`, `GET .../reporte/visor/{id}` (PDF).

## Goals / Non-Goals

**Goals:**
- Extraer los 25 campos de la declaración por API y persistirlos en `combustibles`.
- Guardar localmente los documentos de "L. Documentos" de cada despacho.
- Limitar la descarga de manifiestos a los de tipo de embalaje VL/LÍQUIDO A GRANEL.

**Non-Goals:**
- No se parsea el PDF de la DIM/DAM (los datos salen del JSON de la API).
- No se modifica la lógica de PRMs existente.

## Decisions

### Extracción por API (no por PDF)

- Se usa el JSON estructurado de la API de `dim`, no `pdf-parse`. El mapeo de los códigos del formulario (E11, E16, H7, H8.2, C2, C4, C7, C8, A7, H11, L) a los nombres del JSON se resuelve en un spike de implementación (ya se identificaron varios: `cantidadFisica`, `incoterm`, `modDes`, `docSop`, `emisor`, `monto`).
- Alternativa considerada: parsear el PDF. Se descarta por fragilidad y porque el PDF es un reporte derivado del JSON.

### Flujo de extracción

1. En la corrida de manifiestos, al procesar cada manifiesto, se evalúa el filtro de embalaje sobre los ítems de sus PRMs (`detIte`).
2. Para cada manifiesto delimitado: `dim_dam = numDocAso2 (DI) || numDocAso (DAM)`.
3. Se obtiene la declaración por API: si hay DI se consulta la DIM; si no, se consulta la DAM. El spike confirma la equivalencia de campos DIM↔DAM (el usuario advirtió que no está seguro de que sean idénticos).
4. Se mapean los campos al registro `combustibles` y se hace upsert por `dim_dam`.
5. Se descargan los documentos de "L. Documentos" a `documentos-despacho/{dim_dam}/`.

### Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS combustibles (
  id                      bigserial PRIMARY KEY,
  dim_dam                 text NOT NULL,          -- DI si hay DIM, si no DAM (dedupe)
  crt                     text,
  uso                     text,
  fecha                   date,
  aduana                  text,
  incoterm                text,
  producto                text,
  proveedor               text,
  importador              text,
  transporte              text,
  cantidad_m3             numeric,
  tipo_cambio_dim         numeric,
  tramo_flete             text,
  us_unitario             numeric,                -- H11 * 1000
  lugar_entrega           text,
  importador_nit          text,
  pais_procedencia        text,
  modalidad_despacho      text,
  us_precio_marcador      numeric,                -- fijo 1120
  flete_origen_frontera   numeric,
  tipo_cambio_fof         numeric,
  flete_frontera_destino  numeric,
  tipo_cambio_ffd         numeric,
  total_flete_usd         numeric,                -- suma de los dos fletes en USD
  tarifa_flete_usd_m3     numeric,                -- total_flete_usd / cantidad_m3
  nit                     text,                   -- cliente (importador)
  run_id                  bigint REFERENCES ejecuciones(id),
  raw                     jsonb,
  creado_en               timestamptz NOT NULL DEFAULT now(),
  actualizado_en          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dim_dam)
);
```

- Dedupe por `dim_dam` (una declaración = una fila).
- Los valores monetarios se guardan como `numeric` para preservar decimales.

### Documentos de despacho

- Carpeta `documentos-despacho/` (volumen), subcarpeta por `dim_dam`.
- Cada documento de "L. Documentos" se descarga con `reporte/visor/{id}` (o el endpoint de archivo que corresponda) y se registra su ruta.

### Programación encadenada

- El scheduler del sábado encadena: PRMs → manifiestos (con filtro) → combustibles.

### API REST

- `GET /api/combustibles?nit=` — listado de extracciones.
- `GET /api/combustibles/:id/documentos` — documentos del despacho.
- `GET /api/combustibles/:id/documentos/:docId/archivo` — descarga de un documento.
- `POST /api/ejecutar-combustibles` (con `nits` opcional para pruebas).

## Risks / Trade-offs

- **Mapeo del JSON**: los códigos del formulario no coinciden 1:1 con los nombres del JSON → el spike resuelve el mapeo exacto y se documenta.
- **Equivalencia DIM↔DAM**: puede haber campos faltantes o con otro nombre en la DAM → el spike lo confirma; si faltan campos se registran como nulos o se ajusta el mapeo (se informa al usuario).
- **Factura de transporte con 2 ítems**: el flete origen→frontera y frontera→destino son dos ítems de la factura de transporte → se identifican y se suman para `total_flete_usd`.
- **`fecha` de arribo**: hay que identificar el campo exacto del manifiesto/PRM (¿`fecTra`, `fecIng` o un campo de arribo específico?).

## Migration Plan

- Aditivo: nueva tabla `combustibles` (aplicada idempotente al arranque) y nuevo volumen `documentos-despacho`.
- Rollback: detener servicios; la re-corrida es idempotente por `UNIQUE(dim_dam)`.
