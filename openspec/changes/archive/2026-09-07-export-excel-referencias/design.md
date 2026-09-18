## Context

El sistema ya extrae `combustibles` y tiene las tablas `clientes` y `aduanas` (esta última solo con `codigo_aduana` y `nombre`). El archivo `combustibles_export.xlsx` es el modelo de exportación: 8 hojas con un orden definido de columnas. Ver `proposal.md`.

Puntos fijos:
- Hoja "detalles" del modelo (23 columnas, en orden): `crt, uso, fecha, aduana, dim_dam, incoterm, producto, proveedor, importador, transporte, cantidad_m3, tipo_cambio_dim, tramo_flete, us_unitario, importador_nit, pais_procedencia, modalidad_despacho, us_precio_marcador, fecha_factura_trans, flete_total_usd, flete_total_bs, tipo_cambio_trans, tarifa_flete_usd_m3`.
- El export final agrega `tarifa_flete_bob_m3` al final (24 columnas).
- Referencia: `proveedores(nombre)`, `productos(nombre, nandina)`, `paises(nombre, codigo_iso2)`, `incoterms(codigo, descripcion)`, `transportes(nombre)`; `aduanas` gana `tipo` y `ciudad`.

## Goals / Non-Goals

**Goals:**
- Calcular `tarifa_flete_bob_m3` y redondear los numéricos a 2 decimales en la BD.
- Exportar el Excel de 8 hojas con filtro de mes/año (solo "detalles").
- Crear las tablas de referencia (esquema + seed desde el Excel) y su alta vía web (solo añadir).

**Non-Goals:**
- No se editan ni eliminan registros de referencia (solo alta).
- No se modifica el flujo de extracción de PRMs/manifiestos (el cliente nuevo ya entra por `activo = true`).

## Decisions

### `tarifa_flete_bob_m3` y redondeo

- `tarifa_flete_bob_m3 = flete_total_bs / cantidad_m3` (nulo si `cantidad_m3` es 0 o nulo).
- Redondeo a 2 decimales al guardar: usar `ROUND(valor, 2)` (o redondeo en JS) sobre todos los campos numéricos de `combustibles` (`cantidad_m3`, `tipo_cambio_dim`, `us_unitario`, `us_precio_marcador`, `flete_total_usd`, `flete_total_bs`, `tipo_cambio_trans`, `tarifa_flete_usd_m3`, `tarifa_flete_bob_m3`). El redondeo se aplica en `mapDeclaracion`/`calcularFletes` antes del upsert.

### Modelo de datos de referencia

```sql
CREATE TABLE IF NOT EXISTS proveedores (
  id bigserial PRIMARY KEY, nombre text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS productos (
  id bigserial PRIMARY KEY, nombre text NOT NULL, nandina text, UNIQUE (nombre, nandina)
);
CREATE TABLE IF NOT EXISTS paises (
  id bigserial PRIMARY KEY, nombre text NOT NULL, codigo_iso2 text, UNIQUE (codigo_iso2)
);
CREATE TABLE IF NOT EXISTS incoterms (
  id bigserial PRIMARY KEY, codigo text NOT NULL UNIQUE, descripcion text
);
CREATE TABLE IF NOT EXISTS transportes (
  id bigserial PRIMARY KEY, nombre text NOT NULL UNIQUE
);
ALTER TABLE aduanas ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE aduanas ADD COLUMN IF NOT EXISTS ciudad text;
```

- Seed desde `combustibles_export.xlsx` (hojas proveedores, productos, paises, incoterms, transportes; y `aduanas` con tipo/ciudad).

### Exportación Excel multi-hoja

- Reutilizar `exceljs` (ya instalado). El endpoint `GET /api/combustibles/export` pasa a generar 8 hojas en el orden del modelo, con `detalles` filtrado por `?mes=YYYY-MM` (opcional) y con `tarifa_flete_bob_m3` al final.
- Las hojas de referencia se llenan con `SELECT *` de sus tablas.

### Alta de referencias (solo añadir)

- Endpoints: `POST /api/referencias/:tabla` (tabla ∈ {proveedores, productos, paises, incoterms, transportes, aduanas, clientes}) que inserta con `ON CONFLICT DO NOTHING` y devuelve 409 si ya existe.
- Frontend: nueva sección "Referencias" con un selector de tabla y un formulario de alta (campos según la tabla). Para `clientes`, el alta crea el registro con `activo = true` (entra en los procesos).

## Risks / Trade-offs

- **El modelo Excel cambia** → el orden de columnas se parametriza en una constante (lista de columnas) fácil de ajustar.
- **Redondeo en BD** → se pierde precisión; se aplica solo a los campos numéricos de `combustibles`, no a `raw` (que conserva el JSON original).
- **`tarifa_flete_bob_m3` con `cantidad_m3` = 0** → queda nulo.

## Migration Plan

- Aditivo: nuevas tablas de referencia + seed; `aduanas` gana `tipo`/`ciudad`; `combustibles` gana `tarifa_flete_bob_m3` (todo idempotente).
- Re-proceso de `combustibles` para calcular `tarifa_flete_bob_m3` y redondear.
- Rollback: esquema aditivo; el re-proceso es idempotente.
