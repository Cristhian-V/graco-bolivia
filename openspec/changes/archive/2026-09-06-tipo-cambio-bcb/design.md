## Context

El sistema ya extrae `combustibles` y parseaba el tipo de cambio del PDF de la factura de transporte (`scraper/facturaTransporte.js`). El cruce contra el BCB mostró que ese dato es poco confiable (31/98 con T/C desactualizado o erróneo). El spike confirmó que el BCB expone la cotización diaria scrapeable en .xls. Ver `proposal.md`.

Puntos fijos:
- Fuente oficial: `https://www.bcb.gob.bo/librerias/indicadores/otras/otras_imprimir2XLS.php?qdd=DD&qmm=MM&qaa=YYYY` → .xls con la fila `ESTADOS UNIDOS, DOLAR, USD, <valor>`.
- Primera carga: `cotizacion.xls` (cotizaciones oficiales 2026, días 1-31 × meses).
- Decisión: confiar siempre en el BCB, fecha exacta, y aplicar a todos los casos (incluidas facturas en bolivianos).

## Goals / Non-Goals

**Goals:**
- Crear la tabla `tipo_cambio` y cargar el histórico desde `cotizacion.xls`.
- Actualizar el TC desde el endpoint del BCB.
- En `combustibles`, tomar `tipo_cambio_trans` del BCB por `fecha_factura_trans` y recalcular `flete_total_bs`.

**Non-Goals:**
- No se modifica la extracción de la fecha de la factura (sigue saliendo de `camDin.fecEmi`).
- No se elimina aún el parseo del PDF (queda en desuso; se conserva solo para extraer la fecha si fuera necesario).

## Decisions

### Fuente del tipo de cambio: BCB (no el PDF)

- `tipo_cambio_trans = tipo_cambio[fecha_factura_trans]` (fecha exacta). Si no hay cotización para la fecha, queda nulo y el registro se marca (rojo suave, como hoy).
- Del PDF de la factura de transporte ya no se extrae el T/C; solo se usa su fecha (`fecha_factura_trans`).

### Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS tipo_cambio (
  fecha date PRIMARY KEY,
  valor numeric NOT NULL,
  fuente text,               -- 'cotizacion.xls' | 'bcb'
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
```

### Carga inicial (cotizacion.xls)

- Convertir el `.xls` a CSV/parsearlo (libreoffice o una librería Node) y leer los días (1-31) × meses (JUNIO…DICIEMBRE), insertando `fecha` + `valor` con `ON CONFLICT (fecha) DO UPDATE`.

### Actualización desde el BCB

- Para una fecha: `GET otras_imprimir2XLS.php?qdd=&qmm=&qaa=` → parsear la fila `ESTADOS UNIDOS` (USD) → upsert.
- Para llenar un rango (ej. las fechas de las facturas sin TC), iterar las fechas faltantes.

### Aplicación en combustibles

- Nuevo paso en `reprocesarCombustibles` / `runCombustibles`: después de obtener `fecha_factura_trans`, buscar `tipo_cambio[fecha]` y asignar `tipo_cambio_trans`; `flete_total_bs = flete_total_usd × tipo_cambio_trans`.
- Se quita el uso de `parsearFacturaTransporte` para el T/C (se conserva para `tramo_flete` y, si aplica, la fecha).

### API y frontend

- `GET /api/tipo-cambio` (histórico), `GET /api/tipo-cambio/:fecha` (por fecha), `POST /api/tipo-cambio/actualizar` (dispara la actualización desde el BCB para un rango).
- Nueva sección "Tipo de cambio" en el frontend (tabla fecha/valor) y botón "Actualizar".

## Risks / Trade-offs

- **El BCB cambia su endpoint/formato** → aislar el cliente HTTP y el parser en un módulo; falla explícita y logueada.
- **Fechas sin cotización (fines de semana/festivos)** → `tipo_cambio_trans` queda nulo y el registro se marca; opcionalmente se podría usar la última cotización hábil (fuera de alcance por ahora, decisión del usuario: fecha exacta).
- **`cotizacion.xls` solo cubre 2026** → la primera carga cubre el período actual; fechas anteriores quedan sin valor (marcadas).
- **Dependencia de `extraccion-datos-combustibles` no archivado** → el delta de `combustibles` de este change se archiva después de aquel; el `combustibles` main spec se crea al archivar `extraccion-datos-combustibles` y luego este agrega el requisito del BCB.

## Migration Plan

- Aditivo: nueva tabla `tipo_cambio` (idempotente). Se siembra con `cotizacion.xls`.
- Re-proceso offline de `combustibles` para asignar el TC del BCB (sin pegarle a SUMA).
- Rollback: la tabla es aditiva; el re-proceso es idempotente por `fecha`.
