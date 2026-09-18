-- Capa de presentación: tabla de detalles (espejo desnormalizado de combustibles)
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS detalles (
  id                  bigserial PRIMARY KEY,
  crt                 text,
  uso                 text,
  fecha               date,
  aduana              text,
  dim_dam             text NOT NULL,
  incoterm            text,
  producto            text,
  proveedor           text,
  importador          text,
  transporte          text,
  cantidad_m3         numeric,
  tipo_cambio_dim     numeric,
  tramo_flete         text,
  us_unitario         numeric,
  importador_nit      text,
  pais_procedencia    text,
  modalidad_despacho  text,
  us_precio_marcador  numeric,
  fecha_factura_trans date,
  flete_total_usd     numeric,
  flete_total_bs      numeric,
  tipo_cambio_trans   numeric,
  tarifa_flete_usd_m3 numeric,
  tarifa_flete_bob_m3 numeric,
  creado_en           timestamptz NOT NULL DEFAULT now(),
  actualizado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dim_dam)
);

CREATE INDEX IF NOT EXISTS idx_detalles_fecha ON detalles (fecha);
