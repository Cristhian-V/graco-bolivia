## Context

Ver `proposal.md` y los deltas. YPFB (NIT `1020269020`) tiene 24 declaraciones de diésel (jul–sep 2026) en `combustibles`/`detalles`. La factura comercial está en `documentos_despacho` (tipo `CM-003`) y su `num` tiene la forma `PI 2026082808`. La edición de Combustibles usa `PUT /api/combustibles/:id` (`COLUMNAS_EDITABLES`) y replica a `detalles`.

## Goals / Non-Goals

**Goals:**
- Guardar los campos manuales de proforma de YPFB en una tabla liviana y editarlos desde Combustibles.
- Mostrar la comparación de precio unitario por proveedor.

**Non-Goals:**
- No duplicar las columnas de `combustibles` en la tabla YPFB.
- No extraer los campos de proforma de la DIM.
- No cambia el scraper.

## Decisions

### D1 — Tabla liviana `ypfb_proformas`

```sql
CREATE TABLE IF NOT EXISTS ypfb_proformas (
  dim_dam         text PRIMARY KEY,
  nro_proforma    text,
  premio          numeric,
  flete           numeric,
  precio_unitario numeric,
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);
```
Un registro por `dim_dam` (enlace a `combustibles`). El resto de los datos (proveedor, incoterm, cantidad_m3, pais_procedencia) se reutilizan del combustible.

### D2 — Edición desde Combustibles

- `GET /api/combustibles` hace `LEFT JOIN ypfb_proformas` para incluir `nro_proforma`, `premio`, `flete`, `precio_unitario` en cada fila (nulos para no YPFB).
- `PUT /api/combustibles/:id`: si el `importador_nit` del registro es `1020269020`, hace `INSERT ... ON CONFLICT (dim_dam) DO UPDATE` en `ypfb_proformas` con los cuatro campos del cuerpo. Para otros clientes, ignora esos campos.
- El formulario de edición muestra los cuatro campos solo si `importador_nit === '1020269020'`; `nro_proforma` se precarga con el número de la factura comercial (`CM-003`) del registro cuando el campo está vacío.

### D3 — Agregación `chart=diesel-ypfb`

Rama nueva en `getDashboardData` que lee `detalles` JOIN `ypfb_proformas` por `dim_dam`, filtra `importador_nit = '1020269020'` y los filtros (`anio`, `mes`, `incoterm`, `suministro`), y devuelve filas crudas:
`{ proforma, proveedor, pais_procedencia, incoterm, fecha, volumen, premio, flete, precio }`.
El frontend agrupa por proveedor y por `pais_procedencia`, calcula **promedios ponderados por volumen** y ordena por precio. Alternativa: pre-agrupar en el backend; descartada porque el HTML ya define la jerarquía y es un volumen de datos pequeño (24 filas).

### D4 — Sección de comparación

Nueva tarjeta en Presentación, después de "Tarifa Flete Prom. por Tramo (Bs/m³)", con:
- Filtros **Incoterm** (segmentado con los valores presentes) y **Suministro** (`Todos` + países), año y mes único (`singleMonth`), reutilizando `CardFrame`/`useDashboardData`.
- Tabla: Proveedor | N.º proforma | Volumen (m³) | Premio (USD/m³) | Flete (USD/m³) | Precio unitario (USD/m³), con sub-filas por país (rama `└`) y pie "Promedio YPFB · INCOTERM".
- Valores en USD/m³, promedio ponderado por volumen.

## Risks / Trade-offs

- [Registros de YPFB sin datos de proforma] → la tabla los muestra con celdas vacías; los promedios consideran solo los que tienen valor.
- [El `nro_proforma` puede venir en formatos distintos (`3804786`, `PI 2026082808`)] → se usa el texto tal cual de la factura comercial.
- [Datos pequeños (24 filas)] → el cálculo en el frontend es simple y suficiente.

## Migration Plan

1. Agregar `db/init/012_ypfb_proformas.sql` (idempotente); el backend la crea al arrancar.
2. Backend: `LEFT JOIN` en `GET /combustibles`, guardado YPFB en `PUT /combustibles/:id`, rama `chart=diesel-ypfb`.
3. Frontend: campos extra en la edición y nueva sección.
4. Rollback: quitar la sección y la rama; la tabla queda inerte.
